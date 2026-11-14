import type { SupabaseClient } from "@supabase/supabase-js";
import { computeSttnsScore, STTNS_COMMITTEE_MIN_SCORE } from "@/lib/sttns/riceVisual";
import type { SttnsInitiative, SttnsUserStory, SttnsUserStoryStatus } from "@/types/sttns";

export const COMMITTEE_SUBMIT_TOOLTIP =
  "Complétez l'Epic, le persona, la métrique, les spécifications techniques, le Score STTNS legacy ≥ 40 et une User Story validée avant de soumettre au comité. Priorisation opérationnelle Spine = Impact / V/E (pas RICE).";

export type CommitteeFilterKey =
  | "epic"
  | "filter_epic_validated"
  | "filter0_persona"
  | "filter0_persona_validated"
  | "filter1_metric"
  | "technical_solution"
  | "filter2_rice"
  | "user_story_validated";

export const COMMITTEE_FILTER_LABELS: Record<CommitteeFilterKey, string> = {
  epic: "Epic rattachée",
  filter_epic_validated: "Epic validée (validation #3)",
  filter0_persona: "Persona cible renseigné",
  filter0_persona_validated: "Persona validé (validation #1)",
  filter1_metric: "Métrique d'impact / North Star",
  technical_solution: "Spécifications techniques renseignées",
  filter2_rice: `Score STTNS legacy ≥ ${STTNS_COMMITTEE_MIN_SCORE}/100`,
  user_story_validated: "User Story validée (liée)",
};

/** Libellés pour messages d'erreur — ce qui manque encore. */
export const COMMITTEE_GAP_LABELS: Record<CommitteeFilterKey, string> = {
  epic: "Epic rattachée",
  filter_epic_validated: "Epic validée par le comité (BUILD ou LEARN)",
  filter0_persona: "Persona cible",
  filter0_persona_validated: "Persona validé par le comité (BUILD)",
  filter1_metric: "Métrique d'impact ou lien North Star",
  technical_solution: "Spécifications techniques (Markdown / Mermaid)",
  filter2_rice: `Score STTNS legacy ≥ ${STTNS_COMMITTEE_MIN_SCORE}/100`,
  user_story_validated: "User Story validée et rattachée",
};

export type InitiativeCommitteeInput = {
  epic_id?: string | null;
  persona_id?: string | null;
  metric_id?: string | null;
  nsm_link_clear?: boolean | null;
  technical_solution?: string | null;
  rice_reach?: number | null;
  rice_impact?: number | null;
  rice_confidence?: number | null;
  rice_effort?: number | null;
  user_story_id?: string | null;
};

export function riceScoreForInitiative(initiative: InitiativeCommitteeInput): number | null {
  return computeSttnsScore(
    initiative.rice_reach ?? null,
    initiative.rice_impact ?? null,
    initiative.rice_confidence ?? null,
    initiative.rice_effort ?? null
  );
}

export function getCommitteeReadinessGaps(
  initiative: InitiativeCommitteeInput,
  linkedStory?: Pick<SttnsUserStory, "status"> | null,
  linkedPersona?: Pick<{ review_status?: string | null; final_decision?: string | null }, "review_status" | "final_decision"> | null,
  linkedEpic?: Pick<{ review_status?: string | null; final_decision?: string | null }, "review_status" | "final_decision"> | null
): CommitteeFilterKey[] {
  const gaps: CommitteeFilterKey[] = [];

  if (!initiative.epic_id) gaps.push("epic");
  else if (
    linkedEpic?.review_status !== "validated" ||
    (linkedEpic.final_decision !== "build" && linkedEpic.final_decision !== "learn")
  ) {
    gaps.push("filter_epic_validated");
  }
  if (!initiative.persona_id) gaps.push("filter0_persona");
  else if (
    linkedPersona?.review_status !== "validated" ||
    (linkedPersona.final_decision !== "build" && linkedPersona.final_decision !== "learn")
  ) {
    gaps.push("filter0_persona_validated");
  }
  if (!initiative.metric_id && !initiative.nsm_link_clear) gaps.push("filter1_metric");

  if (!initiative.technical_solution?.trim()) gaps.push("technical_solution");

  const score = riceScoreForInitiative(initiative);
  if (score == null || score < STTNS_COMMITTEE_MIN_SCORE) gaps.push("filter2_rice");

  if (!initiative.user_story_id) {
    gaps.push("user_story_validated");
  } else {
    const storyStatus = linkedStory?.status as SttnsUserStoryStatus | undefined;
    const readyStatuses: SttnsUserStoryStatus[] = ["validated", "in_sprint", "delivered"];
    if (!storyStatus || !readyStatuses.includes(storyStatus)) {
      gaps.push("user_story_validated");
    }
  }

  return gaps;
}

