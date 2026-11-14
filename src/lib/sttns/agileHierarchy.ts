import { isExecutionGovernanceFeature } from "@/lib/sttns/governanceAxes";
import { EXECUTION_STATUS_LABELS } from "@/lib/sttns/constants";
import { EPIC_STATUS_LABELS } from "@/lib/sttns/epics";
import { USER_STORY_STATUS_LABELS } from "@/lib/sttns/personas";
import type {
  SttnsEpic,
  SttnsInitiative,
  SttnsInitiativeExecutionStatus,
  SttnsUserStory,
} from "@/types/sttns";

export type StoryBuildProgress = {
  total: number;
  deployed: number;
  inFlight: number;
  pending: number;
};

const IN_FLIGHT: SttnsInitiativeExecutionStatus[] = ["in_development", "in_test"];

/** Progression des features BUILD et LEARN rattachées à chaque story. */
export function computeStoryBuildProgressMap(
  initiatives: SttnsInitiative[]
): Record<string, StoryBuildProgress> {
  const map: Record<string, StoryBuildProgress> = {};

  for (const feature of initiatives) {
    if (!isExecutionGovernanceFeature(feature) || !feature.user_story_id) continue;
    const storyId = feature.user_story_id;
    const bucket = map[storyId] ?? { total: 0, deployed: 0, inFlight: 0, pending: 0 };
    bucket.total += 1;
    const status = (feature.execution_status ?? "pending") as SttnsInitiativeExecutionStatus;
    if (status === "deployed") bucket.deployed += 1;
    else if (IN_FLIGHT.includes(status)) bucket.inFlight += 1;
    else if (status === "pending") bucket.pending += 1;
    map[storyId] = bucket;
  }

  return map;
}

export function getCascadeWarnings(
  feature: SttnsInitiative,
  epic: SttnsEpic | null,
  story: Pick<SttnsUserStory, "title" | "status"> | null
): string[] {
  const warnings: string[] = [];
  const execution = (feature.execution_status ?? "pending") as SttnsInitiativeExecutionStatus;
  const featureActive = IN_FLIGHT.includes(execution);

  if (!story) {
    if (featureActive) {
      warnings.push("Feature en cours sans user story liée — la cascade ne peut pas se propager.");
    }
    return warnings;
  }

  if (
    featureActive &&
    story.status !== "in_sprint" &&
    story.status !== "delivered"
  ) {
    warnings.push(
      `Story « ${story.title} » est « ${USER_STORY_STATUS_LABELS[story.status]} » alors que la feature est « ${EXECUTION_STATUS_LABELS[execution]} » — démarrez le dev depuis la file ou corrigez les statuts.`
    );
  }

  if (
    featureActive &&
    epic &&
    epic.status !== "in_progress" &&
    epic.status !== "done"
  ) {
    warnings.push(
      `Epic « ${epic.title} » est « ${EPIC_STATUS_LABELS[epic.status] ?? epic.status} » — attendu « En cours » pendant l'exécution.`
    );
  }

  if (execution === "pending" && story.status === "in_sprint") {
    warnings.push(
      "Story déjà en sprint mais feature encore en attente — utilisez « Démarrer le dev » ou réordonnez la file."
    );
  }

  return warnings;
}

export const HIERARCHY_DOT = {
  epic: {
    draft: "bg-zinc-300",
    ready: "bg-blue-400",
    in_progress: "bg-emerald-500",
    done: "bg-teal-500",
  },
  story: {
    proposed: "bg-zinc-300",
    validated: "bg-violet-400",
    in_sprint: "bg-orange-400",
    delivered: "bg-teal-500",
  },
  feature: {
    pending: "bg-blue-400",
    in_development: "bg-orange-500",
    in_test: "bg-violet-500",
    deployed: "bg-teal-500",
  },
} as const;
