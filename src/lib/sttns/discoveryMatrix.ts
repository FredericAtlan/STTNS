/**
 * Helpers Matrice de Discovery — brouillons session (client-only), pas de statut DRAFT en DB.
 *
 * Cache : sessionStorage (F5). Archive portable : fichier JSON versionné (Draft Manager).
 */

import {
  isComplexity,
  isEffortDays,
  isImpact,
  type ComplexityLevel,
  type EffortDays,
  type ImpactLevel,
} from "@/lib/sttns/valueEffort";

export type DiscoveryItemType = "epic" | "feature" | "story";

export type DiscoveryDraft = {
  id: string;
  type: DiscoveryItemType;
  title: string;
  /** UUID Spine ou id `draft_*` session. */
  parentId: string | null;
  /** Feature uniquement — JTBD Spine obligatoire pour finaliser. */
  jtbdId: string | null;
  impact: ImpactLevel | null;
  effort_days: EffortDays | null;
  complexity: ComplexityLevel | null;
  /** Facultatif — metadata Spine à la finalisation. */
  description: string;
  doc_url: string;
  /**
   * UUID Spine après « Créer au Spine ».
   * Non null = ligne versée (lecture seule) — « Revenir en brouillon » archive + libère.
   */
  spineId: string | null;
};

/** Version du fichier d'échange Draft Manager (obligatoire à l'import). */
export const DISCOVERY_DRAFT_SCHEMA_VERSION = 1 as const;

export type DiscoveryDraftMetadata = {
  title: string;
  author: string;
  comments: string;
  /** ISO — première saisie / premier export. */
  createdAt: string | null;
  /** ISO — dernier export. */
  exportedAt: string | null;
};

export type DiscoveryDraftFile = {
  schemaVersion: typeof DISCOVERY_DRAFT_SCHEMA_VERSION;
  projectId: string;
  projectSlug: string;
  metadata: DiscoveryDraftMetadata;
  content: DiscoveryDraft[];
};

const STORAGE_PREFIX = "sttns.discovery.v1:";

