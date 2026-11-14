/**
 * Graphe Discovery — hiérarchie Epic → Feature → Story
 * (brouillons session + ancres Spine parent).
 */
import {
  isSessionDraftId,
  type DiscoveryDraft,
  type DiscoveryItemType,
} from "@/lib/sttns/discoveryMatrix";

export type DiscoveryMindOrigin = "spine" | "draft" | "poured";

export type DiscoverySpineEpicRef = { id: string; title: string };
export type DiscoverySpineFeatureRef = {
  id: string;
  title: string;
  epic_id: string | null;
};

export type DiscoverySpineStoryRef = {
  id: string;
  title: string;
  feature_id: string | null;
};

export type DiscoveryFlatNode = {
  id: string;
  kind: DiscoveryItemType;
  title: string;
  parentId: string | null;
  childrenIds: string[];
  /** spine = ancre Spine hors session ; draft = brouillon ; poured = ligne session déjà au Spine */
  origin: DiscoveryMindOrigin;
  spineId: string | null;
  /** Id de ligne tableau (drafts) — null pour ancre Spine pure */
  draftId: string | null;
  /** Collision sémantique titre / JTBD proche d'un objet Spine */
  collision: boolean;
  /** Ids Spine dont le titre collisionne avec ce brouillon */
  collisionWithIds: string[];
  featureCount: number;
  storyCount: number;
  attachedSummary: string | null;
};

const ORPHAN_ROOT_ID = "__discovery_orphan__";

export function normalizeDiscoveryTitle(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Badge court type Spine #E1A2 */
export function formatDiscoverySpineBadge(
  kind: DiscoveryItemType,
  spineId: string
): string {
  const prefix = kind === "epic" ? "E" : kind === "feature" ? "F" : "S";
  const short = spineId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `#${prefix}${short}`;
}

/** Collision titre brouillon ↔ objet Spine (égalité / inclusion ≥ 6 chars). */
export function discoveryTitlesCollide(a: string, b: string): boolean {
  const na = normalizeDiscoveryTitle(a);
  const nb = normalizeDiscoveryTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 6 && nb.length >= 6 && (na.includes(nb) || nb.includes(na))) {
    return true;
  }
  return false;
}

function titlesCollide(a: string, b: string): boolean {
  return discoveryTitlesCollide(a, b);
}

/** Catalogue collision pour le Tableau Discovery. */
export function draftTitleCollidesWithSpine(
  draft: { type: DiscoveryItemType; title: string; spineId: string | null },
  catalog: { id: string; title: string; kind: DiscoveryItemType }[]
): boolean {
  if (draft.spineId || !draft.title.trim()) return false;
  return catalog.some(
    (spine) => spine.kind === draft.type && discoveryTitlesCollide(draft.title, spine.title)
  );
}

