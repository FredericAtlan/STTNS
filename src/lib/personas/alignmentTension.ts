export type AlignmentTensionStatus = "CHIRURGICAL" | "SOUS-SPÉCIFIÉ" | "SURCHARGE";

export type AlignmentTensionResult = {
  ratio: number;
  status: AlignmentTensionStatus;
  gaugePercent: number;
};

const GAUGE_MAX_RATIO = 2.5;
/** Seuil haut de la zone chirurgicale ; au-delà → surcharge. */
export const ALIGNMENT_SURCHARGE_THRESHOLD = 1.4;

export function computeAlignmentTension(
  totalPP: number,
  totalJTBD: number
): AlignmentTensionResult {
  const ratio = totalPP > 0 ? totalJTBD / totalPP : 0;
  const status = resolveTensionStatus(ratio);
  const gaugePercent = ratioToGaugePercent(ratio);
  return { ratio, status, gaugePercent };
}

export function resolveTensionStatus(ratio: number): AlignmentTensionStatus {
  if (ratio >= 1.0 && ratio <= ALIGNMENT_SURCHARGE_THRESHOLD) return "CHIRURGICAL";
  if (ratio < 1.0) return "SOUS-SPÉCIFIÉ";
  return "SURCHARGE";
}

/** Mappe le ratio sur la jauge 0–100 % (zones 0–49 / 50–65 / 66–100). */
export function ratioToGaugePercent(ratio: number): number {
  if (ratio < 1.0) {
    return (ratio / 1.0) * 49;
  }
  if (ratio <= ALIGNMENT_SURCHARGE_THRESHOLD) {
    return 50 + ((ratio - 1.0) / (ALIGNMENT_SURCHARGE_THRESHOLD - 1.0)) * 15;
  }
  const capped = Math.min(ratio, GAUGE_MAX_RATIO);
  return (
    66 +
    ((capped - ALIGNMENT_SURCHARGE_THRESHOLD) / (GAUGE_MAX_RATIO - ALIGNMENT_SURCHARGE_THRESHOLD)) *
      34
  );
}

export function formatTensionRatio(ratio: number): string {
  return (Math.round(ratio * 10) / 10).toFixed(1);
}
