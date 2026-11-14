import { describe, expect, it } from "vitest";
import {
  classifySeverity,
  computeHealthCopilot,
  copilotHrefFor,
  copilotShouldSurface,
  countWipStories,
} from "@/lib/sttns/healthCopilot";
import type {
  AnomalyContextLinkRow,
  AnomalyWorkItemLinkRow,
  AnomalyWorkItemRow,
} from "@/lib/sttns/radarAnomalies";

const NOW = new Date("2026-07-21T00:00:00Z");

function item(
  row: Partial<AnomalyWorkItemRow> & Pick<AnomalyWorkItemRow, "id" | "type" | "title">
): AnomalyWorkItemRow {
  return {
    metadata: null,
    parent_id: null,
    status: null,
    updated_at: null,
    ...row,
  };
}

describe("healthCopilot — KF4 barre Radar-lite", () => {
  it("countWipStories ne compte que les stories in_progress", () => {
    expect(
      countWipStories([
        item({ id: "s1", type: "story", title: "A", status: "in_progress" }),
        item({ id: "s2", type: "story", title: "B", status: "review" }),
        item({ id: "s3", type: "story", title: "C", status: "in_progress" }),
        item({ id: "f1", type: "feature", title: "F", status: "in_progress" }),
      ])
    ).toBe(2);
  });

  it("classifySeverity — impact_zero est toujours critical dès 1", () => {
    expect(classifySeverity("impact_zero", 0, { wipLimit: 5 })).toBe("ok");
    expect(classifySeverity("impact_zero", 1, { wipLimit: 5 })).toBe("critical");
  });

  it("classifySeverity — orphan/ghost passent en critical à ≥ 3", () => {
    expect(classifySeverity("orphan_feature", 1, { wipLimit: 5 })).toBe("warning");
    expect(classifySeverity("orphan_feature", 3, { wipLimit: 5 })).toBe("critical");
    expect(classifySeverity("ghost_jtbd", 2, { wipLimit: 5 })).toBe("warning");
    expect(classifySeverity("ghost_jtbd", 5, { wipLimit: 5 })).toBe("critical");
  });

  it("classifySeverity — WIP graduel selon plafond projet", () => {
    expect(classifySeverity("wip", 5, { wipLimit: 5 })).toBe("info");
    expect(classifySeverity("wip", 6, { wipLimit: 5 })).toBe("warning");
    expect(classifySeverity("wip", 8, { wipLimit: 5 })).toBe("critical");
  });

  it("computeHealthCopilot — agrège les 4 indicateurs et la pire sévérité", () => {
    const items: AnomalyWorkItemRow[] = [
      item({ id: "f1", type: "feature", title: "Orpheline+Waste", metadata: { impact: 0 } }),
      item({ id: "f2", type: "feature", title: "Reliée à JTBD", metadata: { impact: 2 } }),
      item({ id: "jtbd1", type: "job", title: "Signer un contrat" }),
      item({ id: "jtbd2", type: "job", title: "Ghost" }),
      item({ id: "s1", type: "story", title: "En cours 1", status: "in_progress" }),
      item({ id: "s2", type: "story", title: "En cours 2", status: "in_progress" }),
    ];
    const contextLinks: AnomalyContextLinkRow[] = [
      { work_item_id: "f2", context_type: "job", context_id: "jtbd1" },
    ];
    const workItemLinks: AnomalyWorkItemLinkRow[] = [
      { source_id: "jtbd1", type: "solves" },
    ];

    const snapshot = computeHealthCopilot({
      workItems: items,
      contextLinks,
      workItemLinks,
      stagnationDays: 5,
      wipLimit: 5,
      now: NOW,
    });

    expect(snapshot.indicators).toHaveLength(4);
    const byKind = Object.fromEntries(
      snapshot.indicators.map((i) => [i.kind, i])
    );
    expect(byKind.impact_zero.count).toBe(1);
    expect(byKind.impact_zero.severity).toBe("critical");
    expect(byKind.orphan_feature.count).toBe(1);
    expect(byKind.orphan_feature.severity).toBe("warning");
    expect(byKind.ghost_jtbd.count).toBe(1);
    expect(byKind.ghost_jtbd.severity).toBe("warning");
    expect(byKind.wip.count).toBe(2);
    expect(byKind.wip.severity).toBe("info");

    expect(snapshot.total).toBe(1 + 1 + 1);
    expect(snapshot.worstSeverity).toBe("critical");
  });

  it("copilotHrefFor construit un lien projet absolu", () => {
    const snapshot = computeHealthCopilot({
      workItems: [],
      contextLinks: [],
      workItemLinks: [],
      stagnationDays: 5,
      wipLimit: 5,
    });
    const impact = snapshot.indicators.find((i) => i.kind === "impact_zero");
    expect(impact).toBeDefined();
    expect(copilotHrefFor(impact!, "acme")).toBe("/projects/acme/radar");

    const orphan = snapshot.indicators.find((i) => i.kind === "orphan_feature");
    expect(copilotHrefFor(orphan!, "demo")).toBe("/projects/demo/portfolio");
  });

  it("copilotShouldSurface — masque la barre si tout est OK/info", () => {
    const clean = computeHealthCopilot({
      workItems: [
        item({ id: "f", type: "feature", title: "OK", metadata: { impact: 2 } }),
      ],
      contextLinks: [
        { work_item_id: "f", context_type: "job", context_id: "j" },
      ],
      workItemLinks: [{ source_id: "j", type: "solves" }],
      stagnationDays: 5,
      wipLimit: 5,
    });
    expect(copilotShouldSurface(clean)).toBe(false);

    const dirty = computeHealthCopilot({
      workItems: [
        item({ id: "f", type: "feature", title: "Waste", metadata: { impact: 0 } }),
      ],
      contextLinks: [],
      workItemLinks: [],
      stagnationDays: 5,
      wipLimit: 5,
    });
    expect(copilotShouldSurface(dirty)).toBe(true);
  });
});
