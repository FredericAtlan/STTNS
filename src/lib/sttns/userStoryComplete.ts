import { computeUserStoryDoR } from "@/lib/userStories/userStoryHealth";

export const USER_STORY_VALIDATION_TOOLTIP =
  "Complétez la DoR : persona, JTBD, sprint, lien epic, lien feature et indicateur d'impact.";

export const USER_STORY_SAVE_COMPLETE_LABEL = "Enregistrer et soumettre au comité";

export const USER_STORY_SAVE_COMPLETE_TOOLTIP =
  "Enregistre la fiche et lance la revue d'équipe en un clic (DoR complète requise).";

export const USER_STORY_SUBMIT_HINT =
  "DoR complète : utilisez le bouton « Enregistrer et soumettre au comité » pour lancer la revue.";

export type UserStoryCompletenessInput = {
  epic_id?: string | null;
  primary_persona_id?: string | null;
  target_persona_job_id?: string | null;
  sprint_want?: string | null;
  sprint_so_that?: string | null;
  initiative_id?: string | null;
  impact_metric_id?: string | null;
  impacts_north_star?: boolean;
};

export function getUserStoryCompletenessGaps(story: UserStoryCompletenessInput): string[] {
  return computeUserStoryDoR(story).gaps;
}

export function isUserStoryComplete(story: UserStoryCompletenessInput): boolean {
  return computeUserStoryDoR(story).readyToPublish;
}

export function userStoryCompletenessError(story: UserStoryCompletenessInput): string {
  const gaps = getUserStoryCompletenessGaps(story);
  if (gaps.length === 0) return "";
  return `Impossible de soumettre : complétez ${gaps.join(", ")}.`;
}

export function assertUserStoryComplete(
  story: UserStoryCompletenessInput
): { ok: true } | { ok: false; error: string } {
  const error = userStoryCompletenessError(story);
  if (error) return { ok: false, error };
  return { ok: true };
}