export function discoveryStorageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`;
}

export function isSessionDraftId(id: string): boolean {
  return id.startsWith("draft_");
}

export function createDraftId(): string {
  return `draft_${Math.random().toString(36).slice(2, 11)}`;
}

export function emptyDraftMetadata(author = ""): DiscoveryDraftMetadata {
  return {
    title: "",
    author,
    comments: "",
    createdAt: null,
    exportedAt: null,
  };
}

/** Session non vide (lignes ou métadonnées saisies) — déclenche le warning d'écrasement. */
export function isDiscoverySessionDirty(
  drafts: DiscoveryDraft[],
  metadata: DiscoveryDraftMetadata,
  defaultAuthor = ""
): boolean {
  if (drafts.length > 0) return true;
  if (metadata.title.trim() || metadata.comments.trim()) return true;
  if (metadata.createdAt || metadata.exportedAt) return true;
  const author = metadata.author.trim();
  return Boolean(author && author !== defaultAuthor.trim());
}

/**
 * Empreinte session pour dirty cloud (lié) vs baseline post load/save.
 * Indépendant de `isDiscoverySessionDirty` (warning d'écrasement).
 */
export function discoveryCloudFingerprint(
  drafts: DiscoveryDraft[],
  metadata: DiscoveryDraftMetadata
): string {
  return JSON.stringify({ drafts, metadata });
}

export type DiscoveryReverseSpineItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  /** Story (ou item) planifiée sur un cycle = engagée en aval. */
  cycle_id?: string | null;
};

/**
 * Garde reverse : tous les items Spine (entité + descendants) doivent être `todo`
 * et sans cycle engagé (`cycle_id`).
 */
export function assertDiscoveryReverseItemsTodo(
  items: DiscoveryReverseSpineItem[]
):
  | { ok: true }
  | { ok: false; error: string; blockers: DiscoveryReverseSpineItem[] } {
  const blockers = items.filter(
    (item) => item.status !== "todo" || Boolean(item.cycle_id)
  );
  if (blockers.length === 0) return { ok: true };
  const labels = blockers
    .map((b) => {
      const reasons: string[] = [];
      if (b.status !== "todo") reasons.push(b.status);
      if (b.cycle_id) reasons.push("cycle engagé");
      return `« ${b.title.trim() || b.type} » (${reasons.join(", ") || "bloqué"})`;
    })
    .join(", ");
  return {
    ok: false,
    error:
      `Impossible de revenir en brouillon : des éléments Spine sont engagés ou hors todo — ${labels}. ` +
      "Remettez-les en todo et retirez le cycle avant d’archiver.",
    blockers,
  };
}

function isDiscoveryItemType(value: unknown): value is DiscoveryItemType {
  return value === "epic" || value === "feature" || value === "story";
}

/** Normalise un objet brut (sessionStorage) vers DiscoveryDraft, ou null si invalide. */
export function normalizeStoredDraft(raw: unknown): DiscoveryDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (!isDiscoveryItemType(o.type)) return null;

  const impact =
    o.impact == null ? null : isImpact(Number(o.impact)) ? (Number(o.impact) as ImpactLevel) : null;
  const effort_days =
    o.effort_days == null
      ? null
      : isEffortDays(Number(o.effort_days))
        ? (Number(o.effort_days) as EffortDays)
        : null;
  const complexity =
    o.complexity == null
      ? null
      : isComplexity(Number(o.complexity))
        ? (Number(o.complexity) as ComplexityLevel)
        : null;

  return {
    id: o.id,
    type: o.type,
    title: typeof o.title === "string" ? o.title : "",
    parentId: typeof o.parentId === "string" && o.parentId ? o.parentId : null,
    jtbdId: typeof o.jtbdId === "string" && o.jtbdId ? o.jtbdId : null,
    impact,
    effort_days,
    complexity,
    description: typeof o.description === "string" ? o.description : "",
    doc_url: typeof o.doc_url === "string" ? o.doc_url : "",
    spineId: typeof o.spineId === "string" && o.spineId ? o.spineId : null,
  };
}

export function parseStoredDrafts(raw: string | null): DiscoveryDraft[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .map(normalizeStoredDraft)
      .filter((d): d is DiscoveryDraft => d != null);
  } catch {
    return [];
  }
}

function normalizeMetadata(
  raw: unknown,
  fallbackAuthor = ""
): DiscoveryDraftMetadata {
  const base = emptyDraftMetadata(fallbackAuthor);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  return {
    title: typeof o.title === "string" ? o.title : "",
    author: typeof o.author === "string" ? o.author : fallbackAuthor,
    comments: typeof o.comments === "string" ? o.comments : "",
    createdAt: typeof o.createdAt === "string" && o.createdAt ? o.createdAt : null,
    exportedAt:
      typeof o.exportedAt === "string" && o.exportedAt ? o.exportedAt : null,
  };
}

/**
 * Lit le cache session : enveloppe `{ schemaVersion, metadata, content }`
 * ou legacy `DiscoveryDraft[]`.
 */
export function parseSessionPayload(
  raw: string | null,
  fallbackAuthor = ""
): { drafts: DiscoveryDraft[]; metadata: DiscoveryDraftMetadata } {
  const emptyMeta = emptyDraftMetadata(fallbackAuthor);
  if (!raw) return { drafts: [], metadata: emptyMeta };
  try {
    const data = JSON.parse(raw) as unknown;
    if (Array.isArray(data)) {
      return {
        drafts: data
          .map(normalizeStoredDraft)
          .filter((d): d is DiscoveryDraft => d != null),
        metadata: emptyMeta,
      };
    }
    if (!data || typeof data !== "object") {
      return { drafts: [], metadata: emptyMeta };
    }
    const o = data as Record<string, unknown>;
    const content = Array.isArray(o.content) ? o.content : [];
    return {
      drafts: content
        .map(normalizeStoredDraft)
        .filter((d): d is DiscoveryDraft => d != null),
      metadata: normalizeMetadata(o.metadata, fallbackAuthor),
    };
  } catch {
    return { drafts: [], metadata: emptyMeta };
  }
}

export function serializeDrafts(drafts: DiscoveryDraft[]): string {
  return JSON.stringify(drafts);
}

/** Persistance session (cache) — enveloppe versionnée + métadonnées. */
export function serializeSessionPayload(
  drafts: DiscoveryDraft[],
  metadata: DiscoveryDraftMetadata
): string {
  return JSON.stringify({
    schemaVersion: DISCOVERY_DRAFT_SCHEMA_VERSION,
    metadata,
    content: drafts,
  });
}

export function buildDiscoveryDraftFile(input: {
  projectId: string;
  projectSlug: string;
  metadata: DiscoveryDraftMetadata;
  drafts: DiscoveryDraft[];
  now?: string;
}): DiscoveryDraftFile {
  const now = input.now ?? new Date().toISOString();
  return {
    schemaVersion: DISCOVERY_DRAFT_SCHEMA_VERSION,
    projectId: input.projectId,
    projectSlug: input.projectSlug,
    metadata: {
      ...input.metadata,
      createdAt: input.metadata.createdAt ?? now,
      exportedAt: now,
    },
    content: input.drafts,
  };
}

export function serializeDiscoveryDraftFile(file: DiscoveryDraftFile): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

export function discoveryDraftDownloadFilename(
  metadata: DiscoveryDraftMetadata,
  projectSlug: string,
  exportedAt?: string | null
): string {
  const date = (exportedAt ?? metadata.exportedAt ?? new Date().toISOString()).slice(
    0,
    10
  );
  const raw = metadata.title.trim() || projectSlug || "brouillon";
  const slug = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `sttns-discovery-${slug || "brouillon"}-${date}.json`;
}

export type ParseDiscoveryDraftFileResult =
  | {
      ok: true;
      file: DiscoveryDraftFile;
      warnings: string[];
    }
  | { ok: false; error: string };

/**
 * Valide un JSON d'archive Draft Manager.
 * `schemaVersion` obligatoire ; projet différent → warning (pas hard-block).
 */
export function parseDiscoveryDraftFile(
  raw: unknown,
  opts?: { expectedProjectId?: string; expectedProjectSlug?: string }
): ParseDiscoveryDraftFileResult {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      error: "Fichier invalide : un objet JSON de brouillons STTNS est attendu.",
    };
  }

  const o = raw as Record<string, unknown>;

  if (!("schemaVersion" in o)) {
    return {
      ok: false,
      error: "schemaVersion manquant — exportez depuis le Tableau de brouillons STTNS.",
    };
  }

  if (o.schemaVersion !== DISCOVERY_DRAFT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Version de schéma non supportée (${String(o.schemaVersion)}). Attendu : ${DISCOVERY_DRAFT_SCHEMA_VERSION}.`,
    };
  }

  if (!Array.isArray(o.content)) {
    return {
      ok: false,
      error: "Clé « content » manquante ou invalide (tableau de brouillons attendu).",
    };
  }

  const drafts = o.content
    .map(normalizeStoredDraft)
    .filter((d): d is DiscoveryDraft => d != null);

  if (o.content.length > 0 && drafts.length === 0) {
    return {
      ok: false,
      error: "Aucun brouillon valide dans « content ».",
    };
  }

  const projectId =
    typeof o.projectId === "string" && o.projectId.trim() ? o.projectId.trim() : "";
  const projectSlug =
    typeof o.projectSlug === "string" && o.projectSlug.trim()
      ? o.projectSlug.trim()
      : "";

  if (!projectId || !projectSlug) {
    return {
      ok: false,
      error: "projectId et projectSlug sont obligatoires dans le fichier.",
    };
  }

  if (!o.metadata || typeof o.metadata !== "object" || Array.isArray(o.metadata)) {
    return {
      ok: false,
      error: "Métadonnées (« metadata ») manquantes ou invalides.",
    };
  }

  const warnings: string[] = [];
  if (opts?.expectedProjectId && projectId !== opts.expectedProjectId) {
    warnings.push(
      "Ce brouillon provient d'un autre projet — les parents Spine / JTBD peuvent être invalides."
    );
  } else if (
    opts?.expectedProjectSlug &&
    projectSlug !== opts.expectedProjectSlug
  ) {
    warnings.push(
      "Le slug projet du fichier diffère — vérifiez les liens Epic / Feature / JTBD."
    );
  }

  const file: DiscoveryDraftFile = {
    schemaVersion: DISCOVERY_DRAFT_SCHEMA_VERSION,
    projectId,
    projectSlug,
    metadata: normalizeMetadata(o.metadata),
    content: drafts,
  };

  return { ok: true, file, warnings };
}

