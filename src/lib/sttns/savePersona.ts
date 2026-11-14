/**
 * @deprecated Persistance catalogue `sttns_personas` DRAFT/READY.
 * Étape B : UI → `/why`. Étape C : écritures gelées (`LEGACY_READ_ONLY`).
 * A1 : FK stories/epics → work_items. Ne pas DROP avant A4.
 */
import { createClient } from "@/lib/supabase/server";
import { requireDraftAuthor, requireProjectMember } from "@/lib/sttns/access";
import type { SttnsJobType, SttnsPersonaJob, SttnsPersonaPainPoint } from "@/types/sttns";
import {
  isValidPersonaCode,
  normalizePersonaCode,
  suggestNextPersonaCode,
} from "@/lib/personas/personaCodes";
import { legacyPersonaFieldsFromRelations } from "@/lib/sttns/personas";
import { fetchPersonaVocabulary } from "@/lib/personas/personaVocabulary";
import { syncSpinePersonaSegmentFromLegacy } from "@/lib/sttns/personaSegmentBridge";
import { legacyPersonaWriteForbidden } from "@/lib/sttns/legacyPersonasFreeze";

export type PersonaPainPointInput = {
  client_key: string;
  label: string;
  description: string | null;
  sort_order: number;
};

export type PersonaJobInput = {
  client_key: string;
  job_type: SttnsJobType;
  description: string;
  sort_order: number;
  resolved_pain_client_keys: string[];
};

