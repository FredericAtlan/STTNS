import { computeEpicDoR } from "@/lib/epics/epicHealth";
import {
  epicHasCascadeInconsistency,
  epicStoryValidationCounts,
} from "@/lib/sttns/epicCatalog";
import type { SttnsEpicStatus, SttnsUserStory } from "@/types/sttns";

export type EpicPortfolioInput = {
  title: string;
  objective: string | null;
  status: SttnsEpicStatus;
  storyCount: number;
  storyStatuses: Pick<SttnsUserStory, "status">[];
};

export type EpicPortfolioMetrics = {
  epicCount: number;
  dorCompliancePct: number;
  dorCompleteCount: number;
  incompleteDorCount: number;
  ghostCount: number;
  readyCount: number;
  inProgressCount: number;
  doneCount: number;
  cascadeInconsistencyCount: number;
  totalLinkedStories: number;
  validatedStoryCount: number;
};

export function computeEpicPortfolioMetrics(
  epics: EpicPortfolioInput[]
): EpicPortfolioMetrics {
  const epicCount = epics.length;
  let dorCompleteCount = 0;
  let ghostCount = 0;
  let readyCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;
  let cascadeInconsistencyCount = 0;
  let totalLinkedStories = 0;
  let validatedStoryCount = 0;

  for (const epic of epics) {
    const dor = computeEpicDoR({
      title: epic.title,
      objective: epic.objective,
      linkedStoryCount: epic.storyCount,
    });
    if (dor.readyForProposed) dorCompleteCount += 1;
    if (dor.isGhost) ghostCount += 1;

    if (epic.status === "ready") readyCount += 1;
    if (epic.status === "in_progress") inProgressCount += 1;
    if (epic.status === "done") doneCount += 1;

    if (epicHasCascadeInconsistency(epic.status, epic.storyStatuses)) {
      cascadeInconsistencyCount += 1;
    }

    const { total, validated } = epicStoryValidationCounts(epic.storyStatuses);
    totalLinkedStories += total;
    validatedStoryCount += validated;
  }

  const dorCompliancePct =
    epicCount > 0 ? Math.round((dorCompleteCount / epicCount) * 100) : 0;

  return {
    epicCount,
    dorCompliancePct,
    dorCompleteCount,
    incompleteDorCount: epicCount - dorCompleteCount,
    ghostCount,
    readyCount,
    inProgressCount,
    doneCount,
    cascadeInconsistencyCount,
    totalLinkedStories,
    validatedStoryCount,
  };
}

export const EPIC_IMPACT_ROOT_LABELS: Record<string, string> = {
  north_star: "North Star",
  efficiency: "Efficience",
  breadth: "Largeur",
  depth: "Profondeur",
  frequency: "Fréquence",
};
