import { describe, expect, it } from "vitest";
import { assertUserStoryComplete } from "./userStoryComplete";

describe("assertUserStoryComplete for committee submit", () => {
  const completeStory = {
    status: "proposed" as const,
    epic_id: "epic-1",
    initiative_id: "feat-1",
    primary_persona_id: "persona-1",
    target_persona_job_id: "job-1",
    sprint_want: "scanner une facture",
    sprint_so_that: "gagner du temps",
    impact_metric_id: "metric-1",
    impacts_north_star: false,
  };

  it("accepts a fully linked story row", () => {
    expect(assertUserStoryComplete(completeStory)).toEqual({ ok: true });
  });

  it("rejects partial rows missing epic (regression: submit select must load epic_id)", () => {
    const partial = {
      primary_persona_id: completeStory.primary_persona_id,
      sprint_want: completeStory.sprint_want,
      sprint_so_that: completeStory.sprint_so_that,
    };
    const result = assertUserStoryComplete(partial);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Lien epic");
    }
  });
});
