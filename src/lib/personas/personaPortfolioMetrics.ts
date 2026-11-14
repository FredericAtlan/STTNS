import type { SttnsPersona } from "@/types/sttns";
import { personaToFormValues } from "@/lib/personas/personaFormMappers";
import {
  computePersonaAlignmentMetrics,
  type PersonaAlignmentMetrics,
} from "@/lib/personas/personaCoverage";

export type PersonaPortfolioMetrics = {
  personaCount: number;
  activePersonaCount: number;
  tierCountActive: number;
  tierCountAll: number;
  healthyMatrixCountActive: number;
  healthyMatrixCountAll: number;
  /** Métriques d'alignement — personas actifs uniquement. */
  active: PersonaAlignmentMetrics;
  /** Métriques d'alignement — portefeuille complet. */
  all: PersonaAlignmentMetrics;
};

function aggregateAlignmentMetrics(personas: SttnsPersona[]): PersonaAlignmentMetrics {
  let coveredPainCount = 0;
  let totalPainCount = 0;
  let totalJobCount = 0;
  let ghostJobCount = 0;
  let ignoredPainCount = 0;

  for (const persona of personas) {
    const values = personaToFormValues(persona);
    const metrics = computePersonaAlignmentMetrics(values.painPoints, values.jobs);
    coveredPainCount += metrics.coveredPainCount;
    totalPainCount += metrics.totalPainCount;
    totalJobCount += metrics.totalJobCount;
    ghostJobCount += metrics.ghostJobCount;
    ignoredPainCount += metrics.ignoredPainCount;
  }

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

function countDistinctTiers(personas: SttnsPersona[]): number {
  return new Set(personas.map((p) => p.tier_label?.trim()).filter(Boolean)).size;
}

export function computePortfolioMetrics(
  personas: SttnsPersona[],
  options?: {
    healthyMatrixCountActive?: number;
    healthyMatrixCountAll?: number;
  }
): PersonaPortfolioMetrics {
  const activePersonas = personas.filter((p) => p.project_scope !== "reference");

  return {
    personaCount: personas.length,
    activePersonaCount: activePersonas.length,
    tierCountActive: countDistinctTiers(activePersonas),
    tierCountAll: countDistinctTiers(personas),
    healthyMatrixCountActive: options?.healthyMatrixCountActive ?? 0,
    healthyMatrixCountAll: options?.healthyMatrixCountAll ?? 0,
    active: aggregateAlignmentMetrics(activePersonas),
    all: aggregateAlignmentMetrics(personas),
  };
}