/** Shape Up Feature : aucune Story (session) ne pointe encore vers cette Feature. */
export function featureHasSessionStories(
  featureId: string,
  drafts: DiscoveryDraft[]
): boolean {
  return sessionStoriesOfFeature(featureId, drafts).length > 0;
}

/**
 * Champs Effort/Risque Feature pour la finalisation.
 *
 * Doctrine V/E (vérité scientifique) :
 * - Mode normal : Feature = conteneur ; effort/risque = roll-up Stories (jamais saisis).
 * - Shape Up (cadrage) : Feature sans Story → enveloppe macro temporaire autorisée.
 * - Dès qu'une Story session existe → omit du payload (Zod / spineTree font foi).
 */
export function featureFinalizeEffortFields(
  draft: DiscoveryDraft,
  drafts: DiscoveryDraft[]
): { effort_days?: EffortDays; complexity?: ComplexityLevel } {
  if (draft.type !== "feature") return {};
  if (featureHasSessionStories(draft.id, drafts)) {
    return {};
  }
  const out: { effort_days?: EffortDays; complexity?: ComplexityLevel } = {};
  if (draft.effort_days != null && isEffortDays(draft.effort_days)) {
    out.effort_days = draft.effort_days;
  }
  if (draft.complexity != null && isComplexity(draft.complexity)) {
    out.complexity = draft.complexity;
  }
  return out;
}

