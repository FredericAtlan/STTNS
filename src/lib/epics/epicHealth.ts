import type { SttnsEpic, SttnsUserStory } from "@/types/sttns";

export type EpicDoRInput = {
  title?: string | null;
  objective?: string | null;
  linkedStoryCount: number;
};

export type EpicDoRState = {
  titleReady: boolean;
  definitionReady: boolean;
  storiesLinked: boolean;
  isGhost: boolean;
  readyForProposed: boolean;
  gaps: string[];
};

export function computeEpicDoR(input: EpicDoRInput): EpicDoRState {
  const titleReady = !!input.title?.trim();
  const definitionReady = !!input.objective?.trim();
  const storiesLinked = input.linkedStoryCount > 0;
  const isGhost = !storiesLinked;

  const gaps: string[] = [];
  if (!titleReady) gaps.push("Nom de l'Epic");
  if (!definitionReady) gaps.push("Définition / objectif de valeur");
  if (!storiesLinked) gaps.push("Au moins 1 user story rattachée");

  const readyForProposed = titleReady && definitionReady && storiesLinked;

  return {
    titleReady,
    definitionReady,
    storiesLinked,
    isGhost,
    readyForProposed,
    gaps,
  };
}

export function epicDoRFromRecord(
  epic: Pick<SttnsEpic, "title" | "objective">,
  linkedStoryCount: number
): EpicDoRState {
  return computeEpicDoR({
    title: epic.title,
    objective: epic.objective,
    linkedStoryCount,
  });
}

export function isOrphanStoryForEpic(story: Pick<SttnsUserStory, "epic_id">): boolean {
  return !story.epic_id?.trim();
}

export function countGhostEpics(
  epics: Pick<SttnsEpic, "id">[],
  storyCountByEpicId: Map<string, number>
): number {
  return epics.filter((epic) => (storyCountByEpicId.get(epic.id) ?? 0) === 0).length;
}