export async function savePersonaWithRelations(
  projectId: string,
  data: {
    id?: string;
    name: string;
    persona_code: string;
    project_scope: "active" | "reference";
    tier_label: string;
    profile_summary: string;
    persona_status: "DRAFT" | "READY";
    pain_points: PersonaPainPointInput[];
    jobs: PersonaJobInput[];
    sort_order?: number;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const name = data.name.trim();
  if (!name) return { ok: false, error: "Le nom du persona est obligatoire." };

  let personaId = data.id;

  let personaCode: string;
  if (personaId) {
    personaCode = normalizePersonaCode(data.persona_code);
    if (!isValidPersonaCode(personaCode)) {
      return { ok: false, error: "La référence persona doit être au format P1, P2, etc." };
    }
  } else {
    const { data: existingCodes } = await supabase
      .from("sttns_personas")
      .select("persona_code")
      .eq("project_id", projectId)
      .is("archived_at", null);
    personaCode = suggestNextPersonaCode(
      (existingCodes ?? []).map((row) => row.persona_code as string | null)
    );
  }

  const projectScope = data.project_scope === "reference" ? "reference" : "active";

  const painPoints = data.pain_points
    .map((p, i) => ({
      client_key: p.client_key.trim(),
      label: p.label.trim(),
      description: p.description?.trim() || null,
      sort_order: p.sort_order ?? i + 1,
    }))
    .filter((p) => p.label && p.client_key);

  const jobs = data.jobs
    .map((j, i) => ({
      client_key: j.client_key.trim(),
      job_type: j.job_type,
      description: j.description.trim(),
      sort_order: j.sort_order ?? i + 1,
      resolved_pain_client_keys: j.resolved_pain_client_keys.filter(Boolean),
    }))
    .filter((j) => j.description && j.client_key);

  if (data.persona_status === "READY") {
    const painKeys = new Set(painPoints.map((p) => p.client_key));
    const covered = new Set(
      jobs.flatMap((j) => j.resolved_pain_client_keys).filter((k) => painKeys.has(k))
    );
    const uncovered = painPoints.filter((p) => !covered.has(p.client_key));
    if (uncovered.length) {
      return {
        ok: false,
        error:
          "Impossible de passer en READY : certaines frictions ne sont couvertes par aucun job.",
      };
    }
  }

  const legacy = legacyPersonaFieldsFromRelations(painPoints, jobs);

  const basePayload = {
    project_id: projectId,
    name,
    persona_code: personaCode,
    project_scope: projectScope,
    tier_label: data.tier_label.trim() || null,
    profile_summary: data.profile_summary.trim() || null,
    persona_status: data.persona_status,
    friction_summary: legacy.friction_summary,
    pain_point_detail: legacy.pain_point_detail,
    job_functional: legacy.job_functional,
    job_emotional: legacy.job_emotional,
    job_social: legacy.job_social,
  };

  const duplicateCodeQuery = supabase
    .from("sttns_personas")
    .select("id")
    .eq("project_id", projectId)
    .eq("persona_code", personaCode)
    .is("archived_at", null);
  if (personaId) duplicateCodeQuery.neq("id", personaId);
  const { data: duplicateCode } = await duplicateCodeQuery.maybeSingle();
  if (duplicateCode) {
    return { ok: false, error: `La référence ${personaCode} est déjà utilisée sur ce projet.` };
  }

  if (personaId) {
    const author = await requireDraftAuthor(projectId, "persona", personaId);
    if (!author.ok) return author;

    const { data: projectRow } = await supabase
      .from("sttns_projects")
      .select("personas_cast_locked_at")
      .eq("id", projectId)
      .single();

    const { persona_code: _lockedCode, ...updatePayload } = basePayload;
    if (projectRow?.personas_cast_locked_at) {
      delete (updatePayload as { project_scope?: string }).project_scope;
    }

    const { error } = await supabase
      .from("sttns_personas")
      .update(updatePayload)
      .eq("id", personaId)
      .eq("project_id", projectId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: inserted, error } = await supabase
      .from("sttns_personas")
      .insert({
        ...basePayload,
        sort_order: data.sort_order ?? 0,
        created_by: access.userId,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return { ok: false, error: error?.message ?? "Échec de création du persona." };
    }
    personaId = inserted.id;
  }

  const { error: delPainErr } = await supabase
    .from("sttns_persona_pain_points")
    .delete()
    .eq("persona_id", personaId);
  if (delPainErr) return { ok: false, error: delPainErr.message };

  const { error: delJobsErr } = await supabase
    .from("sttns_persona_jobs")
    .delete()
    .eq("persona_id", personaId);
  if (delJobsErr) return { ok: false, error: delJobsErr.message };

  const painKeyToUuid = new Map<string, string>();

  if (painPoints.length) {
    const { data: insertedPains, error } = await supabase
      .from("sttns_persona_pain_points")
      .insert(
        painPoints.map((p) => ({
          persona_id: personaId,
          client_key: p.client_key,
          label: p.label,
          description: p.description,
          sort_order: p.sort_order,
        }))
      )
      .select("id, client_key");
    if (error) return { ok: false, error: error.message };
    for (const row of insertedPains ?? []) {
      if (row.client_key) painKeyToUuid.set(row.client_key, row.id);
    }
  }

  if (jobs.length) {
    const { error } = await supabase.from("sttns_persona_jobs").insert(
      jobs.map((j) => ({
        persona_id: personaId,
        client_key: j.client_key,
        job_type: j.job_type,
        description: j.description,
        sort_order: j.sort_order,
        resolved_pain_point_ids: j.resolved_pain_client_keys
          .map((key) => painKeyToUuid.get(key))
          .filter((id): id is string => !!id),
      }))
    );
    if (error) return { ok: false, error: error.message };
  }

  if (!personaId) {
    return { ok: false, error: "Identifiant persona manquant après enregistrement." };
  }

  const vocabulary = await fetchPersonaVocabulary(supabase, projectId);
  await syncSpinePersonaSegmentFromLegacy(
    supabase,
    projectId,
    name,
    personaCode,
    data.tier_label,
    vocabulary
  );

  return { ok: true, id: personaId };
}

export async function deletePersona(
  personaId: string,
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const author = await requireDraftAuthor(projectId, "persona", personaId);
  if (!author.ok) return author;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_personas")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", personaId)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function duplicatePersona(
  personaId: string,
  projectId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const { data: persona, error } = await supabase
    .from("sttns_personas")
    .select("*, pain_points:sttns_persona_pain_points(*), jobs:sttns_persona_jobs(*)")
    .eq("id", personaId)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .single();

  if (error || !persona) return { ok: false, error: error?.message ?? "Persona introuvable." };

  const baseName = persona.name.trim();
  const copyName = baseName.endsWith(" Copy") ? `${baseName} 2` : `${baseName} Copy`;

  const { data: existingCodes } = await supabase
    .from("sttns_personas")
    .select("persona_code")
    .eq("project_id", projectId)
    .is("archived_at", null);
  const nextCode = suggestNextPersonaCode(
    (existingCodes ?? []).map((row) => row.persona_code as string | null)
  );

  const row = persona as typeof persona & {
    persona_status?: string;
    persona_code?: string | null;
    project_scope?: string | null;
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("sttns_personas")
    .insert({
      project_id: projectId,
      name: copyName,
      persona_code: nextCode,
      project_scope: row.project_scope === "reference" ? "reference" : "active",
      tier_label: persona.tier_label,
      profile_summary: persona.profile_summary,
      avatar_url: persona.avatar_url,
      persona_status: row.persona_status ?? "DRAFT",
      friction_summary: persona.friction_summary,
      pain_point_detail: persona.pain_point_detail,
      job_functional: persona.job_functional,
      job_emotional: persona.job_emotional,
      job_social: persona.job_social,
      sort_order: persona.sort_order + 1,
      created_by: access.userId,
      review_status: "draft",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "Échec de duplication." };
  }

  const painRows = (persona.pain_points ?? []) as (SttnsPersonaPainPoint & {
    client_key?: string | null;
  })[];
  const oldPainIdToNew = new Map<string, string>();

  if (painRows.length) {
    const { data: newPains, error: painErr } = await supabase
      .from("sttns_persona_pain_points")
      .insert(
        painRows.map((p) => ({
          persona_id: inserted.id,
          client_key: p.client_key,
          label: p.label,
          description: p.description,
          sort_order: p.sort_order,
        }))
      )
      .select("id");
    if (painErr) return { ok: false, error: painErr.message };
    painRows.forEach((p, i) => {
      const newId = newPains?.[i]?.id;
      if (newId) oldPainIdToNew.set(p.id, newId);
    });
  }

  const jobRows = (persona.jobs ?? []) as (SttnsPersonaJob & {
    client_key?: string | null;
    resolved_pain_point_ids?: string[] | null;
  })[];

  if (jobRows.length) {
    const { error: jobsErr } = await supabase.from("sttns_persona_jobs").insert(
      jobRows.map((j) => ({
        persona_id: inserted.id,
        client_key: j.client_key,
        job_type: j.job_type,
        description: j.description,
        sort_order: j.sort_order,
        resolved_pain_point_ids: (j.resolved_pain_point_ids ?? [])
          .map((oldId) => oldPainIdToNew.get(oldId))
          .filter((id): id is string => !!id),
      }))
    );
    if (jobsErr) return { ok: false, error: jobsErr.message };
  }

  return { ok: true, id: inserted.id };
}
