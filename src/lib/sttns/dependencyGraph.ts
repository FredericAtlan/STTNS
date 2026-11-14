/**
 * KF3 — Dependency Graph JTBD → Feature.
 *
 * Helpers purs (aucun DOM, aucun React) qui transforment les données Spine
 * — JTBD, Features, Epics parents, liens `sttns_context_links` (type `job`) —
 * en graphe filtré JTBD ↔ Feature exploitable par React Flow.
 *
 * La logique respecte la Constitution Spine :
 *   • JTBD sans lien Feature ⇒ « fantôme » (orphelin côté besoin).
 *   • Feature sans JTBD lié ⇒ « hors-piste » (orphelin côté produit).
 *
 * Cartographie : README § Cartographie · Domaine Epics/Features.
 */

export type DependencyPersona = {
  id: string;
  title: string;
};

export type DependencyJtbd = {
  id: string;
  title: string;
  /** persona_id (parent Spine). */
  personaId: string | null;
};

export type DependencyFeature = {
  id: string;
  title: string;
  /** epic_id (parent Spine). */
  epicId: string | null;
  /** Score Impact 0–3 (metadata.impact) — utile pour teinter les fantômes. */
  impact?: 0 | 1 | 2 | 3 | null;
};

export type DependencyEpic = {
  id: string;
  title: string;
};

export type DependencyContextLink = {
  /** work_item_id — Feature qui pointe vers un JTBD. */
  featureId: string;
  /** context_id — JTBD ciblé. */
  jtbdId: string;
};

export type DependencyNodeKind = "jtbd" | "feature";

export type DependencyHealth = "linked" | "ghost" | "orphan";

export type DependencyNode = {
  id: string;
  kind: DependencyNodeKind;
  title: string;
  /** Persona parent (JTBD) — pour groupement / tooltip. */
  personaId?: string | null;
  personaTitle?: string | null;
  /** Epic parent (Feature) — pour groupement / tooltip. */
  epicId?: string | null;
  epicTitle?: string | null;
  /** Feature only. */
  impact?: 0 | 1 | 2 | 3 | null;
  /** Nombre de liens sortants (JTBD) ou entrants (Feature). */
  degree: number;
  /**
   * Santé du nœud dans le graphe filtré :
   *   • `linked` — au moins un lien ;
   *   • `ghost` — JTBD sans Feature ;
   *   • `orphan` — Feature sans JTBD lié.
   */
  health: DependencyHealth;
};

export type DependencyEdge = {
  id: string;
  source: string; // JTBD id
  target: string; // Feature id
};

export type DependencyGraph = {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  counts: {
    jtbds: number;
    features: number;
    links: number;
    ghostJtbds: number;
    orphanFeatures: number;
  };
};

export type DependencyGraphInput = {
  personas: DependencyPersona[];
  jtbds: DependencyJtbd[];
  features: DependencyFeature[];
  epics: DependencyEpic[];
  contextLinks: DependencyContextLink[];
};

/**
 * Construit le graphe filtré JTBD ↔ Feature.
 *
 * - Un edge est créé uniquement si la Feature ET le JTBD sont présents dans
 *   les entrées (les liens vers des items archivés / hors périmètre sont
 *   ignorés silencieusement — cohérent avec le comportement `whyPage`).
 * - Les compteurs sont dérivés de la même source que le Radar d'Hygiène
 *   (JTBD fantômes vs Features orphelines).
 */
export function buildDependencyGraph(
  input: DependencyGraphInput
): DependencyGraph {
  const personaTitleById = new Map<string, string>();
  for (const persona of input.personas) {
    personaTitleById.set(persona.id, persona.title);
  }

  const epicTitleById = new Map<string, string>();
  for (const epic of input.epics) {
    epicTitleById.set(epic.id, epic.title);
  }

  const jtbdById = new Map<string, DependencyJtbd>();
  for (const jtbd of input.jtbds) {
    jtbdById.set(jtbd.id, jtbd);
  }

  const featureById = new Map<string, DependencyFeature>();
  for (const feature of input.features) {
    featureById.set(feature.id, feature);
  }

  const jtbdOutDegree = new Map<string, number>();
  const featureInDegree = new Map<string, number>();
  const edges: DependencyEdge[] = [];

  const seenEdgeIds = new Set<string>();

  for (const link of input.contextLinks) {
    if (!jtbdById.has(link.jtbdId)) continue;
    if (!featureById.has(link.featureId)) continue;

    const id = `dep-${link.jtbdId}-${link.featureId}`;
    if (seenEdgeIds.has(id)) continue;
    seenEdgeIds.add(id);

    edges.push({ id, source: link.jtbdId, target: link.featureId });
    jtbdOutDegree.set(link.jtbdId, (jtbdOutDegree.get(link.jtbdId) ?? 0) + 1);
    featureInDegree.set(
      link.featureId,
      (featureInDegree.get(link.featureId) ?? 0) + 1
    );
  }

  const nodes: DependencyNode[] = [];

  for (const jtbd of input.jtbds) {
    const degree = jtbdOutDegree.get(jtbd.id) ?? 0;
    nodes.push({
      id: jtbd.id,
      kind: "jtbd",
      title: jtbd.title,
      personaId: jtbd.personaId,
      personaTitle: jtbd.personaId
        ? personaTitleById.get(jtbd.personaId) ?? null
        : null,
      degree,
      health: degree > 0 ? "linked" : "ghost",
    });
  }

  for (const feature of input.features) {
    const degree = featureInDegree.get(feature.id) ?? 0;
    nodes.push({
      id: feature.id,
      kind: "feature",
      title: feature.title,
      epicId: feature.epicId,
      epicTitle: feature.epicId
        ? epicTitleById.get(feature.epicId) ?? null
        : null,
      impact: feature.impact ?? null,
      degree,
      health: degree > 0 ? "linked" : "orphan",
    });
  }

  const ghostJtbds = nodes.filter(
    (n) => n.kind === "jtbd" && n.health === "ghost"
  ).length;
  const orphanFeatures = nodes.filter(
    (n) => n.kind === "feature" && n.health === "orphan"
  ).length;

  return {
    nodes,
    edges,
    counts: {
      jtbds: input.jtbds.length,
      features: input.features.length,
      links: edges.length,
      ghostJtbds,
      orphanFeatures,
    },
  };
}

/** Tri stable par persona puis titre — pour un affichage lisible. */
export function sortDependencyNodesForLayout(
  nodes: DependencyNode[]
): DependencyNode[] {
  return [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "jtbd" ? -1 : 1;
    if (a.kind === "jtbd" && b.kind === "jtbd") {
      const personaCompare = (a.personaTitle ?? "").localeCompare(
        b.personaTitle ?? ""
      );
      if (personaCompare !== 0) return personaCompare;
    }
    if (a.kind === "feature" && b.kind === "feature") {
      const epicCompare = (a.epicTitle ?? "").localeCompare(b.epicTitle ?? "");
      if (epicCompare !== 0) return epicCompare;
    }
    return a.title.localeCompare(b.title);
  });
}
