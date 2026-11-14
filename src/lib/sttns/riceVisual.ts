import type { GovernanceBucket } from "@/lib/sttns/governanceAxes";

/** Entrées UI RICE — carrés 1 à 10 (Reach, Impact, Confiance, Effort). */
export const RICE_INPUT_MIN = 1;
export const RICE_INPUT_MAX = 10;

export const STTNS_SCORE_MAX = 100;
/** Maximum théorique : R=I=C=10, E=1 → (10×10×1)/1×10 = 1000 */
export const STTNS_SCORE_RAW_MAX = 1000;
export const STTNS_COMMITTEE_MIN_SCORE = 40;
/** Seuil comité sur l'échelle brute (équivalent à 40/100 normalisé tant que raw ≤ 100). */
export const STTNS_COMMITTEE_MIN_RAW = STTNS_COMMITTEE_MIN_SCORE;

export const STTNS_SCORE_LABEL = "Score STTNS legacy (0-100)";
export const STTNS_RICE_SCORE_LABEL = "Score STTNS legacy / RICE (0–1000)";

export type RiceInputs = {
  reach: number | null;
  impact: number | null;
  confidence: number | null;
  effort: number | null;
};

function clampRiceAxis(value: number): number {
  return Math.min(RICE_INPUT_MAX, Math.max(RICE_INPUT_MIN, value));
}

/** Compat legacy : reach volume, confiance 0–1 → échelle 1–10. */
function normalizeLegacyRiceInputs(
  reach: number | null,
  impact: number | null,
  confidence: number | null,
  effort: number | null
): { reach: number; impact: number; confidence: number; effort: number } {
  let r = reach ?? 0;
  let i = impact ?? 0;
  let c = confidence ?? 0;
  let e = effort ?? 0;

  if (c > 0 && c <= 1) c *= 10;
  if (r > RICE_INPUT_MAX) {
    r = Math.min(RICE_INPUT_MAX, Math.max(RICE_INPUT_MIN, Math.round(r / 100)));
  }
  if (i > RICE_INPUT_MAX) i = RICE_INPUT_MAX;
  if (e > RICE_INPUT_MAX) e = RICE_INPUT_MAX;

  return {
    reach: r > 0 ? clampRiceAxis(r) : 0,
    impact: i > 0 ? clampRiceAxis(i) : 0,
    confidence: c > 0 ? clampRiceAxis(c) : 0,
    effort: e > 0 ? clampRiceAxis(e) : 0,
  };
}

/**
 * Score RICE brut (non plafonné) :
 * (R × I × (C/10)) / E × 10 — chaque axe en échelle 1–10, max théorique 1000.
 */
export function computeSttnsScoreRaw(
  reach: number | null,
  impact: number | null,
  confidence: number | null,
  effort: number | null
): number | null {
  if (effort == null || effort <= 0) return null;
  const n = normalizeLegacyRiceInputs(reach, impact, confidence, effort);
  if (!n.effort) return null;
  return ((n.reach * n.impact * (n.confidence / 10)) / n.effort) * 10;
}

/**
 * Score STTNS normalisé CEO-friendly :
 * min(100, score brut)
 */
export function computeSttnsScore(
  reach: number | null,
  impact: number | null,
  confidence: number | null,
  effort: number | null
): number | null {
  const raw = computeSttnsScoreRaw(reach, impact, confidence, effort);
  if (raw == null) return null;
  return Math.min(STTNS_SCORE_MAX, raw);
}

export function computeSttnsScoreFromInputs(inputs: RiceInputs): number | null {
  return computeSttnsScore(inputs.reach, inputs.impact, inputs.confidence, inputs.effort);
}

/** @deprecated Alias — préférer computeSttnsScore */
export function computeRiceScore(
  reach: number | null,
  impact: number | null,
  confidence: number | null,
  effort: number | null
): number | null {
  return computeSttnsScore(reach, impact, confidence, effort);
}

export function formatSttnsScore(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return "—";
  return `${Math.min(STTNS_SCORE_MAX, Math.round(score))}/100`;
}

export function formatSttnsScoreRaw(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return "—";
  return `${Math.round(score)}/${STTNS_SCORE_RAW_MAX}`;
}

