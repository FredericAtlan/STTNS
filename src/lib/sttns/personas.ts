/**
 * @deprecated Accès lecture `sttns_personas` + helpers labels — monde DRAFT/READY.
 * Canonique = Spine Why (`sttns_work_items`). Conservé pour CSV, value chain, peer-review.
 */
import type {
  SttnsJobType,
  SttnsPersona,
  SttnsPersonaJob,
  SttnsPersonaPainPoint,
} from "@/types/sttns";
import type { SupabaseClient } from "@supabase/supabase-js";

export const USER_STORY_STATUS_LABELS = {
  proposed: "Proposée",
  validated: "Validée comité",
  in_sprint: "En sprint",
  delivered: "Livrée",
} as const;

export const PERSONA_COLORS = [
  "border-blue-500 bg-blue-50",
  "border-emerald-500 bg-emerald-50",
  "border-violet-500 bg-violet-50",
  "border-amber-500 bg-amber-50",
  "border-rose-500 bg-rose-50",
];

export const JOB_TYPE_LABELS: Record<SttnsJobType, string> = {
  functional: "Fonctionnel",
  social: "Social",
  emotional: "Émotionnel",
};

export const JOB_TYPE_ORDER: SttnsJobType[] = ["functional", "social", "emotional"];

export const PERSONA_WITH_RELATIONS_SELECT =
  "*, pain_points:sttns_persona_pain_points(*), jobs:sttns_persona_jobs(*)";

/** Load personas with pain points & jobs; falls back to legacy columns if child tables are missing. */
export async function fetchProjectPersonas(
  supabase: SupabaseClient,
  projectId: string
): Promise<SttnsPersona[]> {
  const { data, error } = await supabase
    .from("sttns_personas")
    .select(PERSONA_WITH_RELATIONS_SELECT)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("sort_order")
    .order("name");

  if (!error && data) {
    return normalizePersonas(data as SttnsPersona[]);
  }

  const legacy = await supabase
    .from("sttns_personas")
    .select("*")
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("sort_order")
    .order("name");

  if (legacy.error) return [];
  return normalizePersonas((legacy.data ?? []) as SttnsPersona[]);
}

export async function fetchPersonaById(
  supabase: SupabaseClient,
  projectId: string,
  personaId: string
): Promise<SttnsPersona | null> {
  const { data, error } = await supabase
    .from("sttns_personas")
    .select(PERSONA_WITH_RELATIONS_SELECT)
    .eq("id", personaId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!error && data) {
    return normalizePersonas([data as SttnsPersona])[0];
  }

  const legacy = await supabase
    .from("sttns_personas")
    .select("*")
    .eq("id", personaId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (legacy.error || !legacy.data) return null;
  return normalizePersonas([legacy.data as SttnsPersona])[0];
}

export function sortPersonaRelations(persona: SttnsPersona): SttnsPersona {
  return {
    ...persona,
    pain_points: [...(persona.pain_points ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
    jobs: [...(persona.jobs ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export function normalizePersonas(rows: SttnsPersona[]): SttnsPersona[] {
  return rows.map(sortPersonaRelations);
}

export function painPointsForPersona(persona: SttnsPersona): SttnsPersonaPainPoint[] {
  const fromRelations = persona.pain_points ?? [];
  if (fromRelations.length) return fromRelations;

  const legacy: SttnsPersonaPainPoint[] = [];
  if (persona.friction_summary || persona.pain_point_detail) {
    legacy.push({
      id: "legacy-pain",
      persona_id: persona.id,
      label: persona.friction_summary?.trim() || "Pain point",
      description: persona.pain_point_detail,
      sort_order: 1,
      created_at: persona.created_at,
    });
  }
  return legacy;
}

export function jobsForPersona(persona: SttnsPersona): SttnsPersonaJob[] {
  const fromRelations = persona.jobs ?? [];
  if (fromRelations.length) return fromRelations;

  const legacy: SttnsPersonaJob[] = [];
  const push = (job_type: SttnsJobType, description: string | null) => {
    if (!description?.trim()) return;
    legacy.push({
      id: `legacy-${job_type}`,
      persona_id: persona.id,
      job_type,
      description: description.trim(),
      sort_order: legacy.length + 1,
      created_at: persona.created_at,
    });
  };
  push("functional", persona.job_functional);
  push("emotional", persona.job_emotional);
  push("social", persona.job_social);
  return legacy;
}

export function jobsByType(
  persona: SttnsPersona,
  jobType: SttnsJobType
): SttnsPersonaJob[] {
  return jobsForPersona(persona).filter((j) => j.job_type === jobType);
}

export function primaryPainPointDetail(persona: SttnsPersona): string | null {
  const points = painPointsForPersona(persona);
  if (!points.length) return persona.pain_point_detail;
  const first = points[0];
  return first.description?.trim() || first.label.trim() || null;
}

export function primaryFrictionSummary(persona: SttnsPersona): string | null {
  const points = painPointsForPersona(persona);
  if (points.length) return points[0].label;
  return persona.friction_summary;
}

export function legacyPersonaFieldsFromRelations(
  painPoints: Pick<SttnsPersonaPainPoint, "label" | "description">[],
  jobs: Pick<SttnsPersonaJob, "job_type" | "description">[]
) {
  const firstPain = painPoints[0];
  const firstFunctional = jobs.find((j) => j.job_type === "functional");
  const firstEmotional = jobs.find((j) => j.job_type === "emotional");
  const firstSocial = jobs.find((j) => j.job_type === "social");

  return {
    friction_summary: firstPain?.label?.trim() || null,
    pain_point_detail:
      firstPain?.description?.trim() || firstPain?.label?.trim() || null,
    job_functional: firstFunctional?.description?.trim() || null,
    job_emotional: firstEmotional?.description?.trim() || null,
    job_social: firstSocial?.description?.trim() || null,
  };
}

/** Flat snapshot for copying persona context into a feature form. */
export function personaInitiativeSnapshot(persona: SttnsPersona) {
  const jobs = jobsForPersona(persona);
  return {
    pain_point_detail: primaryPainPointDetail(persona),
    job_functional:
      jobs.find((j) => j.job_type === "functional")?.description ??
      persona.job_functional,
    job_emotional:
      jobs.find((j) => j.job_type === "emotional")?.description ??
      persona.job_emotional,
    job_social:
      jobs.find((j) => j.job_type === "social")?.description ?? persona.job_social,
  };
}
