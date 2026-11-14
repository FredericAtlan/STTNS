import type { SupabaseClient } from "@supabase/supabase-js";
import { computePersonaCatalogHealth } from "@/lib/personas/personaCatalogHealth";
import { personaToFormValues } from "@/lib/personas/personaFormMappers";
import type { SttnsPersona } from "@/types/sttns";

export const PERSONA_COMMITTEE_SUBMIT_TOOLTIP =
  "Marquez le dossier Ready (matrice PP+JTBD complète : identité, frictions couvertes, jobs liés) avant de soumettre la validation #1 au comité.";

export type PersonaCommitteeInput = Pick<
  SttnsPersona,
  | "name"
  | "persona_code"
  | "tier_label"
  | "profile_summary"
  | "persona_status"
  | "pain_points"
  | "jobs"
>;

export function getPersonaCommitteeGaps(persona: PersonaCommitteeInput): string[] {
  const gaps: string[] = [];
  const values = personaToFormValues(persona as SttnsPersona);

  if (!persona.name?.trim()) gaps.push("Nom du persona");
  if (!persona.tier_label?.trim()) gaps.push("Segment (tier)");
  if (!persona.profile_summary?.trim()) gaps.push("Résumé profil");
  if (!persona.persona_code?.trim()) gaps.push("Code persona");

  const pains = values.painPoints.filter((p) => p.shortLabel.trim());
  const jobs = values.jobs.filter((j) => j.label.trim());
  if (pains.length === 0) gaps.push("Au moins un pain point");
  if (jobs.length === 0) gaps.push("Au moins un JTBD");

  const health = computePersonaCatalogHealth(persona as SttnsPersona);
  if (!health.matrixReady) {
    gaps.push("Matrice PP ↔ JTBD sans friction ignorée");
  }

  if (persona.persona_status !== "READY") {
    gaps.push("Statut éditorial Ready (dossier PP+JTBD complet)");
  }

  return gaps;
}

export function isPersonaCommitteeReady(persona: PersonaCommitteeInput): boolean {
  return getPersonaCommitteeGaps(persona).length === 0;
}

export function personaCommitteeReadinessError(persona: PersonaCommitteeInput): string {
  const gaps = getPersonaCommitteeGaps(persona);
  if (gaps.length === 0) return "";
  return `Impossible de soumettre la validation persona — il manque : ${gaps.join(" ; ")}.`;
}

export function assertPersonaCommitteeReady(
  persona: PersonaCommitteeInput
): { ok: true } | { ok: false; error: string } {
  const error = personaCommitteeReadinessError(persona);
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function fetchPersonaForCommittee(
  supabase: SupabaseClient,
  projectId: string,
  personaId: string
): Promise<SttnsPersona | null> {
  const { data } = await supabase
    .from("sttns_personas")
    .select(
      `
      id,
      project_id,
      name,
      persona_code,
      tier_label,
      profile_summary,
      persona_status,
      review_status,
      pain_points:sttns_persona_pain_points(*),
      jobs:sttns_persona_jobs(*)
    `
    )
    .eq("id", personaId)
    .eq("project_id", projectId)
    .single();

  return (data as SttnsPersona | null) ?? null;
}