/** Largeur jauge preview (0–100 %) sur l'échelle 0–1000. */
export function sttnsRawScoreBarPercent(raw: number | null | undefined): number {
  if (raw == null || Number.isNaN(raw) || raw <= 0) return 0;
  return Math.min(100, (raw / STTNS_SCORE_RAW_MAX) * 100);
}

export function meetsCommitteeSttnsRawScore(raw: number | null | undefined): boolean {
  return raw != null && raw >= STTNS_COMMITTEE_MIN_RAW;
}

export function isSttnsScoreCapped(raw: number | null | undefined): boolean {
  return raw != null && raw > STTNS_SCORE_MAX;
}

export type InitiativeRiceFields = {
  rice_reach?: number | null;
  rice_impact?: number | null;
  rice_confidence?: number | null;
  rice_effort?: number | null;
  rice_score?: number | null;
};

/** Score affiché — recalculé depuis R,I,C,E (prioritaire sur la colonne DB legacy). */
export function resolveSttnsScore(initiative: InitiativeRiceFields): number | null {
  if (initiative.rice_effort != null && initiative.rice_effort > 0) {
    return computeSttnsScore(
      initiative.rice_reach ?? null,
      initiative.rice_impact ?? null,
      initiative.rice_confidence ?? null,
      initiative.rice_effort ?? null
    );
  }
  if (initiative.rice_score != null) {
    return Math.min(STTNS_SCORE_MAX, initiative.rice_score);
  }
  return null;
}

export function formatInitiativeSttnsScore(initiative: InitiativeRiceFields): string {
  return formatSttnsScore(resolveSttnsScore(initiative));
}

export function meetsCommitteeSttnsScore(score: number | null | undefined): boolean {
  return score != null && score >= STTNS_COMMITTEE_MIN_SCORE;
}

/** Effort 1 → droite (favorable), Effort 10 → gauche. */
export function effortToScatterXPercent(effort: number | null | undefined, fallback = 5): number {
  const e = clampRiceAxis(effort ?? fallback);
  return 92 - ((e - RICE_INPUT_MIN) / (RICE_INPUT_MAX - RICE_INPUT_MIN)) * 84;
}

/** Impact 10 → haut, Impact 1 → bas. */
export function impactToScatterYPercent(impact: number | null | undefined, fallback = 5): number {
  const i = clampRiceAxis(impact ?? fallback);
  return 92 - ((i - RICE_INPUT_MIN) / (RICE_INPUT_MAX - RICE_INPUT_MIN)) * 84;
}

/** Taille bulle / carte — calibrée sur 0–100. */
export function sttnsScorePointSize(score: number | null | undefined): number {
  const value = score ?? 0;
  if (value <= 0) return 14;
  if (value < 25) return 16;
  if (value < 50) return 20;
  if (value < 75) return 24;
  return 28;
}

/** Couleur de fond selon le score (heatmap douce). */
export function sttnsScoreBackground(score: number | null | undefined): string {
  const value = score ?? 0;
  if (value >= 75) return "rgb(16 185 129)"; // emerald-500
  if (value >= 50) return "rgb(59 130 246)"; // blue-500
  if (value >= STTNS_COMMITTEE_MIN_SCORE) return "rgb(245 158 11)"; // amber-500
  if (value > 0) return "rgb(244 63 94)"; // rose-500
  return "rgb(161 161 170)"; // zinc-400
}

export function sttnsScoreBorder(score: number | null | undefined): string {
  const value = score ?? 0;
  if (value >= 75) return "border-emerald-300";
  if (value >= 50) return "border-blue-300";
  if (value >= STTNS_COMMITTEE_MIN_SCORE) return "border-amber-300";
  if (value > 0) return "border-rose-300";
  return "border-zinc-300";
}

export const IMPACT_EFFORT_QUADRANTS = {
  quickWins: { label: "Quick Wins", className: "text-emerald-700" },
  strategic: { label: "Strategic", className: "text-blue-700" },
  fillIns: { label: "Fill-ins", className: "text-zinc-600" },
  moneyPits: { label: "Money Pits", className: "text-rose-700" },
} as const;

export const KANO_SATISFACTION_LABELS = [
  "Dissatisfied",
  "Neutral",
  "Satisfied",
  "Delighted",
] as const;

