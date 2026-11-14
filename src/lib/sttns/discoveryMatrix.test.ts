import { describe, expect, it } from "vitest";
import {
  applyReverseLocal,
  bulkFinalizeOrder,
  canFinalizeDraft,
  clearFeatureShapeUpIfHasStories,
  computeEpicSessionRollup,
  computeFeatureSessionRollup,
  DISCOVERY_DRAFT_SCHEMA_VERSION,
  buildDiscoveryDraftFile,
  discoveryDraftDownloadFilename,
  featureFinalizeEffortFields,
  featureHasSessionStories,
  finalizeOrder,
  formatSessionParentLabel,
  groupFeaturesByEpic,
  isDiscoverySessionDirty,
  isSessionDraftId,
  assertDiscoveryReverseItemsTodo,
  discoveryCloudFingerprint,
  emptyDraftMetadata,
  normalizeStoredDraft,
  parseDiscoveryDraftFile,
  parseSessionPayload,
  parseStoredDrafts,
  reverseOrder,
  type DiscoveryDraft,
} from "@/lib/sttns/discoveryMatrix";

function draft(partial: Partial<DiscoveryDraft> & Pick<DiscoveryDraft, "id" | "type">): DiscoveryDraft {
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

describe("discoveryMatrix", () => {
  it("detects session draft ids", () => {
    expect(isSessionDraftId("draft_abc")).toBe(true);
    expect(isSessionDraftId("550e8400-e29b-41d4-a716-446655440000")).toBe(false);
  });

  it("bloque reverse si un descendant n'est plus todo", () => {
    const gate = assertDiscoveryReverseItemsTodo([
      { id: "e1", title: "Epic", type: "epic", status: "todo" },
      { id: "f1", title: "Feat", type: "feature", status: "in_progress" },
    ]);
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.error).toMatch(/in_progress/);
      expect(gate.blockers).toHaveLength(1);
    }
  });

  it("bloque reverse si une story a un cycle engagé", () => {
    const gate = assertDiscoveryReverseItemsTodo([
      { id: "e1", title: "Epic", type: "epic", status: "todo" },
      {
        id: "s1",
        title: "Story",
        type: "story",
        status: "todo",
        cycle_id: "11111111-1111-1111-1111-111111111111",
      },
    ]);
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.error).toMatch(/cycle engagé/);
      expect(gate.blockers).toHaveLength(1);
    }
  });

  it("autorise reverse si tous les items sont todo", () => {
    expect(
      assertDiscoveryReverseItemsTodo([
        { id: "e1", title: "Epic", type: "epic", status: "todo" },
        { id: "f1", title: "Feat", type: "feature", status: "todo" },
      ]).ok
    ).toBe(true);
  });

  it("fingerprint cloud change quand le titre change", () => {
    const drafts = [draft({ id: "draft_1", type: "epic", title: "A" })];
    const a = discoveryCloudFingerprint(drafts, emptyDraftMetadata("x"));
    const b = discoveryCloudFingerprint(drafts, {
      ...emptyDraftMetadata("x"),
      title: "Atelier",
    });
    expect(a).not.toBe(b);
  });

  it("blocks feature without JTBD", () => {
    const f = draft({
      id: "draft_f1",
      type: "feature",
      title: "Ingestion",
      parentId: "epic-uuid",
      impact: 2,
      effort_days: 1,
      complexity: 1,
    });
    const result = canFinalizeDraft(f, [f]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/JTBD/i);
  });

  it("allows feature with JTBD + Shape Up when no session stories", () => {
    const f = draft({
      id: "draft_f1",
      type: "feature",
      title: "Ingestion",
      parentId: "epic-uuid",
      jtbdId: "jtbd-uuid",
      impact: 3,
      effort_days: 2,
      complexity: 1,
    });
    expect(canFinalizeDraft(f, [f]).ok).toBe(true);
  });

  it("skips Shape Up effort when session stories exist", () => {
    const f = draft({
      id: "draft_f1",
      type: "feature",
      title: "Ingestion",
      parentId: "epic-uuid",
      jtbdId: "jtbd-uuid",
      impact: 2,
    });
    const s = draft({
      id: "draft_s1",
      type: "story",
      title: "Hash",
      parentId: "draft_f1",
      effort_days: 1,
      complexity: 2,
    });
    expect(featureHasSessionStories("draft_f1", [f, s])).toBe(true);
    expect(canFinalizeDraft(f, [f, s]).ok).toBe(true);
  });

  it("omits Feature effort/complexity in finalize payload when stories exist", () => {
    const f = draft({
      id: "draft_f1",
      type: "feature",
      title: "Ingestion",
      parentId: "epic-uuid",
      jtbdId: "jtbd-uuid",
      impact: 2,
      effort_days: 5,
      complexity: 3,
    });
    const s = draft({
      id: "draft_s1",
      type: "story",
      title: "Hash",
      parentId: "draft_f1",
      effort_days: 1,
      complexity: 2,
    });
    expect(featureFinalizeEffortFields(f, [f, s])).toEqual({});
    expect(featureFinalizeEffortFields(f, [f])).toEqual({
      effort_days: 5,
      complexity: 3,
    });
  });

  it("clears Shape Up fields on Feature once a session Story is attached", () => {
    const f = draft({
      id: "draft_f1",
      type: "feature",
      title: "Ingestion",
      parentId: "epic-uuid",
      jtbdId: "jtbd-uuid",
      impact: 2,
      effort_days: 3,
      complexity: 2,
    });
    const s = draft({
      id: "draft_s1",
      type: "story",
      title: "Hash",
      parentId: "draft_f1",
      effort_days: 1,
      complexity: 1,
    });
    const cleaned = clearFeatureShapeUpIfHasStories([f, s]);
    const feature = cleaned.find((d) => d.id === "draft_f1")!;
    expect(feature.effort_days).toBeNull();
    expect(feature.complexity).toBeNull();
  });

  it("orders Epic → Feature → Story for cascade finalize", () => {
    const e = draft({ id: "draft_e", type: "epic", title: "E" });
    const f = draft({
      id: "draft_f",
      type: "feature",
      title: "F",
      parentId: "draft_e",
      jtbdId: "j",
      impact: 1,
      effort_days: 1,
      complexity: 1,
    });
    const s = draft({
      id: "draft_s",
      type: "story",
      title: "S",
      parentId: "draft_f",
      effort_days: 1,
      complexity: 1,
    });
    const order = finalizeOrder(s, [e, f, s]);
    expect(order.map((d) => d.id)).toEqual(["draft_e", "draft_f", "draft_s"]);
  });

  it("bulkFinalizeOrder dedupes shared parents", () => {
    const e = draft({ id: "draft_e", type: "epic", title: "E" });
    const f = draft({
      id: "draft_f",
      type: "feature",
      title: "F",
      parentId: "draft_e",
      jtbdId: "j",
      impact: 1,
      effort_days: 1,
      complexity: 1,
    });
    const s1 = draft({
      id: "draft_s1",
      type: "story",
      title: "S1",
      parentId: "draft_f",
      effort_days: 1,
      complexity: 1,
    });
    const s2 = draft({
      id: "draft_s2",
      type: "story",
      title: "S2",
      parentId: "draft_f",
      effort_days: 2,
      complexity: 1,
    });
    const order = bulkFinalizeOrder([e, f, s1, s2]);
    expect(order.map((d) => d.id)).toEqual([
      "draft_e",
      "draft_f",
      "draft_s1",
      "draft_s2",
    ]);
  });

  it("groups features by epic for optgroups", () => {
    const groups = groupFeaturesByEpic([
      {
        id: "f1",
        title: "Alpha",
        source: "spine",
        epicId: "e1",
        epicTitle: "Epic A",
      },
      {
        id: "f2",
        title: "Beta",
        source: "spine",
        epicId: null,
        epicTitle: null,
      },
      {
        id: "f3",
        title: "Gamma",
        source: "session",
        epicId: "e1",
        epicTitle: "Epic A",
      },
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Epic A", "Sans Epic"]);
    expect(groups[0].options.map((o) => o.id)).toEqual(["f1", "f3"]);
    expect(groups[1].options.map((o) => o.id)).toEqual(["f2"]);
  });

  it("parses sessionStorage payloads safely", () => {
    expect(parseStoredDrafts(null)).toEqual([]);
    expect(parseStoredDrafts("{")).toEqual([]);
    expect(normalizeStoredDraft({ id: "draft_x", type: "epic", title: "T" })).toMatchObject({
      id: "draft_x",
      type: "epic",
      title: "T",
      description: "",
      doc_url: "",
    });
    const parsed = parseStoredDrafts(
      JSON.stringify([{ id: "draft_y", type: "story", title: "S", effort_days: 1, complexity: 2 }])
    );
    expect(parsed).toHaveLength(1);
    expect(parsed[0].effort_days).toBe(1);
  });

  it("formats live session parent labels", () => {
    expect(formatSessionParentLabel("Epic Alpha", "session")).toBe("Epic Alpha [Session]");
    expect(formatSessionParentLabel("", "session")).toBe("(sans titre) [Session]");
    expect(formatSessionParentLabel("Live Epic", "spine")).toBe("Live Epic");
  });

  it("computes Feature session roll-up from child Stories", () => {
    const f = draft({
      id: "draft_f1",
      type: "feature",
      title: "Ingestion",
      parentId: "draft_e",
      jtbdId: "j",
      impact: 2,
      effort_days: 5,
      complexity: 1,
    });
    const s1 = draft({
      id: "draft_s1",
      type: "story",
      title: "A",
      parentId: "draft_f1",
      effort_days: 0.5,
      complexity: 2,
    });
    const s2 = draft({
      id: "draft_s2",
      type: "story",
      title: "B",
      parentId: "draft_f1",
      effort_days: 3,
      complexity: 3,
    });
    const rollup = computeFeatureSessionRollup("draft_f1", [f, s1, s2]);
    expect(rollup.effortDays).toBe(3.5);
    expect(rollup.maxRisk).toBe(3);
    expect(rollup.riskyCount).toBe(1);
    expect(featureFinalizeEffortFields(f, [f, s1, s2])).toEqual({});
  });

  it("computes Epic session roll-up from Features + nested Stories", () => {
    const e = draft({ id: "draft_e", type: "epic", title: "Alpha" });
    const f = draft({
      id: "draft_f",
      type: "feature",
      title: "Bridge",
      parentId: "draft_e",
      jtbdId: "j",
      impact: 3,
    });
    const s = draft({
      id: "draft_s",
      type: "story",
      title: "Hash",
      parentId: "draft_f",
      effort_days: 2,
      complexity: 1,
    });
    const rollup = computeEpicSessionRollup("draft_e", [e, f, s]);
    expect(rollup.totalImpact).toBe(3);
    expect(rollup.totalDays).toBe(2);
    expect(rollup.ratio).toBeCloseTo(1.5);
  });

  it("parses legacy session array and envelope without corrupting drafts", () => {
    const legacy = parseSessionPayload(
      JSON.stringify([{ id: "draft_y", type: "story", title: "S", effort_days: 1, complexity: 2 }]),
      "alice@sttns.app"
    );
    expect(legacy.drafts).toHaveLength(1);
    expect(legacy.metadata.author).toBe("alice@sttns.app");

    const envelope = parseSessionPayload(
      JSON.stringify({
        schemaVersion: DISCOVERY_DRAFT_SCHEMA_VERSION,
        metadata: { title: "Atelier", author: "Bob", comments: "ok", createdAt: "2026-01-01T00:00:00.000Z" },
        content: [{ id: "draft_z", type: "epic", title: "E1" }],
      })
    );
    expect(envelope.drafts[0].title).toBe("E1");
    expect(envelope.metadata.title).toBe("Atelier");
  });

  it("requires schemaVersion on draft file import", () => {
    const missing = parseDiscoveryDraftFile({
      projectId: "p1",
      projectSlug: "demo",
      metadata: { title: "T", author: "", comments: "" },
      content: [],
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error).toMatch(/schemaVersion/i);

    const badVersion = parseDiscoveryDraftFile({
      schemaVersion: 99,
      projectId: "p1",
      projectSlug: "demo",
      metadata: { title: "T", author: "", comments: "" },
      content: [],
    });
    expect(badVersion.ok).toBe(false);
  });

  it("builds and re-parses a round-trip draft file", () => {
    const row = draft({
      id: "draft_f1",
      type: "feature",
      title: "Ingestion",
      parentId: "epic-1",
      jtbdId: "jtbd-1",
      impact: 2,
      effort_days: 1,
      complexity: 1,
    });
    const file = buildDiscoveryDraftFile({
      projectId: "proj-1",
      projectSlug: "marketchain",
      metadata: {
        title: "Cadrage Q3",
        author: "Frederic",
        comments: "Drive",
        createdAt: null,
        exportedAt: null,
      },
      drafts: [row],
      now: "2026-07-20T10:00:00.000Z",
    });
    expect(file.schemaVersion).toBe(1);
    expect(file.metadata.createdAt).toBe("2026-07-20T10:00:00.000Z");
    expect(file.metadata.exportedAt).toBe("2026-07-20T10:00:00.000Z");
    expect(discoveryDraftDownloadFilename(file.metadata, "marketchain")).toMatch(
      /^sttns-discovery-cadrage-q3-2026-07-20\.json$/
    );

    const parsed = parseDiscoveryDraftFile(file, {
      expectedProjectId: "proj-1",
      expectedProjectSlug: "marketchain",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.warnings).toEqual([]);
      expect(parsed.file.content).toHaveLength(1);
      expect(parsed.file.content[0].title).toBe("Ingestion");
    }
  });

  it("warns on project mismatch without hard-blocking import", () => {
    const file = buildDiscoveryDraftFile({
      projectId: "other",
      projectSlug: "other-slug",
      metadata: {
        title: "X",
        author: "",
        comments: "",
        createdAt: "2026-01-01T00:00:00.000Z",
        exportedAt: null,
      },
      drafts: [],
    });
    const parsed = parseDiscoveryDraftFile(file, { expectedProjectId: "mine" });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.warnings.length).toBeGreaterThan(0);
  });

  it("detects dirty session without flagging default author alone", () => {
    const emptyMeta = {
      title: "",
      author: "alice@sttns.app",
      comments: "",
      createdAt: null,
      exportedAt: null,
    };
    expect(isDiscoverySessionDirty([], emptyMeta, "alice@sttns.app")).toBe(false);
    expect(
      isDiscoverySessionDirty(
        [draft({ id: "draft_1", type: "epic", title: "E" })],
        emptyMeta,
        "alice@sttns.app"
      )
    ).toBe(true);
    expect(
      isDiscoverySessionDirty([], { ...emptyMeta, title: "Atelier" }, "alice@sttns.app")
    ).toBe(true);
  });

  it("reverseOrder puis applyReverseLocal remettent les parents session", () => {
    const e = draft({
      id: "draft_e",
      type: "epic",
      title: "E",
      spineId: "uuid-e",
    });
    const f = draft({
      id: "draft_f",
      type: "feature",
      title: "F",
      parentId: "uuid-e",
      jtbdId: "j",
      impact: 2,
      effort_days: 1,
      complexity: 1,
      spineId: "uuid-f",
    });
    const s = draft({
      id: "draft_s",
      type: "story",
      title: "S",
      parentId: "uuid-f",
      effort_days: 1,
      complexity: 1,
      spineId: "uuid-s",
    });

    const order = reverseOrder(e, [e, f, s]);
    expect(order.map((d) => d.id)).toEqual(["draft_s", "draft_f", "draft_e"]);

    const next = applyReverseLocal(e, [e, f, s]);
    expect(next.every((d) => d.spineId == null)).toBe(true);
    expect(next.find((d) => d.id === "draft_f")?.parentId).toBe("draft_e");
    expect(next.find((d) => d.id === "draft_s")?.parentId).toBe("draft_f");
    expect(canFinalizeDraft(next.find((d) => d.id === "draft_e")!, next).ok).toBe(true);
  });
});
