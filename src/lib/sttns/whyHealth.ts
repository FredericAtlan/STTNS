/**
 * Hygiène Matrice Besoins — indicateurs PP orphelin / JTBD fantôme.
 * Pure (pas de React) pour tests d'intégrité Why.
 */

export type WhyHealthJtbdLike = {
  id?: string;
  solved_pain_point_ids?: string[];
};

export type WhyHealthPainPointLike = {
  id: string;
};

/** IDs de Pain Points couverts par au moins un lien solves. */
export function coveredPainPointIdsFromJtbds(
  jtbs: WhyHealthJtbdLike[]
): Set<string> {
  const ids = new Set<string>();
  for (const jtbd of jtbs) {
    for (const id of jtbd.solved_pain_point_ids ?? []) {
      ids.add(id);
    }
  }
  return ids;
}

/** PP sans aucun JTBD qui le résout. */
export function isOrphanPainPoint(
  painPointId: string,
  coveredIds: Set<string>
): boolean {
  return !coveredIds.has(painPointId);
}

/** JTBD sans Pain Point lié (fantôme). */
export function isGhostJtbd(jtbd: WhyHealthJtbdLike): boolean {
  return !(jtbd.solved_pain_point_ids && jtbd.solved_pain_point_ids.length > 0);
}

export function countOrphanPainPoints(
  painPoints: WhyHealthPainPointLike[],
  jtbs: WhyHealthJtbdLike[]
): number {
  const covered = coveredPainPointIdsFromJtbds(jtbs);
  return painPoints.filter((pp) => isOrphanPainPoint(pp.id, covered)).length;
}

export function countGhostJtbds(jtbs: WhyHealthJtbdLike[]): number {
  return jtbs.filter(isGhostJtbd).length;
}
