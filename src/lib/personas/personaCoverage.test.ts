import { describe, expect, it } from "vitest";

import { computePersonaCoverage, renumberPainPoints } from "./personaCoverage";

describe("computePersonaCoverage", () => {
  it("flags ignored pains as critical", () => {
    const report = computePersonaCoverage(
      [{ id: "pp-1", shortLabel: "Pas de liasse" }],
      [{ id: "jb-1", type: "functional", label: "Obtenir un prêt", resolvedPainPointIds: [] }]
    );
    expect(report.criticals).toHaveLength(1);
    expect(report.readyAllowed).toBe(false);
  });

  it("flags ghost jobs as warnings only", () => {
    const report = computePersonaCoverage(
      [{ id: "pp-1", shortLabel: "Pas de liasse" }],
      [
        {
          id: "jb-1",
          type: "functional",
          label: "Job lié",
          resolvedPainPointIds: ["pp-1"],
        },
        {
          id: "jb-2",
          type: "social",
          label: "Job fantôme",
          resolvedPainPointIds: [],
        },
      ]
    );
    expect(report.criticals).toHaveLength(0);
    expect(report.warnings).toHaveLength(1);
    expect(report.readyAllowed).toBe(true);
    expect(report.metrics.ecosystemCoveragePct).toBe(100);
    expect(report.metrics.ghostJobCount).toBe(1);
  });
});

describe("renumberPainPoints", () => {
  it("remaps job pain links when ids are renumbered", () => {
    const result = renumberPainPoints(
      [{ id: "pp-9", shortLabel: "B" }],
      [{ id: "jb-1", type: "functional", label: "J", resolvedPainPointIds: ["pp-9"] }]
    );
    expect(result.painPoints[0].id).toBe("pp-1");
    expect(result.jobs[0].resolvedPainPointIds).toEqual(["pp-1"]);
  });
});
