/** RICE = (Reach × Impact × Confidence%) / Effort */
export function calculateRiceScore(
  reach: number,
  impact: number,
  confidence: number,
  effort: number
): number {
  if (effort <= 0 || !Number.isFinite(effort)) return 0;
  const score = (reach * impact * (confidence / 100)) / effort;
  if (!Number.isFinite(score)) return 0;
  return Math.round(score * 10) / 10;
}

/** Affichage UI — une décimale max, entier si possible. */
export function formatRiceScore(score: number): string {
  if (!Number.isFinite(score)) return "0";
  const rounded = Math.round(score * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