function buildAttachedSummary(featureCount: number, storyCount: number): string | null {
  const parts: string[] = [];
  if (featureCount > 0) {
    parts.push(
      `${featureCount} Feature${featureCount > 1 ? "s" : ""} rattachée${featureCount > 1 ? "s" : ""}`
    );
  }
  if (storyCount > 0) {
    parts.push(
      `${storyCount} Stor${storyCount > 1 ? "ies" : "y"} active${storyCount > 1 ? "s" : ""}`
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Construit le graphe plat Discovery : drafts + ancres Spine nécessaires
 * pour afficher les rattachements parent.
 */
export function buildDiscoveryFlatNodes(
  drafts: DiscoveryDraft[],
  spineEpics: DiscoverySpineEpicRef[],
  spineFeatures: DiscoverySpineFeatureRef[],
  options?: {
    includeOrphanBucket?: boolean;
    spineStories?: DiscoverySpineStoryRef[];
  }
): DiscoveryFlatNode[] {
  const includeOrphanBucket = options?.includeOrphanBucket ?? true;
  const spineStories = options?.spineStories ?? [];
  const byId = new Map<string, DiscoveryFlatNode>();
  const epicById = new Map(spineEpics.map((e) => [e.id, e]));
  const featureById = new Map(spineFeatures.map((f) => [f.id, f]));

  function ensureSpineEpic(id: string) {
    if (byId.has(id)) return;
    const epic = epicById.get(id);
    if (!epic) return;
    byId.set(id, {
      id,
      kind: "epic",
      title: epic.title,
      parentId: null,
      childrenIds: [],
      origin: "spine",
      spineId: id,
      draftId: null,
      collision: false,
      collisionWithIds: [],
      featureCount: 0,
      storyCount: 0,
      attachedSummary: null,
    });
  }

  function ensureSpineFeature(id: string) {
    if (byId.has(id)) return;
    const feat = featureById.get(id);
    if (!feat) return;
    if (feat.epic_id) ensureSpineEpic(feat.epic_id);
    byId.set(id, {
      id,
      kind: "feature",
      title: feat.title,
      parentId: feat.epic_id,
      childrenIds: [],
      origin: "spine",
      spineId: id,
      draftId: null,
      collision: false,
      collisionWithIds: [],
      featureCount: 0,
      storyCount: 0,
      attachedSummary: null,
    });
  }

  for (const d of drafts) {
    const nodeId = d.id;
    let parentId = d.parentId;

    if (parentId && !isSessionDraftId(parentId)) {
      if (d.type === "feature") ensureSpineEpic(parentId);
      if (d.type === "story") ensureSpineFeature(parentId);
    }

    if (
      (d.type === "feature" || d.type === "story") &&
      !parentId &&
      includeOrphanBucket
    ) {
      if (!byId.has(ORPHAN_ROOT_ID)) {
        byId.set(ORPHAN_ROOT_ID, {
          id: ORPHAN_ROOT_ID,
          kind: "epic",
          title: "Sans parent",
          parentId: null,
          childrenIds: [],
          origin: "spine",
          spineId: null,
          draftId: null,
          collision: false,
          collisionWithIds: [],
          featureCount: 0,
          storyCount: 0,
          attachedSummary: null,
        });
      }
      parentId = ORPHAN_ROOT_ID;
    }

    byId.set(nodeId, {
      id: nodeId,
      kind: d.type,
      title: d.title.trim() || `(${d.type} sans titre)`,
      parentId,
      childrenIds: [],
      origin: d.spineId ? "poured" : "draft",
      spineId: d.spineId,
      draftId: d.id,
      collision: false,
      collisionWithIds: [],
      featureCount: 0,
      storyCount: 0,
      attachedSummary: null,
    });
  }

  // Liens enfants
  for (const node of Array.from(byId.values())) {
    if (!node.parentId) continue;
    const parent = byId.get(node.parentId);
    if (!parent) {
      node.parentId = includeOrphanBucket ? ORPHAN_ROOT_ID : null;
      if (includeOrphanBucket && byId.has(ORPHAN_ROOT_ID) && node.id !== ORPHAN_ROOT_ID) {
        const orphan = byId.get(ORPHAN_ROOT_ID)!;
        if (!orphan.childrenIds.includes(node.id)) orphan.childrenIds.push(node.id);
      }
      continue;
    }
    if (!parent.childrenIds.includes(node.id)) parent.childrenIds.push(node.id);
  }

  // Collisions titre brouillon ↔ Spine (ancres + objets Spine catalogue)
  const spineCatalog: { id: string; title: string; kind: DiscoveryItemType }[] = [
    ...spineEpics.map((e) => ({ id: e.id, title: e.title, kind: "epic" as const })),
    ...spineFeatures.map((f) => ({
      id: f.id,
      title: f.title,
      kind: "feature" as const,
    })),
    ...spineStories.map((s) => ({
      id: s.id,
      title: s.title,
      kind: "story" as const,
    })),
  ];

  for (const d of drafts) {
    if (d.spineId || !d.title.trim()) continue;
    const draftNode = byId.get(d.id);
    if (!draftNode) continue;
    const hits: string[] = [];
    for (const spine of spineCatalog) {
      if (spine.kind !== d.type) continue;
      if (!titlesCollide(d.title, spine.title)) continue;
      hits.push(spine.id);
      if (spine.kind === "epic") ensureSpineEpic(spine.id);
      if (spine.kind === "feature") ensureSpineFeature(spine.id);
      const spineNode = byId.get(spine.id);
      if (spineNode) {
        spineNode.collision = true;
        if (!spineNode.collisionWithIds.includes(d.id)) {
          spineNode.collisionWithIds.push(d.id);
        }
      }
    }
    if (hits.length > 0) {
      draftNode.collision = true;
      draftNode.collisionWithIds = hits;
    }
  }

  // Compteurs rattachés (récursif stories / features)
  function countDescendants(id: string): { features: number; stories: number } {
    const node = byId.get(id);
    if (!node) return { features: 0, stories: 0 };
    let features = 0;
    let stories = 0;
    for (const childId of node.childrenIds) {
      const child = byId.get(childId);
      if (!child) continue;
      if (child.kind === "feature") features += 1;
      if (child.kind === "story") stories += 1;
      const sub = countDescendants(childId);
      features += sub.features;
      stories += sub.stories;
    }
    return { features, stories };
  }

  for (const node of Array.from(byId.values())) {
    if (node.id === ORPHAN_ROOT_ID) continue;
    const { features, stories } = countDescendants(node.id);
    node.featureCount = features;
    node.storyCount = stories;
    node.attachedSummary =
      node.origin === "spine" || node.origin === "poured" || node.kind === "epic"
        ? buildAttachedSummary(features, stories)
        : buildAttachedSummary(features, stories);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const rank = { epic: 0, feature: 1, story: 2 } as const;
    return rank[a.kind] - rank[b.kind] || a.title.localeCompare(b.title, "fr");
  });
}

export function discoveryExpandableIds(nodes: DiscoveryFlatNode[]): Set<string> {
  return new Set(nodes.filter((n) => n.childrenIds.length > 0).map((n) => n.id));
}

export function isDiscoveryOrphanRoot(id: string): boolean {
  return id === ORPHAN_ROOT_ID;
}

/** Parent valide pour un brouillon déplacé (DnD). */
export function canReparentDiscoveryDraft(
  draft: DiscoveryDraft,
  target: DiscoveryFlatNode
): boolean {
  if (target.id === draft.id) return false;
  if (isDiscoveryOrphanRoot(target.id)) {
    return draft.type === "feature" || draft.type === "story";
  }
  if (draft.type === "epic") return false;
  if (draft.type === "feature") return target.kind === "epic";
  if (draft.type === "story") return target.kind === "feature";
  return false;
}

export function reparentTargetId(target: DiscoveryFlatNode): string | null {
  if (isDiscoveryOrphanRoot(target.id)) return null;
  return target.draftId ?? target.spineId ?? target.id;
}