export const KANO_FUNCTIONALITY_LABELS = ["None", "Some", "Basic", "Good", "Best"] as const;

export const KANO_SATISFACTION_ZONES = [
  {
    id: "delighted" as const,
    label: "Delighted",
    rowClass: "bg-violet-50/90",
    pillClass: "text-violet-800 bg-violet-100 ring-violet-200",
  },
  {
    id: "satisfied" as const,
    label: "Satisfied",
    rowClass: "bg-emerald-50/90",
    pillClass: "text-emerald-800 bg-emerald-100 ring-emerald-200",
  },
  {
    id: "neutral" as const,
    label: "Neutral",
    rowClass: "bg-amber-50/90",
    pillClass: "text-amber-900 bg-amber-100 ring-amber-200",
  },
  {
    id: "dissatisfied" as const,
    label: "Dissatisfied",
    rowClass: "bg-rose-50/90",
    pillClass: "text-rose-800 bg-rose-100 ring-rose-200",
  },
] as const;

export const KANO_FUNCTIONALITY_ZONES = [
  {
    id: "none" as const,
    label: "None",
    cellTint: "bg-rose-100/35",
    textClass: "text-rose-700",
  },
  {
    id: "some" as const,
    label: "Some",
    cellTint: "bg-amber-100/35",
    textClass: "text-amber-800",
  },
  {
    id: "basic" as const,
    label: "Basic",
    cellTint: "bg-emerald-100/35",
    textClass: "text-emerald-800",
  },
  {
    id: "good" as const,
    label: "Good",
    cellTint: "bg-violet-100/35",
    textClass: "text-violet-700",
  },
  {
    id: "best" as const,
    label: "Best",
    cellTint: "bg-orange-100/35",
    textClass: "text-orange-700",
  },
] as const;

export type KanoQualitativeFeature = {
  kano_type?: string | null;
  projected_satisfaction_level?: string | null;
  projected_functionality_level?: string | null;
  rice_impact?: number | null;
  rice_effort?: number | null;
};

export const MATRIX_BUBBLE_SIZE = 20;

export function impactToProjectedSatisfaction(
  impact: number
): (typeof KANO_SATISFACTION_ZONES)[number]["id"] {
  const i = clampRiceAxis(impact);
  if (i <= 2.5) return "dissatisfied";
  if (i <= 5) return "neutral";
  if (i <= 7.5) return "satisfied";
  return "delighted";
}

export function effortToProjectedFunctionality(
  effort: number
): (typeof KANO_FUNCTIONALITY_ZONES)[number]["id"] {
  const e = clampRiceAxis(effort);
  if (e <= 2) return "none";
  if (e <= 4) return "some";
  if (e <= 6) return "basic";
  if (e <= 8) return "good";
  return "best";
}

export function defaultProjectedSatisfaction(
  kano: string | null | undefined
): (typeof KANO_SATISFACTION_ZONES)[number]["id"] {
  switch (kano) {
    case "must_be":
      return "neutral";
    case "performance":
      return "satisfied";
    case "attractive":
      return "delighted";
    default:
      return "neutral";
  }
}

export function defaultProjectedFunctionality(
  kano: string | null | undefined
): (typeof KANO_FUNCTIONALITY_ZONES)[number]["id"] {
  switch (kano) {
    case "must_be":
      return "basic";
    case "performance":
      return "good";
    case "attractive":
      return "best";
    default:
      return "some";
  }
}

/** Placement Kano strictement qualitatif — pas de dérivation depuis RICE. */
export function resolveProjectedSatisfaction(
  feature: KanoQualitativeFeature
): (typeof KANO_SATISFACTION_ZONES)[number]["id"] {
  const level = feature.projected_satisfaction_level;
  if (level && KANO_SATISFACTION_ZONES.some((z) => z.id === level)) {
    return level as (typeof KANO_SATISFACTION_ZONES)[number]["id"];
  }
  return defaultProjectedSatisfaction(feature.kano_type);
}

/** Placement Kano strictement qualitatif — pas de dérivation depuis RICE. */
export function resolveProjectedFunctionality(
  feature: KanoQualitativeFeature
): (typeof KANO_FUNCTIONALITY_ZONES)[number]["id"] {
  const level = feature.projected_functionality_level;
  if (level && KANO_FUNCTIONALITY_ZONES.some((z) => z.id === level)) {
    return level as (typeof KANO_FUNCTIONALITY_ZONES)[number]["id"];
  }
  return defaultProjectedFunctionality(feature.kano_type);
}