/**
 * Quand une Story session se rattache à une Feature draft,
 * efface les estimations macro Shape Up (roll-up prend le relais).
 */
export function clearFeatureShapeUpIfHasStories(
  drafts: DiscoveryDraft[]
): DiscoveryDraft[] {
  return drafts.map((d) => {
    if (d.type !== "feature") return d;
    if (!featureHasSessionStories(d.id, drafts)) return d;
    if (d.effort_days == null && d.complexity == null) return d;
    return { ...d, effort_days: null, complexity: null };
  });
}

export function canFinalizeDraft(
  draft: DiscoveryDraft,
  drafts: DiscoveryDraft[]
): { ok: true } | { ok: false; reason: string } {
  if (draft.spineId) {
    return { ok: false, reason: "Déjà au Spine — utilisez Revenir en brouillon" };
  }
  if (!draft.title.trim()) {
    return { ok: false, reason: "Titre manquant" };
  }

  if (draft.type === "feature") {
    if (!draft.parentId) {
      return { ok: false, reason: "Epic parent requis" };
    }
    if (!draft.jtbdId) {
      return { ok: false, reason: "JTBD obligatoire" };
    }
    if (draft.impact == null || !isImpact(draft.impact)) {
      return { ok: false, reason: "Impact requis" };
    }
    const hasStories = featureHasSessionStories(draft.id, drafts);
    if (!hasStories) {
      if (draft.effort_days == null || !isEffortDays(draft.effort_days)) {
        return { ok: false, reason: "Effort Shape Up requis" };
      }
      if (draft.complexity == null || !isComplexity(draft.complexity)) {
        return { ok: false, reason: "Risque Shape Up requis" };
      }
    }
  }

  if (draft.type === "story") {
    if (!draft.parentId) {
      return { ok: false, reason: "Feature parente requise" };
    }
    if (draft.effort_days == null || !isEffortDays(draft.effort_days)) {
      return { ok: false, reason: "Effort requis" };
    }
    if (draft.complexity == null || !isComplexity(draft.complexity)) {
      return { ok: false, reason: "Risque requis" };
    }
  }

  return { ok: true };
}

/** Toute la chaîne parents draft → cible est finalisable. */
export function canFinalizeChain(
  draft: DiscoveryDraft,
  drafts: DiscoveryDraft[]
): boolean {
  return finalizeOrder(draft, drafts).every(
    (step) => canFinalizeDraft(step, drafts).ok
  );
}

