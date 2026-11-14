import { isStoryReadyForEpic } from "@/lib/sttns/epicReady";
import type { SttnsEpicStatus, SttnsUserStory } from "@/types/sttns";

export function epicStoryValidationCounts(stories: Pick<SttnsUserStory, "status">[]) {
  const total = stories.length;
  const validated = stories.filter((s) => isStoryReadyForEpic(s.status)).length;
  return { total, validated };
}

/** Epic en cours sans story validée — incohérence cascade. */
export function epicHasCascadeInconsistency(
  epicStatus: SttnsEpicStatus,
  stories: Pick<SttnsUserStory, "status">[]
): boolean {
  if (epicStatus !== "in_progress") return false;
  return !stories.some((s) => isStoryReadyForEpic(s.status));
}

export const EPIC_STATUS_BADGE: Record<string, string> = {
  draft: "border-zinc-200 bg-zinc-100 text-zinc-700",
  ready: "border-blue-200 bg-blue-50 text-blue-800",
  in_progress: "border-emerald-200 bg-emerald-50 text-emerald-800",
  done: "border-zinc-300 bg-zinc-50 text-zinc-600",
};