export function kanoCellKey(
  satisfaction: (typeof KANO_SATISFACTION_ZONES)[number]["id"],
  functionality: (typeof KANO_FUNCTIONALITY_ZONES)[number]["id"]
): string {
  return `${satisfaction}:${functionality}`;
}

/** Position % dans la matrice Kano (5×4) — pour transitions unifiées. */
export function kanoPositionPercent(
  satisfaction: (typeof KANO_SATISFACTION_ZONES)[number]["id"],
  functionality: (typeof KANO_FUNCTIONALITY_ZONES)[number]["id"],
  indexInCell = 0,
  totalInCell = 1
): { x: number; y: number } {
  const col = KANO_FUNCTIONALITY_ZONES.findIndex((z) => z.id === functionality);
  const row = KANO_SATISFACTION_ZONES.findIndex((z) => z.id === satisfaction);
  const cellW = 100 / KANO_FUNCTIONALITY_ZONES.length;
  const cellH = 100 / KANO_SATISFACTION_ZONES.length;
  const offset = kanoCellBubbleOffset(indexInCell, totalInCell);
  return {
    x: col * cellW + (offset.x / 100) * cellW,
    y: row * cellH + (offset.y / 100) * cellH,
  };
}

export type GovernanceBubbleBucket = GovernanceBucket;

export function governanceBubbleColor(bucket: GovernanceBubbleBucket): string {
  switch (bucket) {
    case "draft":
      return "rgb(161 161 170)";
    case "in_review":
      return "rgb(59 130 246)";
    case "ceo_pending":
      return "rgb(245 158 11)";
    case "build":
      return "rgb(16 185 129)";
    case "learn":
      return "rgb(139 92 246)";
    case "killed":
      return "rgb(100 116 139)";
    default:
      return "rgb(161 161 170)";
  }
}

export function governanceBubbleLabel(bucket: GovernanceBubbleBucket): string {
  switch (bucket) {
    case "draft":
      return "Brouillon";
    case "in_review":
      return "Comité";
    case "ceo_pending":
      return "Validation CEO";
    case "build":
      return "BUILD";
    case "learn":
      return "LEARN";
    case "killed":
      return "KILL";
    default:
      return "—";
  }
}

/** Décalage léger quand plusieurs features partagent la même case. */
export function kanoCellBubbleOffset(index: number, total: number): { x: number; y: number } {
  if (total <= 1) return { x: 50, y: 50 };
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = Math.min(22, 10 + total * 3);
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
}

/** Effort 1 → None (gauche), Effort 10 → Best (droite) — axe Functionality Kano. */
export function functionalityToXPercent(effort: number | null | undefined, fallback = 5): number {
  const e = clampRiceAxis(effort ?? fallback);
  return 8 + ((e - RICE_INPUT_MIN) / (RICE_INPUT_MAX - RICE_INPUT_MIN)) * 84;
}

export function kanoTypeColor(kano: string | null | undefined): string {
  switch (kano) {
    case "must_be":
      return "rgb(244 63 94)";
    case "performance":
      return "rgb(59 130 246)";
    case "attractive":
      return "rgb(16 185 129)";
    default:
      return "rgb(161 161 170)";
  }
}

export function kanoTypeLabel(kano: string | null | undefined): string {
  switch (kano) {
    case "must_be":
      return "Must-be";
    case "performance":
      return "Performance";
    case "attractive":
      return "Attractive";
    default:
      return "Non classé";
  }
}

export const KANO_COLUMN_ORDER = ["must_be", "performance", "attractive"] as const;

export const KANO_COLUMN_LABELS: Record<(typeof KANO_COLUMN_ORDER)[number], string> = {
  must_be: "Must-be",
  performance: "Performance",
  attractive: "Attractive",
};

export const KANO_COLUMN_ACCENTS: Record<(typeof KANO_COLUMN_ORDER)[number], string> = {
  must_be: "border-rose-200/70 bg-rose-50/40",
  performance: "border-blue-200/70 bg-blue-50/40",
  attractive: "border-emerald-200/70 bg-emerald-50/40",
};