/** Ordre de commit : parents avant enfants (Epic → Feature → Story). */
export function finalizeOrder(draft: DiscoveryDraft, drafts: DiscoveryDraft[]): DiscoveryDraft[] {
  const byId = new Map(drafts.map((d) => [d.id, d]));
  const chain: DiscoveryDraft[] = [];
  const seen = new Set<string>();

  function walk(d: DiscoveryDraft) {
    if (seen.has(d.id)) return;
    seen.add(d.id);
    if (d.parentId && isSessionDraftId(d.parentId)) {
      const parent = byId.get(d.parentId);
      if (parent) walk(parent);
    }
    chain.push(d);
  }

  walk(draft);
  return chain;
}

/**
 * Ordre d'annulation : enfants versés avant parents (Story → Feature → Epic).
 * Inclut la cible si elle a un `spineId`.
 */
export function reverseOrder(
  draft: DiscoveryDraft,
  drafts: DiscoveryDraft[]
): DiscoveryDraft[] {
  if (!draft.spineId) return [];

  const byParent = new Map<string, DiscoveryDraft[]>();
  for (const d of drafts) {
    if (!d.parentId) continue;
    const list = byParent.get(d.parentId) ?? [];
    list.push(d);
    byParent.set(d.parentId, list);
  }

  const collected: DiscoveryDraft[] = [];
  const seen = new Set<string>();

  function walkChildren(parentKeys: string[]) {
    for (const key of parentKeys) {
      for (const child of byParent.get(key) ?? []) {
        if (seen.has(child.id)) continue;
        seen.add(child.id);
        const childKeys = [child.id, ...(child.spineId ? [child.spineId] : [])];
        walkChildren(childKeys);
        if (child.spineId) collected.push(child);
      }
    }
  }

  walkChildren([draft.id, draft.spineId]);
  collected.push(draft);
  return collected;
}

/** Après archive Spine : efface `spineId` et rattache les enfants au brouillon session. */
export function applyReverseLocal(
  root: DiscoveryDraft,
  drafts: DiscoveryDraft[]
): DiscoveryDraft[] {
  const chain = reverseOrder(root, drafts);
  if (chain.length === 0) return drafts;

  const clearIds = new Set(chain.map((d) => d.id));
  const spineToSession = new Map<string, string>();
  for (const d of chain) {
    if (d.spineId) spineToSession.set(d.spineId, d.id);
  }

  return drafts.map((d) => {
    let next = d;
    if (clearIds.has(d.id) && d.spineId) {
      next = { ...next, spineId: null };
    }
    if (next.parentId && spineToSession.has(next.parentId)) {
      next = { ...next, parentId: spineToSession.get(next.parentId)! };
    }
    return next;
  });
}

const TYPE_RANK: Record<DiscoveryItemType, number> = {
  epic: 0,
  feature: 1,
  story: 2,
};

/**
 * Ordre unique pour finalisation en masse : chaînes des lignes prêtes,
 * parents avant enfants, chaque id une seule fois.
 * Si `selectedIds` est fourni, ne part que des cibles sélectionnées (toujours prêtes).
 */
export function bulkFinalizeOrder(
  drafts: DiscoveryDraft[],
  selectedIds?: ReadonlySet<string>
): DiscoveryDraft[] {
  const targets = drafts
    .filter(
      (d) =>
        canFinalizeChain(d, drafts) &&
        (selectedIds == null || selectedIds.has(d.id))
    )
    .sort(
      (a, b) =>
        TYPE_RANK[a.type] - TYPE_RANK[b.type] ||
        a.title.localeCompare(b.title, "fr")
    );

  const seen = new Set<string>();
  const out: DiscoveryDraft[] = [];
  for (const target of targets) {
    for (const step of finalizeOrder(target, drafts)) {
      if (seen.has(step.id)) continue;
      seen.add(step.id);
      out.push(step);
    }
  }
  return out;
}

export type FeatureParentOption = {
  id: string;
  title: string;
  source: "spine" | "session";
  epicId: string | null;
  epicTitle: string | null;
};

