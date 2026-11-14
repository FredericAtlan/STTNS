/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import type { DiscoveryDraft } from "@/lib/sttns/discoveryMatrix";
import {
  buildDiscoveryFlatNodes,
  canReparentDiscoveryDraft,
  formatDiscoverySpineBadge,
  normalizeDiscoveryTitle,
  reparentTargetId,
} from "@/lib/sttns/discoveryMindMap";

function draft(
  partial: Partial<DiscoveryDraft> & Pick<DiscoveryDraft, "id" | "type">
): DiscoveryDraft {
  return {
    title: "",
    parentId: null,
    jtbdId: null,
    impact: null,
    effort_days: null,
    complexity: null,
    description: "",
    doc_url: "",
    spineId: null,
    ...partial,
  };
}

describe("discoveryMindMap", () => {
  it("normalizeDiscoveryTitle ignore accents et casse", () => {
    expect(normalizeDiscoveryTitle("Réfonte Auth")).toBe("refonte auth");
  });

  it("formatDiscoverySpineBadge", () => {
    expect(formatDiscoverySpineBadge("epic", "abcd-efgh-ijkl")).toBe("#EABCD");
  });

  it("rattache un brouillon Feature à une ancre Epic Spine", () => {
    const nodes = buildDiscoveryFlatNodes(
      [
        draft({
          id: "draft_f1",
          type: "feature",
          title: "OAuth",
          parentId: "epic-spine-1",
          jtbdId: "j1",
          impact: 2,
        }),
      ],
      [{ id: "epic-spine-1", title: "Auth" }],
      []
    );

    const epic = nodes.find((n) => n.id === "epic-spine-1");
    const feat = nodes.find((n) => n.id === "draft_f1");
    expect(epic?.origin).toBe("spine");
    expect(feat?.origin).toBe("draft");
    expect(feat?.parentId).toBe("epic-spine-1");
    expect(epic?.childrenIds).toContain("draft_f1");
    expect(epic?.featureCount).toBe(1);
    expect(epic?.attachedSummary).toMatch(/1 Feature/);
  });

  it("marque collision titre brouillon ↔ Spine", () => {
    const nodes = buildDiscoveryFlatNodes(
      [draft({ id: "draft_e1", type: "epic", title: "Refonte auth" })],
      [{ id: "epic-live", title: "Réfonte Auth" }],
      []
    );
    const draftNode = nodes.find((n) => n.id === "draft_e1");
    const spineNode = nodes.find((n) => n.id === "epic-live");
    expect(draftNode?.collision).toBe(true);
    expect(draftNode?.collisionWithIds).toContain("epic-live");
    expect(spineNode?.collision).toBe(true);
  });

  it("marque collision Story brouillon ↔ Story Spine", () => {
    const nodes = buildDiscoveryFlatNodes(
      [draft({ id: "draft_s1", type: "story", title: "Login mobile" })],
      [],
      [],
      {
        spineStories: [
          { id: "story-live", title: "Login Mobile", feature_id: "f1" },
        ],
      }
    );
    const draftNode = nodes.find((n) => n.id === "draft_s1");
    expect(draftNode?.collision).toBe(true);
    expect(draftNode?.collisionWithIds).toContain("story-live");
  });

  it("poured = origin poured + badge spineId", () => {
    const nodes = buildDiscoveryFlatNodes(
      [
        draft({
          id: "draft_e1",
          type: "epic",
          title: "Live",
          spineId: "uuid-epic-1",
        }),
      ],
      [],
      []
    );
    expect(nodes.find((n) => n.id === "draft_e1")?.origin).toBe("poured");
  });

  it("canReparentDiscoveryDraft respecte Epic→Feature→Story", () => {
    const feature = draft({ id: "draft_f1", type: "feature", title: "F" });
    const epicTarget = {
      id: "epic-1",
      kind: "epic" as const,
      title: "E",
      parentId: null,
      childrenIds: [],
      origin: "spine" as const,
      spineId: "epic-1",
      draftId: null,
      collision: false,
      collisionWithIds: [],
      featureCount: 0,
      storyCount: 0,
      attachedSummary: null,
    };
    expect(canReparentDiscoveryDraft(feature, epicTarget)).toBe(true);
    expect(reparentTargetId(epicTarget)).toBe("epic-1");
  });
});