export function isInitiativeCommitteeReady(
  initiative: InitiativeCommitteeInput,
  linkedStory?: Pick<SttnsUserStory, "status"> | null,
  linkedPersona?: Pick<{ review_status?: string | null; final_decision?: string | null }, "review_status" | "final_decision"> | null,
  linkedEpic?: Pick<{ review_status?: string | null; final_decision?: string | null }, "review_status" | "final_decision"> | null
): boolean {
  return getCommitteeReadinessGaps(initiative, linkedStory, linkedPersona, linkedEpic).length === 0;
}

export function initiativeCommitteeReadinessError(
  initiative: InitiativeCommitteeInput,
  linkedStory?: Pick<SttnsUserStory, "status"> | null,
  linkedPersona?: Pick<{ review_status?: string | null; final_decision?: string | null }, "review_status" | "final_decision"> | null,
  linkedEpic?: Pick<{ review_status?: string | null; final_decision?: string | null }, "review_status" | "final_decision"> | null
): string {
  const gaps = getCommitteeReadinessGaps(initiative, linkedStory, linkedPersona, linkedEpic);
  if (gaps.length === 0) return "";
  const labels = gaps.map((key) => COMMITTEE_GAP_LABELS[key]);
  return `Impossible de soumettre au comité — il manque : ${labels.join(" ; ")}.`;
}

export function assertInitiativeCommitteeReady(
  initiative: InitiativeCommitteeInput,
  linkedStory?: Pick<SttnsUserStory, "status"> | null,
  linkedPersona?: Pick<{ review_status?: string | null; final_decision?: string | null }, "review_status" | "final_decision"> | null,
  linkedEpic?: Pick<{ review_status?: string | null; final_decision?: string | null }, "review_status" | "final_decision"> | null
): { ok: true } | { ok: false; error: string } {
  const error = initiativeCommitteeReadinessError(initiative, linkedStory, linkedPersona, linkedEpic);
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function fetchInitiativeLinkedEpic(
  supabase: SupabaseClient,
  projectId: string,
  epicId: string | null | undefined
): Promise<Pick<{ review_status?: string | null; final_decision?: string | null }, "review_status" | "final_decision"> | null> {
  if (!epicId) return null;
  const { data } = await supabase
    .from("sttns_epics")
    .select("review_status, final_decision")
    .eq("id", epicId)
    .eq("project_id", projectId)
    .single();
  return data ?? null;
}

export async function fetchInitiativeLinkedPersona(
  supabase: SupabaseClient,
  projectId: string,
  personaId: string | null | undefined
): Promise<Pick<{ review_status?: string | null; final_decision?: string | null }, "review_status" | "final_decision"> | null> {
  if (!personaId) return null;
  // Étape A3 — `sttns_initiatives.persona_id` retargeté vers `sttns_work_items(id)`
  // (type=persona). On lit le review_status / final_decision depuis metadata Spine
  // pour rester compatible avec les initiatives legacy dont le persona vit désormais
  // dans Spine Why (`sttns_work_items` type=persona).
  const { data: spineRow } = await supabase
    .from("sttns_work_items")
    .select("id, metadata")
    .eq("id", personaId)
    .eq("project_id", projectId)
    .eq("type", "persona")
    .maybeSingle();

  if (spineRow) {
    const meta = (spineRow.metadata ?? {}) as Record<string, unknown>;
    return {
      review_status:
        typeof meta.review_status === "string" ? (meta.review_status as string) : null,
      final_decision:
        typeof meta.final_decision === "string" ? (meta.final_decision as string) : null,
    };
  }

  // Fallback legacy (initiatives pré-remap A3 non encore migrées).
  const { data } = await supabase
    .from("sttns_personas")
    .select("review_status, final_decision")
    .eq("id", personaId)
    .eq("project_id", projectId)
    .maybeSingle();
  return data ?? null;
}

export async function fetchInitiativeLinkedStory(
  supabase: SupabaseClient,
  projectId: string,
  userStoryId: string | null | undefined
): Promise<Pick<SttnsUserStory, "id" | "status" | "title"> | null> {
  if (!userStoryId) return null;
  const { data } = await supabase
    .from("sttns_user_stories")
    .select("id, status, title")
    .eq("id", userStoryId)
    .eq("project_id", projectId)
    .single();
  return data ?? null;
}