/** Groupe Features pour `<optgroup>` — label Epic ou « Sans Epic ». */
export function groupFeaturesByEpic(
  features: FeatureParentOption[]
): { label: string; options: FeatureParentOption[] }[] {
  const buckets = new Map<string, FeatureParentOption[]>();
  const labelByKey = new Map<string, string>();

  for (const f of features) {
    const key = f.epicId ?? "__none__";
    const label = f.epicTitle?.trim() || "Sans Epic";
    labelByKey.set(key, key === "__none__" ? "Sans Epic" : label);
    const list = buckets.get(key) ?? [];
    list.push(f);
    buckets.set(key, list);
  }

  const groups = Array.from(buckets.entries()).map(([key, options]) => ({
    label: labelByKey.get(key) ?? "Sans Epic",
    options: options.sort((a, b) => a.title.localeCompare(b.title, "fr")),
  }));

  groups.sort((a, b) => {
    if (a.label === "Sans Epic") return 1;
    if (b.label === "Sans Epic") return -1;
    return a.label.localeCompare(b.label, "fr");
  });

  return groups;
}

/** Libellé parent live — titre actuel + marqueur Session. */
export function formatSessionParentLabel(
  title: string,
  source: "spine" | "session",
  emptyFallback = "(sans titre)"
): string {
  const t = title.trim() || emptyFallback;
  return source === "session" ? `${t} [Session]` : t;
}

export type FeatureSessionRollup = {
  effortDays: number;
  maxRisk: ComplexityLevel | null;
  riskyCount: number;
  storyCount: number;
};

export type EpicSessionRollup = {
  totalImpact: number;
  totalDays: number;
  ratio: number | null;
  featureCount: number;
};

function draftParentKeys(parentId: string, drafts: DiscoveryDraft[]): Set<string> {
  const keys = new Set<string>([parentId]);
  const parent = drafts.find((d) => d.id === parentId);
  if (parent?.spineId) keys.add(parent.spineId);
  return keys;
}

export function sessionStoriesOfFeature(
  featureId: string,
  drafts: DiscoveryDraft[]
): DiscoveryDraft[] {
  const keys = draftParentKeys(featureId, drafts);
  return drafts.filter((d) => d.type === "story" && d.parentId != null && keys.has(d.parentId));
}

/** Roll-up UI Feature ← Stories session (derived state, pas de payload). */
export function computeFeatureSessionRollup(
  featureId: string,
  drafts: DiscoveryDraft[]
): FeatureSessionRollup {
  const stories = sessionStoriesOfFeature(featureId, drafts);
  let effortDays = 0;
  let maxRisk: ComplexityLevel | null = null;
  let riskyCount = 0;

  for (const s of stories) {
    if (typeof s.effort_days === "number") effortDays += s.effort_days;
    if (s.complexity != null) {
      if (maxRisk == null || s.complexity > maxRisk) maxRisk = s.complexity;
      if (s.complexity === 3) riskyCount += 1;
    }
  }

  return {
    effortDays,
    maxRisk,
    riskyCount,
    storyCount: stories.length,
  };
}

/**
 * Jours affichés pour une Feature session :
 * ∑ Stories si enfants, sinon effort Shape Up macro.
 */
export function computeFeatureDisplayDays(
  feature: DiscoveryDraft,
  drafts: DiscoveryDraft[]
): number {
  if (feature.type !== "feature") return 0;
  if (featureHasSessionStories(feature.id, drafts)) {
    return computeFeatureSessionRollup(feature.id, drafts).effortDays;
  }
  return typeof feature.effort_days === "number" ? feature.effort_days : 0;
}

export function sessionFeaturesOfEpic(
  epicId: string,
  drafts: DiscoveryDraft[]
): DiscoveryDraft[] {
  const keys = draftParentKeys(epicId, drafts);
  return drafts.filter((d) => d.type === "feature" && d.parentId != null && keys.has(d.parentId));
}

/** Roll-up UI Epic ← Features session (Impact + jours dérivés). */
export function computeEpicSessionRollup(
  epicId: string,
  drafts: DiscoveryDraft[]
): EpicSessionRollup {
  const features = sessionFeaturesOfEpic(epicId, drafts);
  let totalImpact = 0;
  let totalDays = 0;

  for (const f of features) {
    totalImpact += f.impact ?? 0;
    totalDays += computeFeatureDisplayDays(f, drafts);
  }

  return {
    totalImpact,
    totalDays,
    ratio: totalDays > 0 ? totalImpact / totalDays : null,
    featureCount: features.length,
  };
}
