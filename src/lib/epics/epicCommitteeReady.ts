import type { SupabaseClient } from "@supabase/supabase-js";
import { epicDoRFromRecord } from "@/lib/epics/epicHealth";
import { fetchEpicLinkedStories } from "@/lib/sttns/epicReady";
import type { SttnsEpic, SttnsUserStory } from "@/types/sttns";

export const EPIC_COMMITTEE_SUBMIT_TOOLTIP =
  "Nom, définition, ≥ 1 user story rattachée et au moins une story validée (#2) avec décision BUILD ou LEARN.";

export type EpicCommitteeInput = Pick<SttnsEpic, "title" | "objective">;

export function storyGovernanceValidated(
  story: Pick<SttnsUserStory, "review_status" | "final_decision">
): boolean {
  return (
    story.review_status === "validated" &&
    (story.final_decision === "build" || story.final_decision === "learn")
  );
}

export function getEpicCommitteeGaps(
  epic: Pick<SttnsEpic, "title" | "objective">,
  linkedStories: Pick<
    SttnsUserStory,
    "review_status" | "final_decision" | "title"
  >[]
): string[] {
  const gaps: string[] = [];
  const dor = epicDoRFromRecord(epic, linkedStories.length);

  if (!dor.titleReady) gaps.push("Nom de l'Epic");
  if (!dor.definitionReady) gaps.push("Définition / objectif");
  if (!dor.storiesLinked) gaps.push("Au moins 1 user story rattachée");

  const validatedStories = linkedStories.filter(storyGovernanceValidated);
  if (linkedStories.length > 0 && validatedStories.length === 0) {
    gaps.push("Au moins une user story validée (#2) en BUILD ou LEARN");
  }

  return gaps;
}

export function isEpicCommitteeReady(
  epic: Pick<SttnsEpic, "title" | "objective">,
  linkedStories: Pick<SttnsUserStory, "review_status" | "final_decision" | "title">[]
): boolean {
  return getEpicCommitteeGaps(epic, linkedStories).length === 0;
}

export function epicCommitteeReadinessError(
  epic: Pick<SttnsEpic, "title" | "objective">,
  linkedStories: Pick<SttnsUserStory, "review_status" | "final_decision" | "title">[]
): string {
  const gaps = getEpicCommitteeGaps(epic, linkedStories);
  if (gaps.length === 0) return "";
  return `Impossible de soumettre la validation epic — il manque : ${gaps.join(" ; ")}.`;
}

export function assertEpicCommitteeReady(
  epic: Pick<SttnsEpic, "title" | "objective">,
  linkedStories: Pick<SttnsUserStory, "review_status" | "final_decision" | "title">[]
): { ok: true } | { ok: false; error: string } {
  const error = epicCommitteeReadinessError(epic, linkedStories);
  if (error) return { ok: false, error };
  return { ok: true };
}

export async function fetchEpicForCommittee(
  supabase: SupabaseClient,
  projectId: string,
  epicId: string
): Promise<SttnsEpic | null> {
  const { data } = await supabase
    .from("sttns_epics")
    .select("id, project_id, title, objective, status, review_status, created_by")
    .eq("id", epicId)
    .eq("project_id", projectId)
    .single();

  return (data as SttnsEpic | null) ?? null;
}

export async function loadEpicCommitteeContext(
  supabase: SupabaseClient,
  projectId: string,
  epicId: string
) {
  const [epic, linkedStories] = await Promise.all([
    fetchEpicForCommittee(supabase, projectId, epicId),
    fetchEpicLinkedStories(supabase, projectId, epicId),
  ]);
  return { epic, linkedStories };
}
