import type { JobToBeDone, PainPoint } from "@/lib/personas/personaMatrix.types";

export const GHOST_JOB_MESSAGE =
  "⚠️ Ce Job n'adresse aucune friction connue. Est-il vraiment nécessaire ?";

export const IGNORED_PAIN_MESSAGE =
  "🚨 Ce point de friction n'est résolu par aucun Job To Be Done.";

export type PersonaCoverageWarning = {
  kind: "ghost-job";
  jobId: string;
  jobLabel: string;
  message: string;
};

export type PersonaCoverageCritical = {
  kind: "ignored-pain";
  painId: string;
  painLabel: string;
  message: string;
};

export type PersonaCoverageReport = {
  warnings: PersonaCoverageWarning[];
  criticals: PersonaCoverageCritical[];
  /** Toutes les frictions saisies sont couvertes par au moins un JTBD. */
  painsFullyCovered: boolean;
  /** Aucune alerte critique — READY autorisé. */
  readyAllowed: boolean;
  metrics: PersonaAlignmentMetrics;
};

export type PersonaAlignmentLevel = "healthy" | "caution" | "critical" | "neutral";

export type PersonaAlignmentMetrics = {
  /** Frictions reliées à au moins un JTBD (0–100). */
  ecosystemCoveragePct: number;
  coveredPainCount: number;
  totalPainCount: number;
  ignoredPainCount: number;
  /** Ratio JTBD / PP — null si aucune friction. */
  alignmentDensityRatio: number | null;
  totalJobCount: number;
  ghostJobCount: number;
};

export function computePersonaAlignmentMetrics(
  painPoints: PainPoint[],
  jobs: JobToBeDone[]
): PersonaAlignmentMetrics {
  const labeledPains = painPoints.filter((p) => p.shortLabel.trim());
  const labeledJobs = jobs.filter((j) => j.label.trim());
  const totalPainCount = labeledPains.length;
  const totalJobCount = labeledJobs.length;

  const resolvedPainIds = new Set(
    labeledJobs.flatMap((job) => job.resolvedPainPointIds)
  );

  const coveredPainCount = labeledPains.filter((p) => resolvedPainIds.has(p.id)).length;
  const ignoredPainCount = totalPainCount - coveredPainCount;
  const ghostJobCount = labeledJobs.filter((j) => j.resolvedPainPointIds.length === 0).length;

  const ecosystemCoveragePct =
    totalPainCount === 0 ? 0 : Math.round((coveredPainCount / totalPainCount) * 100);

  const alignmentDensityRatio =
    totalPainCount === 0 ? null : Math.round((totalJobCount / totalPainCount) * 10) / 10;

  return {
    ecosystemCoveragePct,
    coveredPainCount,
    totalPainCount,
    ignoredPainCount,
    alignmentDensityRatio,
    totalJobCount,
    ghostJobCount,
  };
}

export function ecosystemCoverageLevel(pct: number, totalPains: number): PersonaAlignmentLevel {
  if (totalPains === 0) return "neutral";
  if (pct >= 100) return "healthy";
  if (pct >= 50) return "caution";
  return "critical";
}

export function densityLevel(ratio: number | null): PersonaAlignmentLevel {
  if (ratio == null) return "neutral";
  if (ratio <= 1.5) return "healthy";
  if (ratio <= 2) return "caution";
  return "critical";
}

export function ghostLevel(count: number): PersonaAlignmentLevel {
  if (count === 0) return "healthy";
  if (count <= 2) return "caution";
  return "critical";
}

export function computePersonaCoverage(
  painPoints: PainPoint[],
  jobs: JobToBeDone[]
): PersonaCoverageReport {
  const labeledPains = painPoints.filter((p) => p.shortLabel.trim());
  const labeledJobs = jobs.filter((j) => j.label.trim());

  const resolvedPainIds = new Set(
    labeledJobs.flatMap((job) => job.resolvedPainPointIds)
  );

  const criticals: PersonaCoverageCritical[] = labeledPains
    .filter((pain) => !resolvedPainIds.has(pain.id))
    .map((pain) => ({
      kind: "ignored-pain" as const,
      painId: pain.id,
      painLabel: pain.shortLabel.trim(),
      message: IGNORED_PAIN_MESSAGE,
    }));

  const warnings: PersonaCoverageWarning[] = labeledJobs
    .filter((job) => job.resolvedPainPointIds.length === 0)
    .map((job) => ({
      kind: "ghost-job" as const,
      jobId: job.id,
      jobLabel: job.label.trim(),
      message: GHOST_JOB_MESSAGE,
    }));

  return {
    warnings,
    criticals,
    painsFullyCovered: criticals.length === 0,
    readyAllowed: criticals.length === 0,
    metrics: computePersonaAlignmentMetrics(painPoints, jobs),
  };
}

/** Renumérote pp-1…n et met à jour les liens JTBD après suppression. */
export function renumberPainPoints(
  painPoints: PainPoint[],
  jobs: JobToBeDone[]
): { painPoints: PainPoint[]; jobs: JobToBeDone[] } {
  const idMap = new Map<string, string>();
  const renumbered = painPoints.map((point, index) => {
    const newId = `pp-${index + 1}`;
    idMap.set(point.id, newId);
    return { ...point, id: newId };
  });

  const validIds = new Set(renumbered.map((p) => p.id));
  const updatedJobs = jobs.map((job) => ({
    ...job,
    resolvedPainPointIds: job.resolvedPainPointIds
      .map((id) => idMap.get(id) ?? id)
      .filter((id) => validIds.has(id)),
  }));

  return { painPoints: renumbered, jobs: updatedJobs };
}

export function stripPainPointFromJobs(
  painId: string,
  jobs: JobToBeDone[]
): JobToBeDone[] {
  return jobs.map((job) => ({
    ...job,
    resolvedPainPointIds: job.resolvedPainPointIds.filter((id) => id !== painId),
  }));
}
