/**
 * Scoring Valeur / Effort (architecture Lean Spine).
 *
 * Responsabilités étanches :
 * - Story  : saisie Effort (jours) + Risque (`metadata.complexity` 1–3)
 * - Feature: saisie Impact (0–3) ; Effort/Risque seulement si 0 story (Shape Up)
 * - Epic   : zéro saisie — roll-up ∑Impact, ∑Jours, ratio V/E
 *
 * Source de vérité : metadata JSONB — pas les colonnes rice_* / effort_points.
 */

import { z } from "zod";

export const EFFORT_DAYS_OPTIONS = [0.5, 1, 2, 3, 5] as const;
export type EffortDays = (typeof EFFORT_DAYS_OPTIONS)[number];

/** Échelle stockée en `metadata.complexity` — affichée UI comme « Risque ». */
export const COMPLEXITY_OPTIONS = [1, 2, 3] as const;
export type ComplexityLevel = (typeof COMPLEXITY_OPTIONS)[number];

export const IMPACT_OPTIONS = [0, 1, 2, 3] as const;
export type ImpactLevel = (typeof IMPACT_OPTIONS)[number];

export const IMPACT_LABELS: Record<ImpactLevel, string> = {
  0: "Gaspillage",
  1: "Moyen",
  2: "Fort",
  3: "Vital",
};

/** Libellés UI « Risque » (clé DB inchangée : complexity). */
export const RISK_LABELS: Record<ComplexityLevel, string> = {
  1: "Connu",
  2: "Probable",
  3: "Inconnu",
};

/** @deprecated Préférer RISK_LABELS (même contenu). */
export const COMPLEXITY_LABELS = RISK_LABELS;

export const effortDaysSchema = z.union([
  z.literal(0.5),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(5),
]);

export const complexitySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const impactSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export function isEffortDays(value: number): value is EffortDays {
  return (EFFORT_DAYS_OPTIONS as readonly number[]).includes(value);
}

export function isComplexity(value: number): value is ComplexityLevel {
  return (COMPLEXITY_OPTIONS as readonly number[]).includes(value);
}

export function isImpact(value: number): value is ImpactLevel {
  return (IMPACT_OPTIONS as readonly number[]).includes(value);
}

export function readEffortDays(metadata: unknown): EffortDays | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as Record<string, unknown>).effort_days;
  if (typeof raw !== "number") return null;
  return isEffortDays(raw) ? raw : null;
}

export function readComplexity(metadata: unknown): ComplexityLevel | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as Record<string, unknown>).complexity;
  if (typeof raw !== "number") return null;
  return isComplexity(raw) ? raw : null;
}

export function readImpact(metadata: unknown): ImpactLevel | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as Record<string, unknown>).impact;
  if (typeof raw !== "number") return null;
  return isImpact(raw) ? raw : null;
}

/**
 * Budget temps Feature : ∑ effort_days des Stories.
 * Fallback Shape Up : effort_days de la Feature si aucune Story.
 */
export function calculateFeatureDays(
  featureMetadata: unknown,
  storyMetadatas: unknown[]
): number {
  if (storyMetadatas.length > 0) {
    return storyMetadatas.reduce<number>((sum, meta) => sum + (readEffortDays(meta) ?? 0), 0);
  }
  return readEffortDays(featureMetadata) ?? 0;
}

/**
 * Niveau de menace Feature : nombre de Stories en Risque 3.
 * Fallback Shape Up : 1 si la Feature seule est en Risque 3.
 */
export function countRiskyUnits(
  featureMetadata: unknown,
  storyMetadatas: unknown[]
): number {
  if (storyMetadatas.length > 0) {
    return storyMetadatas.filter((meta) => readComplexity(meta) === 3).length;
  }
  return readComplexity(featureMetadata) === 3 ? 1 : 0;
}

export type EpicFeatureStat = {
  impact: number | null;
  calculatedDays: number;
};

export type EpicRollup = {
  /** ∑ Impact des Features (valeur globale). */
  totalImpact: number;
  /** ∑ Jours consolidés des Features. */
  totalDays: number;
  /** Impact Global / Coût Global — null si coût = 0. */
  ratio: number | null;
};

/** Roll-up Epic pur calcul — aucune saisie manuelle. */
export function calculateEpicRollup(features: EpicFeatureStat[]): EpicRollup {
  const totalImpact = features.reduce((sum, f) => sum + (f.impact ?? 0), 0);
  const totalDays = features.reduce((sum, f) => sum + f.calculatedDays, 0);
  const ratio = totalDays > 0 ? totalImpact / totalDays : null;
  return { totalImpact, totalDays, ratio };
}

/**
 * Ratio Valeur/Effort d'un epic.
 * @deprecated Préférer calculateEpicRollup().ratio
 */
export function calculateEpicValueEffortRatio(features: EpicFeatureStat[]): number | null {
  return calculateEpicRollup(features).ratio;
}

export function formatValueEffortRatio(ratio: number | null): string {
  if (ratio == null || Number.isNaN(ratio)) return "—";
  return ratio.toFixed(2);
}

export function formatEffortDays(days: number | null | undefined): string {
  if (days == null || Number.isNaN(days)) return "—";
  return `${days}j`;
}

/**
 * SOURCE DE VÉRITÉ — somme des jours d'effort actifs.
 *
 * Consommateurs autorisés :
 *   - `ExecutionBacklogKpis` / `computeExecutionBacklogMetrics` (backlog global)
 *   - `KanbanBoard` header (compteur exécution stories)
 *   - `CycleCapacityBar` (charge cycle, via `SpineStoriesCatalog` /
 *     `CycleDashboardClient`)
 *
 * Définition canonique :
 *   somme des `effort_days` sur items :
 *     - non `done` (une story terminée ne consomme plus de capacité)
 *     - avec un effort valide (`hasValidEffort !== false` et `effortDays > 0`)
 *
 * Toute nouvelle surface qui affiche « jours d'effort actifs » DOIT passer par
 * ce helper — ne pas dupliquer la règle ailleurs.
 */
export function sumActiveEffortDays(
  items: Array<{
    status?: string | null;
    effortDays?: number | null;
    hasValidEffort?: boolean;
  }>
): number {
  return items.reduce((sum, item) => {
    if (item.status === "done") return sum;
    if (item.hasValidEffort === false) return sum;
    return sum + (item.effortDays ?? 0);
  }, 0);
}

/** Badge compact Risque — ex. R:3 (clé DB : complexity). */
export function formatRiskBadge(level: ComplexityLevel | null | undefined): string {
  if (level == null) return "—";
  return `R:${level}`;
}

/** Affichage Valeur Feature — ex. I:2 Fort */
export function formatImpactBadge(
  impact: ImpactLevel | null | undefined,
  withLabel = false
): string {
  if (impact == null) return "—";
  if (!withLabel) return `I:${impact}`;
  return `I:${impact} ${IMPACT_LABELS[impact]}`;
}
