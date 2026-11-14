import { describe, expect, it } from "vitest";
import { computeEpicPortfolioMetrics } from "@/lib/epics/epicPortfolioMetrics";

describe("computeEpicPortfolioMetrics", () => {
  it("aggregates dor, ghost and cascade stats", () => {
    const metrics = computeEpicPortfolioMetrics([
      {
        title: "E1",
        objective: "Obj",
        status: "draft",
        storyCount: 2,
        storyStatuses: [{ status: "validated" }, { status: "proposed" }],
      },
      {
        title: "E2",
        objective: null,
        status: "in_progress",
        storyCount: 0,
        storyStatuses: [],
      },
      {
        title: "E3",
        objective: "Ok",
        status: "in_progress",
        storyCount: 1,
        storyStatuses: [{ status: "proposed" }],
      },
    ]);

    expect(metrics.epicCount).toBe(3);
    expect(metrics.dorCompleteCount).toBe(2);
    expect(metrics.ghostCount).toBe(1);
    expect(metrics.cascadeInconsistencyCount).toBe(2);
    expect(metrics.validatedStoryCount).toBe(1);
    expect(metrics.totalLinkedStories).toBe(3);
  });
});
