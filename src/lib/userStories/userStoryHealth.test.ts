import { describe, expect, it } from "vitest";
import {
  computeUserStoryDoR,
  computeUserStoryHealth,
  computeUserStoryPortfolioMetrics,
} from "./userStoryHealth";
import { SPINE_WHY_IDS } from "@/lib/sttns/spineWhySandbox";

const completeStoryInput = {
  primary_persona_id: SPINE_WHY_IDS.personaYao,
  target_persona_job_id: SPINE_WHY_IDS.jtbdYao,
  sprint_want: "scanner une facture",
  sprint_so_that: "gagner du temps",
  epic_id: SPINE_WHY_IDS.epicYao,
  initiative_id: SPINE_WHY_IDS.featureYao,
  impact_metric_id: "metric-1",
  impacts_north_star: false,
};

describe("computeUserStoryDoR", () => {
  it("requires persona, JTBD, sprint, epic, feature and impact for publish", () => {
    const incomplete = computeUserStoryDoR({
      primary_persona_id: "",
      target_persona_job_id: null,
      sprint_want: "",
      sprint_so_that: "",
    });
    expect(incomplete.readyToPublish).toBe(false);
    expect(incomplete.gaps.length).toBeGreaterThan(0);

    const complete = computeUserStoryDoR(completeStoryInput);
    expect(complete.readyToPublish).toBe(true);
    expect(complete.gaps).toHaveLength(0);
    expect(complete.impactMetricReady).toBe(true);
  });

  it("accepts north star as impact indicator", () => {
    const dor = computeUserStoryDoR({
      ...completeStoryInput,
      impact_metric_id: null,
      impacts_north_star: true,
    });
    expect(dor.impactMetricReady).toBe(true);
    expect(dor.readyToPublish).toBe(true);
  });
});

describe("computeUserStoryHealth", () => {
  it("marks healthy when DoR is complete", () => {
    const health = computeUserStoryHealth(completeStoryInput);
    expect(health.level).toBe("healthy");
    expect(health.hasEpic).toBe(true);
    expect(health.hasJtbd).toBe(true);
  });

  it("warns when JTBD is missing", () => {
    const health = computeUserStoryHealth({
      ...completeStoryInput,
      target_persona_job_id: null,
    });
    expect(health.level).toBe("warning");
    expect(health.tip).toContain("Warning STTNS");
  });
});

describe("computeUserStoryPortfolioMetrics", () => {
  it("aggregates compliance, orphans and impact matrix", () => {
    const metricsFlat = [
      { id: "m-eff", parent_id: null, legacy_key: "efficiency", name: "Efficiency" },
      { id: "m-leaf", parent_id: "m-eff", legacy_key: null, name: "Manual steps removed" },
    ];

    const portfolio = computeUserStoryPortfolioMetrics(
      [
        completeStoryInput,
        {
          epic_id: SPINE_WHY_IDS.epicAdja,
          primary_persona_id: SPINE_WHY_IDS.personaAdja,
          target_persona_job_id: null,
          sprint_want: "",
          sprint_so_that: "",
          initiative_id: null,
          impact_metric_id: "m-leaf",
          impacts_north_star: false,
        },
      ],
      metricsFlat
    );

    expect(portfolio.storyCount).toBe(2);
    expect(portfolio.incompleteCount).toBe(1);
    expect(portfolio.orphanCount).toBe(1);
    expect(portfolio.dorCompliantCount).toBe(1);
    expect(portfolio.dorCompliancePct).toBe(50);
    expect(portfolio.dominantImpact?.key).toBe("efficiency");
  });
});
