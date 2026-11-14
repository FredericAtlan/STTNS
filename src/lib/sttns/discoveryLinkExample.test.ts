/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import { buildDiscoveryFlatNodes } from "@/lib/sttns/discoveryMindMap";
import {
  buildDiscoveryLinkExample,
  DISCOVERY_LINK_EXAMPLE_IDS as IDS,
} from "@/lib/sttns/discoveryLinkExample";
import { sandboxToDiscoverySpineProps } from "@/lib/sttns/spineWhySandbox";

describe("buildDiscoveryLinkExample", () => {
  it("refuse sans Epic Spine", () => {
    const res = buildDiscoveryLinkExample({
      spineEpics: [],
      spineFeatures: [{ id: "f1", title: "F", epic_id: null }],
      jtbdOptions: [],
    });
    expect(res.ok).toBe(false);
  });

  it("refuse sans Feature Spine", () => {
    const res = buildDiscoveryLinkExample({
      spineEpics: [{ id: "e1", title: "E" }],
      spineFeatures: [],
      jtbdOptions: [],
    });
    expect(res.ok).toBe(false);
  });

  it("construit Feature→Epic Spine, Story→Feature Spine, chaîne session", () => {
    const spine = sandboxToDiscoverySpineProps();
    const res = buildDiscoveryLinkExample({
      spineEpics: spine.spineEpics,
      spineFeatures: spine.spineFeatures,
      jtbdOptions: spine.jtbdOptions,
      author: "demo@sttns.app",
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const { drafts, coverage } = res.example;
    expect(drafts).toHaveLength(5);
    expect(coverage).toEqual({
      featureToSpineEpic: true,
      storyToSpineFeature: true,
      sessionChain: true,
    });

    const byId = new Map(drafts.map((d) => [d.id, d]));
    expect(byId.get(IDS.featOnSpineEpic)?.parentId).toBe(spine.spineEpics[0]!.id);
    expect(byId.get(IDS.storyOnSpineFeat)?.parentId).toBe(
      spine.spineFeatures.find((f) => f.epic_id === spine.spineEpics[0]!.id)?.id ??
        spine.spineFeatures[0]!.id
    );
    expect(byId.get(IDS.newFeature)?.parentId).toBe(IDS.newEpic);
    expect(byId.get(IDS.newStory)?.parentId).toBe(IDS.newFeature);

    const graph = buildDiscoveryFlatNodes(
      drafts,
      spine.spineEpics,
      spine.spineFeatures
    );
    expect(graph.find((n) => n.id === IDS.featOnSpineEpic)?.parentId).toBe(
      spine.spineEpics[0]!.id
    );
    expect(graph.find((n) => n.id === spine.spineEpics[0]!.id)?.origin).toBe("spine");
    expect(graph.find((n) => n.id === IDS.newEpic)?.origin).toBe("draft");
    expect(graph.find((n) => n.id === IDS.newStory)?.parentId).toBe(IDS.newFeature);
  });
});
