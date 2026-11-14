import type { ProductJourneyStep } from "@/components/product/ProductJourneyRail";
import { isStoryReadyForEpic } from "@/lib/sttns/epicReady";
import type { SttnsEpicStatus, SttnsUserStory } from "@/types/sttns";

/** Où en est le parcours depuis une fiche epic. */
export function journeyFromEpic(
  epicStatus: SttnsEpicStatus,
  stories: Pick<SttnsUserStory, "status">[]
): { activeStep: ProductJourneyStep; completed: ProductJourneyStep[] } {
  const readyStories = stories.filter((s) => isStoryReadyForEpic(s.status)).length;

  if (epicStatus === "done") {
    return {
      activeStep: "delivered",
      completed: ["epic", "stories", "features", "cockpit", "delivered"],
    };
  }

  if (epicStatus === "in_progress") {
    return {
      activeStep: "cockpit",
      completed: ["epic", "stories", "features"],
    };
  }

  if (epicStatus === "ready") {
    return {
      activeStep: "features",
      completed: ["epic", "stories"],
    };
  }

  if (readyStories > 0) {
    return {
      activeStep: "epic",
      completed: ["stories"],
    };
  }

  return {
    activeStep: "stories",
    completed: ["epic"],
  };
}
