import { describe, expect, it } from "vitest";
import {
  collectPainPointJobIds,
  computeGhostJtbdIds,
  computeOrphanFeatureIds,
  computeRadarAnomalyCounts,
  computeStagnantStoryIds,
  computeUndocumentedTaskIds,
  computeWasteFeatureIds,
  type AnomalyContextLinkRow,
  type AnomalyWorkItemLinkRow,
  type AnomalyWorkItemRow,
} from "@/lib/sttns/radarAnomalies";

const NOW = new Date("2026-07-21T00:00:00Z");

function makeItem(row: Partial<AnomalyWorkItemRow> & Pick<AnomalyWorkItemRow, "id" | "type" | "title">): AnomalyWorkItemRow {
  return {
    metadata: null,
    parent_id: null,
    status: null,
    updated_at: null,
    ...row,
  };
}

describe("radarAnomalies", () => {
  it("collectPainPointJobIds détecte spine_role et fallback titre", () => {
    const items: AnomalyWorkItemRow[] = [
      makeItem({ id: "pp1", type: "job", title: "Douleur", metadata: { spine_role: "pain_point", severity: "high", label: "Douleur" } }),
      makeItem({ id: "pp2", type: "job", title: "[Pain Point: low] Autre" }),
      makeItem({ id: "jtbd1", type: "job", title: "Signer un contrat" }),
    ];
    const set = collectPainPointJobIds(items);
    expect(set.has("pp1")).toBe(true);
    expect(set.has("pp2")).toBe(true);
    expect(set.has("jtbd1")).toBe(false);
  });

  it("computeOrphanFeatureIds n'exclut PAS un lien vers un Pain Point", () => {
    const items: AnomalyWorkItemRow[] = [
      makeItem({ id: "f1", type: "feature", title: "Feature A" }),
      makeItem({ id: "f2", type: "feature", title: "Feature B" }),
      makeItem({ id: "pp1", type: "job", title: "[Pain Point: high] Friction" }),
      makeItem({ id: "jtbd1", type: "job", title: "Signer" }),
    ];
    const contextLinks: AnomalyContextLinkRow[] = [
      // Feature A liée uniquement à un Pain Point → orpheline
      { work_item_id: "f1", context_type: "job", context_id: "pp1" },
      // Feature B liée à un vrai JTBD → OK
      { work_item_id: "f2", context_type: "job", context_id: "jtbd1" },
    ];

    const orphans = computeOrphanFeatureIds({ workItems: items, contextLinks });
    expect(orphans.has("f1")).toBe(true);
    expect(orphans.has("f2")).toBe(false);
  });

  it("computeStagnantStoryIds respecte stagnationDays du projet", () => {
    const items: AnomalyWorkItemRow[] = [
      makeItem({
        id: "s1",
        type: "story",
        title: "Ancienne",
        status: "in_progress",
        updated_at: new Date(NOW.getTime() - 15 * 86400_000).toISOString(),
      }),
      makeItem({
        id: "s2",
        type: "story",
        title: "Récente",
        status: "in_progress",
        updated_at: new Date(NOW.getTime() - 2 * 86400_000).toISOString(),
      }),
      makeItem({
        id: "s3",
        type: "story",
        title: "Done non stagnante",
        status: "done",
        updated_at: new Date(NOW.getTime() - 30 * 86400_000).toISOString(),
      }),
    ];

    const strict = computeStagnantStoryIds({ workItems: items, stagnationDays: 5, now: NOW });
    expect(strict.has("s1")).toBe(true);
    expect(strict.has("s2")).toBe(false);
    expect(strict.has("s3")).toBe(false);

    const lax = computeStagnantStoryIds({ workItems: items, stagnationDays: 30, now: NOW });
    expect(lax.has("s1")).toBe(false);
  });

  it("computeWasteFeatureIds détecte impact=0", () => {
    const items: AnomalyWorkItemRow[] = [
      makeItem({ id: "f1", type: "feature", title: "Zéro", metadata: { impact: 0 } }),
      makeItem({ id: "f2", type: "feature", title: "Vital", metadata: { impact: 3 } }),
      makeItem({ id: "f3", type: "feature", title: "Nul metadata" }),
    ];
    const waste = computeWasteFeatureIds(items);
    expect(waste.has("f1")).toBe(true);
    expect(waste.has("f2")).toBe(false);
    expect(waste.has("f3")).toBe(false);
  });

  it("computeGhostJtbdIds ignore les Pain Points et détecte les JTBD sans solves", () => {
    const items: AnomalyWorkItemRow[] = [
      makeItem({ id: "jtbd1", type: "job", title: "Sans solves" }),
      makeItem({ id: "jtbd2", type: "job", title: "Avec solves" }),
      makeItem({ id: "pp1", type: "job", title: "[Pain Point: low] Doulou" }),
    ];
    const links: AnomalyWorkItemLinkRow[] = [
      { source_id: "jtbd2", type: "solves" },
    ];
    const ghosts = computeGhostJtbdIds({ workItems: items, workItemLinks: links });
    expect(ghosts.has("jtbd1")).toBe(true);
    expect(ghosts.has("jtbd2")).toBe(false);
    expect(ghosts.has("pp1")).toBe(false);
  });

  it("computeUndocumentedTaskIds ne prend que les tasks done sans notion_url", () => {
    const items: AnomalyWorkItemRow[] = [
      makeItem({ id: "t1", type: "task", title: "Done sans doc", status: "done" }),
      makeItem({ id: "t2", type: "task", title: "Done avec doc", status: "done", metadata: { notion_url: "https://example.com" } }),
      makeItem({ id: "t3", type: "task", title: "En cours", status: "in_progress" }),
    ];
    const set = computeUndocumentedTaskIds(items);
    expect(set.has("t1")).toBe(true);
    expect(set.has("t2")).toBe(false);
    expect(set.has("t3")).toBe(false);
  });

  it("computeRadarAnomalyCounts agrège toutes les catégories", () => {
    const items: AnomalyWorkItemRow[] = [
      makeItem({ id: "f1", type: "feature", title: "Orpheline + Waste", metadata: { impact: 0 } }),
      makeItem({ id: "jtbd1", type: "job", title: "Ghost" }),
      makeItem({
        id: "s1",
        type: "story",
        title: "Stagnante",
        status: "review",
        updated_at: new Date(NOW.getTime() - 20 * 86400_000).toISOString(),
      }),
      makeItem({ id: "t1", type: "task", title: "Undocumented", status: "done" }),
    ];
    const counts = computeRadarAnomalyCounts({
      workItems: items,
      contextLinks: [],
      workItemLinks: [],
      stagnationDays: 5,
      now: NOW,
    });

    expect(counts.orphans).toBe(1);
    expect(counts.wasteFeatures).toBe(1);
    expect(counts.ghostJtbds).toBe(1);
    expect(counts.stagnants).toBe(1);
    expect(counts.undocumentedTasks).toBe(1);
    expect(counts.total).toBe(5);
  });
});
