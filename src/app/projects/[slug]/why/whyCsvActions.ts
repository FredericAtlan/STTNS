"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import type { ImportMode } from "@/lib/sttns/types";
import {
  buildWhyCsvBundle,
  isUuid,
  normalizeWhyCsvBundle,
  parseSolvedPainPointIds,
  type WhyCsvBundle,
} from "@/lib/sttns/whyCsv";
import { splitWhyJobs } from "@/lib/sttns/whySpine";
import {
  archivePersonaAction,
  saveJTBDAction,
  savePainPointAction,
  savePersonaAction,
} from "@/app/projects/[slug]/why/actions";

export async function exportWhyMatrixAction(projectId: string): Promise<
  | {
      ok: true;
      data: WhyCsvBundle;
      metadata: {
        projectName: string;
        projectSlug: string;
        exportDate: string;
        format: "sttns-why-spine-v1";
      };
    }
  | { ok: false; error: string }
> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const { data: project, error: projectError } = await supabase
    .from("sttns_projects")
    .select("name, slug")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return { ok: false, error: projectError?.message ?? "Projet introuvable." };
  }

  const [{ data: personas }, { data: jobs }] = await Promise.all([
    supabase
      .from("sttns_work_items")
      .select("id, title, code, status, metadata")
      .eq("project_id", projectId)
      .eq("type", "persona")
      .is("archived_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("sttns_work_items")
      .select("id, title, parent_id, status, metadata")
      .eq("project_id", projectId)
      .eq("type", "job")
      .is("archived_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  const { jtbds } = splitWhyJobs(jobs ?? []);
  const jtbdIds = jtbds.map((j) => j.id);
  const { data: solveLinks } =
    jtbdIds.length > 0
      ? await supabase
          .from("sttns_work_item_links")
          .select("source_id, target_id")
          .in("source_id", jtbdIds)
          .eq("type", "solves")
      : { data: [] };

  return {
    ok: true,
    data: buildWhyCsvBundle(personas ?? [], jobs ?? [], solveLinks ?? []),
    metadata: {
      projectName: project.name,
      projectSlug: project.slug,
      exportDate: new Date().toISOString(),
      format: "sttns-why-spine-v1",
    },
  };
}

async function archiveAllWhyPersonas(
  projectId: string,
  projectSlug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: personas, error } = await supabase
    .from("sttns_work_items")
    .select("id")
    .eq("project_id", projectId)
    .eq("type", "persona")
    .is("archived_at", null);

  if (error) return { ok: false, error: error.message };

  for (const persona of personas ?? []) {
    const res = await archivePersonaAction(persona.id, projectId, projectSlug);
    if (!res.ok) {
      return { ok: false, error: res.error ?? "Archivage Why impossible." };
    }
  }
  return { ok: true };
}

function severityFromCsv(raw: string): "low" | "medium" | "high" | "critical" {
  const v = raw.toLowerCase();
  if (v === "low" || v === "medium" || v === "high" || v === "critical") return v;
  return "medium";
}

export async function importWhyMatrixAction(
  projectId: string,
  projectSlug: string,
  mode: ImportMode,
  rawBundle: Record<string, unknown[]>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const bundle = normalizeWhyCsvBundle(rawBundle);
  if (
    bundle.personas.length === 0 &&
    bundle.pain_points.length === 0 &&
    bundle.jtbd.length === 0
  ) {
    return { ok: false, error: "Aucun persona / Pain Point / JTBD à importer." };
  }

  if (mode === "replace") {
    const cleared = await archiveAllWhyPersonas(projectId, projectSlug);
    if (!cleared.ok) return cleared;
  }

  const supabase = await createClient();
  const { data: existingPersonas } = await supabase
    .from("sttns_work_items")
    .select("id, code, title")
    .eq("project_id", projectId)
    .eq("type", "persona")
    .is("archived_at", null);

  const personaIdByCode = new Map<string, string>();
  const existingPersonaIds = new Set<string>();
  for (const p of existingPersonas ?? []) {
    existingPersonaIds.add(p.id);
    const code = (p.code ?? "").trim().toUpperCase();
    if (code) personaIdByCode.set(code, p.id);
  }

  const personaIdMap = new Map<string, string>();
  const painPointIdMap = new Map<string, string>();
  const forceCreate = mode === "append" || mode === "replace";

  for (const row of bundle.personas) {
    if (!row.title) {
      return { ok: false, error: "Persona sans titre dans le CSV." };
    }

    const code = row.code.trim() || undefined;
    let targetId: string | undefined;
    if (!forceCreate && isUuid(row.id) && existingPersonaIds.has(row.id)) {
      targetId = row.id;
    } else if (!forceCreate && code && personaIdByCode.has(code.toUpperCase())) {
      targetId = personaIdByCode.get(code.toUpperCase());
    }

    const res = await savePersonaAction(projectId, projectSlug, {
      id: targetId,
      name: row.title,
      code,
      description: row.description || undefined,
      segment: row.segment || undefined,
      doc_url: row.doc_url || undefined,
    });
    if (!res.ok || !("id" in res) || !res.id) {
      return {
        ok: false,
        error: `Persona « ${row.title} » : ${"error" in res ? res.error : "échec"}`,
      };
    }

    if (isUuid(row.id)) personaIdMap.set(row.id, res.id);
    if (code) personaIdByCode.set(code.toUpperCase(), res.id);
    existingPersonaIds.add(res.id);
  }

  function resolvePersonaId(personaId: string, personaCode: string): string | null {
    if (personaId && personaIdMap.has(personaId)) return personaIdMap.get(personaId)!;
    if (isUuid(personaId) && existingPersonaIds.has(personaId)) return personaId;
    const code = personaCode.trim().toUpperCase();
    if (code && personaIdByCode.has(code)) return personaIdByCode.get(code)!;
    return null;
  }

  const { data: existingJobs } = await supabase
    .from("sttns_work_items")
    .select("id")
    .eq("project_id", projectId)
    .eq("type", "job")
    .is("archived_at", null);
  const existingJobIds = new Set((existingJobs ?? []).map((j) => j.id));

  for (const row of bundle.pain_points) {
    if (!row.label) {
      return { ok: false, error: "Pain Point sans libellé dans le CSV." };
    }
    const parentId = resolvePersonaId(row.persona_id, row.persona_code);
    if (!parentId) {
      return {
        ok: false,
        error: `Pain Point « ${row.label} » : Persona parent introuvable (id/code).`,
      };
    }

    let targetId: string | undefined;
    if (!forceCreate && isUuid(row.id) && existingJobIds.has(row.id)) {
      targetId = row.id;
    }

    const res = await savePainPointAction(projectId, projectSlug, {
      id: targetId,
      persona_id: parentId,
      label: row.label,
      severity: severityFromCsv(row.severity),
    });
    if (!res.ok || !("id" in res) || !res.id) {
      return {
        ok: false,
        error: `Pain Point « ${row.label} » : ${"error" in res ? res.error : "échec"}`,
      };
    }
    if (isUuid(row.id)) painPointIdMap.set(row.id, res.id);
    existingJobIds.add(res.id);
  }

  for (const row of bundle.jtbd) {
    if (!row.title) {
      return { ok: false, error: "JTBD sans titre dans le CSV." };
    }
    const parentId = resolvePersonaId(row.persona_id, row.persona_code);
    if (!parentId) {
      return {
        ok: false,
        error: `JTBD : Persona parent introuvable pour « ${row.title.slice(0, 40)} ».`,
      };
    }

    let targetId: string | undefined;
    if (!forceCreate && isUuid(row.id) && existingJobIds.has(row.id)) {
      targetId = row.id;
    }

    const solved = parseSolvedPainPointIds(row.solved_pain_point_ids)
      .map((id) => painPointIdMap.get(id) ?? (existingJobIds.has(id) ? id : null))
      .filter((id): id is string => Boolean(id));

    const res = await saveJTBDAction(projectId, projectSlug, {
      id: targetId,
      persona_id: parentId,
      job_statement: row.title,
      solved_pain_points: solved,
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `JTBD « ${row.title.slice(0, 48)} » : ${res.error ?? "échec (syntaxe Quand […] ?)"}`,
      };
    }
    if (res.ok && "id" in res && res.id) existingJobIds.add(res.id);
  }

  revalidatePath(`/projects/${projectSlug}/why`);
  revalidatePath(`/projects/${projectSlug}/radar`);
  return { ok: true };
}
