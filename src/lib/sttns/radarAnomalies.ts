/**
 * Radar d'Hygiène — logique d'anomalies partagée (pure / client-safe).
 *
 * Source de vérité unique pour :
 * - Sidebar (badge « anomalies » sur Radar)
 * - Page Radar (widgets détaillés)
 *
 * Objectif : sidebar et widgets ne peuvent PAS diverger.
 *
 * Aucun import serveur ; toutes les fonctions sont pures et acceptent des
 * lignes déjà chargées par l'appelant (server component ou client fetch).
 */

import { isPainPointJob } from "@/lib/sttns/whySpine";
import { readTaskNotionUrl } from "@/lib/sttns/schema";
import { readEffortDays, readImpact } from "@/lib/sttns/valueEffort";

/**
 * Ligne minimale nécessaire pour classer un work item comme feature/story/etc.
 * Correspond aux colonnes récupérées côté client + serveur.
 */
export type AnomalyWorkItemRow = {
  id: string;
  title: string;
  type: "epic" | "feature" | "story" | "task" | "persona" | "job";
  status?: string | null;
  parent_id?: string | null;
  updated_at?: string | null;
  metadata?: unknown;
};

export type AnomalyContextLinkRow = {
  work_item_id: string;
  context_type: string;
  context_id: string;
};

export type AnomalyWorkItemLinkRow = {
  source_id: string;
  type: string;
  target_id?: string;
};

export interface RadarAnomalyInput {
  workItems: AnomalyWorkItemRow[];
  contextLinks: AnomalyContextLinkRow[];
  workItemLinks: AnomalyWorkItemLinkRow[];
  /** Jours de stagnation configurés au niveau projet (1–90). */
  stagnationDays: number;
  /** Date de référence — testable ; défaut `new Date()`. */
  now?: Date;
}

export interface RadarAnomalyCounts {
  orphans: number;
  stagnants: number;
  wasteFeatures: number;
  ghostJtbds: number;
  undocumentedTasks: number;
  total: number;
}

/** Calcule le nombre de jours calendaires écoulés (arrondi bas). */
function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

/**
 * Sous-ensemble d'IDs de jobs qui sont des Pain Points (`spine_role=pain_point`
 * ou fallback titre `[Pain Point: …]`).
 */
export function collectPainPointJobIds(
  workItems: AnomalyWorkItemRow[]
): Set<string> {
  const set = new Set<string>();
  for (const row of workItems) {
    if (row.type === "job" && isPainPointJob(row.metadata, row.title)) {
      set.add(row.id);
    }
  }
  return set;
}

/**
 * Features orphelines : aucun `context_links(context_type='job')` pointant
 * vers un JTBD réel (les liens vers un Pain Point ne comptent PAS).
 */
export function computeOrphanFeatureIds(input: {
  workItems: AnomalyWorkItemRow[];
  contextLinks: AnomalyContextLinkRow[];
}): Set<string> {
  const painPointJobIds = collectPainPointJobIds(input.workItems);

  const featureIdsWithJtbdLink = new Set<string>();
  for (const link of input.contextLinks) {
    if (link.context_type !== "job") continue;
    if (painPointJobIds.has(link.context_id)) continue;
    featureIdsWithJtbdLink.add(link.work_item_id);
  }

  const orphanIds = new Set<string>();
  for (const item of input.workItems) {
    if (item.type !== "feature") continue;
    if (!featureIdsWithJtbdLink.has(item.id)) {
      orphanIds.add(item.id);
    }
  }
  return orphanIds;
}

/** Stories bloquées `in_progress` ou `review` depuis plus de `stagnationDays`. */
export function computeStagnantStoryIds(input: {
  workItems: AnomalyWorkItemRow[];
  stagnationDays: number;
  now?: Date;
}): Set<string> {
  const now = input.now ?? new Date();
  const set = new Set<string>();
  for (const item of input.workItems) {
    if (item.type !== "story") continue;
    if (item.status !== "in_progress" && item.status !== "review") continue;
    if (!item.updated_at) continue;
    const days = daysBetween(new Date(item.updated_at), now);
    if (days > input.stagnationDays) set.add(item.id);
  }
  return set;
}

/** Features en Impact 0 (hard block `in_progress`). */
export function computeWasteFeatureIds(
  workItems: AnomalyWorkItemRow[]
): Set<string> {
  const set = new Set<string>();
  for (const item of workItems) {
    if (item.type !== "feature") continue;
    if (readImpact(item.metadata) === 0) set.add(item.id);
  }
  return set;
}

/**
 * JTBD sans aucun lien `solves` (source_id = jtbd) dans `sttns_work_item_links`.
 * Les Pain Points (type job avec spine_role=pain_point) sont exclus.
 */
export function computeGhostJtbdIds(input: {
  workItems: AnomalyWorkItemRow[];
  workItemLinks: AnomalyWorkItemLinkRow[];
}): Set<string> {
  const painPointJobIds = collectPainPointJobIds(input.workItems);
  const solversByJtbd = new Set<string>();
  for (const link of input.workItemLinks) {
    if (link.type !== "solves") continue;
    solversByJtbd.add(link.source_id);
  }
  const set = new Set<string>();
  for (const item of input.workItems) {
    if (item.type !== "job") continue;
    if (painPointJobIds.has(item.id)) continue;
    if (!solversByJtbd.has(item.id)) set.add(item.id);
  }
  return set;
}

/** Tasks `done` sans lien Notion (`metadata.notion_url`). */
export function computeUndocumentedTaskIds(
  workItems: AnomalyWorkItemRow[]
): Set<string> {
  const set = new Set<string>();
  for (const item of workItems) {
    if (item.type !== "task") continue;
    if (item.status !== "done") continue;
    if (!readTaskNotionUrl(item.metadata)) set.add(item.id);
  }
  return set;
}

/** Compte global — utilisé par la sidebar pour afficher le badge. */
export function computeRadarAnomalyCounts(
  input: RadarAnomalyInput
): RadarAnomalyCounts {
  const orphans = computeOrphanFeatureIds({
    workItems: input.workItems,
    contextLinks: input.contextLinks,
  }).size;
  const stagnants = computeStagnantStoryIds({
    workItems: input.workItems,
    stagnationDays: input.stagnationDays,
    now: input.now,
  }).size;
  const wasteFeatures = computeWasteFeatureIds(input.workItems).size;
  const ghostJtbds = computeGhostJtbdIds({
    workItems: input.workItems,
    workItemLinks: input.workItemLinks,
  }).size;
  const undocumentedTasks = computeUndocumentedTaskIds(input.workItems).size;

  return {
    orphans,
    stagnants,
    wasteFeatures,
    ghostJtbds,
    undocumentedTasks,
    total: orphans + stagnants + wasteFeatures + ghostJtbds + undocumentedTasks,
  };
}

/** Effort story sûr — 0 si non renseigné. */
export function readStoryEffortDays(metadata: unknown): number {
  return readEffortDays(metadata) ?? 0;
}
