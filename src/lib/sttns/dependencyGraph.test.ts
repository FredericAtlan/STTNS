import { describe, expect, it } from "vitest";
import {
  buildDependencyGraph,
  sortDependencyNodesForLayout,
  type DependencyGraphInput,
} from "@/lib/sttns/dependencyGraph";

function fixture(overrides: Partial<DependencyGraphInput> = {}): DependencyGraphInput {
  return {
    personas: [
      { id: "persona-adja", title: "Adja Cissé" },
      { id: "persona-yao", title: "Yao Koffi" },
    ],
    jtbds: [
      { id: "jtbd-1", title: "Encaisser rapide", personaId: "persona-adja" },
      { id: "jtbd-2", title: "Suivre trésorerie", personaId: "persona-yao" },
      { id: "jtbd-ghost", title: "JTBD sans feature", personaId: "persona-adja" },
    ],
    epics: [
      { id: "epic-pay", title: "Paiement" },
      { id: "epic-track", title: "Trésorerie" },
    ],
    features: [
      {
        id: "feat-paylink",
        title: "Lien de paiement",
        epicId: "epic-pay",
        impact: 3,
      },
      {
        id: "feat-dashboard",
        title: "Dashboard tréso",
        epicId: "epic-track",
        impact: 2,
      },
      {
        id: "feat-orphan",
        title: "Feature orpheline",
        epicId: "epic-pay",
        impact: 1,
      },
    ],
    contextLinks: [
      { featureId: "feat-paylink", jtbdId: "jtbd-1" },
      { featureId: "feat-dashboard", jtbdId: "jtbd-2" },
    ],
    ...overrides,
  };
}

describe("dependencyGraph — KF3 JTBD → Feature", () => {
  it("crée un nœud par JTBD et par Feature, plus une arête par lien valide", () => {
    const graph = buildDependencyGraph(fixture());

    const jtbdNodes = graph.nodes.filter((n) => n.kind === "jtbd");
    const featureNodes = graph.nodes.filter((n) => n.kind === "feature");

    expect(jtbdNodes).toHaveLength(3);
    expect(featureNodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
    expect(graph.edges.map((e) => e.id).sort()).toEqual([
      "dep-jtbd-1-feat-paylink",
      "dep-jtbd-2-feat-dashboard",
    ]);
  });

  it("marque les JTBD sans feature comme fantômes et compte leur nombre", () => {
    const graph = buildDependencyGraph(fixture());

    const ghost = graph.nodes.find((n) => n.id === "jtbd-ghost");
    expect(ghost).toBeDefined();
    expect(ghost?.health).toBe("ghost");
    expect(ghost?.degree).toBe(0);
    expect(graph.counts.ghostJtbds).toBe(1);
  });

  it("marque les Features sans JTBD comme orphelines", () => {
    const graph = buildDependencyGraph(fixture());
    const orphan = graph.nodes.find((n) => n.id === "feat-orphan");
    expect(orphan).toBeDefined();
    expect(orphan?.health).toBe("orphan");
    expect(orphan?.degree).toBe(0);
    expect(graph.counts.orphanFeatures).toBe(1);
  });

  it("marque JTBD et Feature liés comme `linked` avec degré correct", () => {
    const graph = buildDependencyGraph(fixture());
    const jtbd = graph.nodes.find((n) => n.id === "jtbd-1");
    const feature = graph.nodes.find((n) => n.id === "feat-paylink");
    expect(jtbd?.health).toBe("linked");
    expect(jtbd?.degree).toBe(1);
    expect(feature?.health).toBe("linked");
    expect(feature?.degree).toBe(1);
    expect(feature?.impact).toBe(3);
  });

  it("ignore les liens pointant vers un JTBD ou une Feature hors périmètre (archivé)", () => {
    const graph = buildDependencyGraph(
      fixture({
        contextLinks: [
          { featureId: "feat-paylink", jtbdId: "jtbd-missing" },
          { featureId: "feat-missing", jtbdId: "jtbd-1" },
          { featureId: "feat-paylink", jtbdId: "jtbd-1" },
        ],
      })
    );

    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].source).toBe("jtbd-1");
    expect(graph.edges[0].target).toBe("feat-paylink");
  });

  it("déduplique les liens dupliqués (source, target)", () => {
    const graph = buildDependencyGraph(
      fixture({
        contextLinks: [
          { featureId: "feat-paylink", jtbdId: "jtbd-1" },
          { featureId: "feat-paylink", jtbdId: "jtbd-1" },
          { featureId: "feat-dashboard", jtbdId: "jtbd-2" },
        ],
      })
    );

    expect(graph.edges).toHaveLength(2);
    const paylinkNode = graph.nodes.find((n) => n.id === "feat-paylink");
    expect(paylinkNode?.degree).toBe(1);
  });

  it("hydrate titres Persona / Epic parents pour les tooltips", () => {
    const graph = buildDependencyGraph(fixture());
    const jtbd = graph.nodes.find((n) => n.id === "jtbd-1");
    const feature = graph.nodes.find((n) => n.id === "feat-paylink");
    expect(jtbd?.personaTitle).toBe("Adja Cissé");
    expect(feature?.epicTitle).toBe("Paiement");
  });

  it("renvoie un graphe vide sans crash lorsque toutes les collections sont vides", () => {
    const graph = buildDependencyGraph({
      personas: [],
      jtbds: [],
      features: [],
      epics: [],
      contextLinks: [],
    });

    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
    expect(graph.counts).toEqual({
      jtbds: 0,
      features: 0,
      links: 0,
      ghostJtbds: 0,
      orphanFeatures: 0,
    });
  });

  it("sortDependencyNodesForLayout — JTBD en premier, tri stable par persona puis titre", () => {
    const graph = buildDependencyGraph(fixture());
    const sorted = sortDependencyNodesForLayout(graph.nodes);

    const kinds = sorted.map((n) => n.kind);
    const firstFeatureIndex = kinds.indexOf("feature");
    expect(firstFeatureIndex).toBeGreaterThan(0);
    expect(kinds.slice(0, firstFeatureIndex).every((k) => k === "jtbd")).toBe(
      true
    );
    expect(kinds.slice(firstFeatureIndex).every((k) => k === "feature")).toBe(
      true
    );

    const jtbdIds = sorted
      .filter((n) => n.kind === "jtbd")
      .map((n) => n.id);
    expect(jtbdIds).toEqual(["jtbd-1", "jtbd-ghost", "jtbd-2"]);
  });
});
