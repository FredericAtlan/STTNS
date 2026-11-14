"use server";

/**
 * @deprecated Vocabulaire persona legacy — Étape B redirect · Étape C lecture seule.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import {
  DEFAULT_PERSONA_JOB_TYPE_DEFS,
  DEFAULT_PERSONA_TIER_DEFS,
  normalizePersonaVocabularyCode,
  upsertDefaultPersonaVocabulary,
} from "@/lib/personas/personaVocabulary";
import type { PersonaJobTypeDefInput, PersonaTierDefInput } from "@/lib/sttns/types";
import { legacyPersonaWriteForbidden } from "@/lib/sttns/legacyPersonasFreeze";

function formatVocabularySaveError(
  message: string,
  kind: "tier" | "job",
  code: string
): string {
  if (message.includes("sttns_persona_tier_defs_project_id_code_key")) {
    return `Le code segment « ${code} » existe déjà sur ce projet. Choisissez un autre code ou réinitialisez le référentiel.`;
  }
  if (message.includes("sttns_persona_job_type_defs_project_id_code_key")) {
    return `Le code type de job « ${code} » existe déjà sur ce projet.`;
  }
  if (message.includes("duplicate key")) {
    return kind === "tier"
      ? `Code segment « ${code} » en conflit — utilisez un code unique.`
      : `Code type « ${code} » en conflit — utilisez un code unique.`;
  }
  return message;
}

function revalidateVocabularyPaths(projectSlug: string) {
  revalidatePath(`/projects/${projectSlug}/personas`);
  revalidatePath(`/projects/${projectSlug}/personas/vocabulary`);
  revalidatePath(`/projects/${projectSlug}/personas/new`);
}

export async function savePersonaVocabularyAction(
  projectId: string,
  projectSlug: string,
  data: {
    tiers: PersonaTierDefInput[];
    jobTypes: PersonaJobTypeDefInput[];
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const tiers = data.tiers
    .map((row, index) => ({
      ...row,
      code: row.code.trim().toUpperCase(),
      title: row.title.trim(),
      description: row.description?.trim() || null,
      sort_order: row.sort_order ?? index + 1,
    }))
    .filter((row) => row.code && row.title);

  const jobTypes = data.jobTypes
    .map((row, index) => ({
      ...row,
      code: normalizePersonaVocabularyCode(row.code),
      title: row.title.trim(),
      hint: row.hint?.trim() || null,
      sort_order: row.sort_order ?? index + 1,
    }))
    .filter((row) => row.code && row.title);

  if (!tiers.length) {
    return { ok: false, error: "Au moins un segment actif est requis." };
  }
  if (!jobTypes.length) {
    return { ok: false, error: "Au moins un type de job actif est requis." };
  }

  const tierCodes = new Set<string>();
  for (const row of tiers) {
    if (tierCodes.has(row.code)) {
      return { ok: false, error: `Code segment dupliqué : ${row.code}` };
    }
    tierCodes.add(row.code);
  }

  const jobCodes = new Set<string>();
  for (const row of jobTypes) {
    if (jobCodes.has(row.code)) {
      return { ok: false, error: `Code type de job dupliqué : ${row.code}` };
    }
    jobCodes.add(row.code);
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const savedTierCodes = new Set(tiers.map((row) => row.code));
  const savedJobCodes = new Set(jobTypes.map((row) => row.code));

  // Upsert par (project_id, code) — réactive une ligne archivée au lieu d'insert en doublon
  for (const row of tiers) {
    const { error } = await supabase.from("sttns_persona_tier_defs").upsert(
      {
        project_id: projectId,
        code: row.code,
        title: row.title,
        description: row.description,
        sort_order: row.sort_order,
        archived_at: row.archived ? now : null,
        updated_at: now,
      },
      { onConflict: "project_id,code" }
    );
    if (error) {
      return {
        ok: false,
        error: formatVocabularySaveError(error.message, "tier", row.code),
      };
    }
  }

  for (const row of jobTypes) {
    const { error } = await supabase.from("sttns_persona_job_type_defs").upsert(
      {
        project_id: projectId,
        code: row.code,
        title: row.title,
        hint: row.hint,
        sort_order: row.sort_order,
        archived_at: row.archived ? now : null,
        updated_at: now,
      },
      { onConflict: "project_id,code" }
    );
    if (error) {
      return {
        ok: false,
        error: formatVocabularySaveError(error.message, "job", row.code),
      };
    }
  }

  // Archive les entrées actives absentes du formulaire (ex. tier retiré ou code renommé)
  const { data: activeTiers } = await supabase
    .from("sttns_persona_tier_defs")
    .select("id, code")
    .eq("project_id", projectId)
    .is("archived_at", null);

  for (const row of activeTiers ?? []) {
    if (!savedTierCodes.has(row.code)) {
      await supabase
        .from("sttns_persona_tier_defs")
        .update({ archived_at: now, updated_at: now })
        .eq("id", row.id);
    }
  }

  const { data: activeJobTypes } = await supabase
    .from("sttns_persona_job_type_defs")
    .select("id, code")
    .eq("project_id", projectId)
    .is("archived_at", null);

  for (const row of activeJobTypes ?? []) {
    if (!savedJobCodes.has(row.code)) {
      await supabase
        .from("sttns_persona_job_type_defs")
        .update({ archived_at: now, updated_at: now })
        .eq("id", row.id);
    }
  }

  revalidateVocabularyPaths(projectSlug);
  return { ok: true };
}

export async function resetPersonaVocabularyAction(
  projectId: string,
  projectSlug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const now = new Date().toISOString();
  const defaultTierCodes = new Set(DEFAULT_PERSONA_TIER_DEFS.map((r) => r.code));
  const defaultJobCodes = new Set(DEFAULT_PERSONA_JOB_TYPE_DEFS.map((r) => r.code));

  // Réactive les défauts (upsert — pas d'insert qui échoue sur l'unicité project_id+code)
  await upsertDefaultPersonaVocabulary(supabase, projectId);

  // Archive les entrées custom hors défaut STTNS
  const { data: extraTiers } = await supabase
    .from("sttns_persona_tier_defs")
    .select("id, code")
    .eq("project_id", projectId)
    .is("archived_at", null);

  for (const row of extraTiers ?? []) {
    if (!defaultTierCodes.has(row.code)) {
      await supabase
        .from("sttns_persona_tier_defs")
        .update({ archived_at: now, updated_at: now })
        .eq("id", row.id);
    }
  }

  const { data: extraJobTypes } = await supabase
    .from("sttns_persona_job_type_defs")
    .select("id, code")
    .eq("project_id", projectId)
    .is("archived_at", null);

  for (const row of extraJobTypes ?? []) {
    if (!defaultJobCodes.has(row.code)) {
      await supabase
        .from("sttns_persona_job_type_defs")
        .update({ archived_at: now, updated_at: now })
        .eq("id", row.id);
    }
  }

  revalidateVocabularyPaths(projectSlug);
  return { ok: true };
}
