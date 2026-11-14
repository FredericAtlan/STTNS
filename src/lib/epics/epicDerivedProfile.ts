import type { ImpactCategoryKey, ImpactMatrixSegment } from "@/lib/userStories/userStoryHealth";
import type { EpicStoryPickRow } from "@/components/epics/EpicOrphanStoriesPicker";

export type EpicDerivedPersona = {
  id: string;
  code: string | null;
  name: string;
  tierCode: string | null;
};

export type EpicDerivedProfile = {
  isGhost: boolean;
  storyCount: number;
  personas: EpicDerivedPersona[];
  tierCodes: string[];
  jtbdLabels: string[];
  touchesNorthStar: boolean;
  impactMatrix: ImpactMatrixSegment[];
  dominantImpact: ImpactMatrixSegment | null;
};

const IMPACT_SEGMENT_ORDER: Exclude<ImpactCategoryKey, "unassigned">[] = [
  "efficiency",
  "north_star",
  "breadth",
  "depth",
  "frequency",
];

function buildImpactMatrixFromStories(
  stories: EpicStoryPickRow[]
): { impactMatrix: ImpactMatrixSegment[]; dominantImpact: ImpactMatrixSegment | null } {
  const counts = new Map<Exclude<ImpactCategoryKey, "unassigned">, number>();

  for (const story of stories) {
    if (!story.impactCategory || story.impactCategory === "unassigned") continue;
    counts.set(story.impactCategory, (counts.get(story.impactCategory) ?? 0) + 1);
  }

  const assignedTotal = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);
  if (assignedTotal === 0) {
    return { impactMatrix: [], dominantImpact: null };
  }

  const impactMatrix = IMPACT_SEGMENT_ORDER.map((key) => {
    const count = counts.get(key) ?? 0;
    const label =
      key === "north_star"
        ? "North Star"
        : key === "breadth"
          ? "Largeur"
          : key === "depth"
            ? "Profondeur"
            : key === "frequency"
              ? "Fréquence"
              : "Efficience";
    return {
      key,
      label,
      count,
      pct: Math.round((count / assignedTotal) * 100),
    };
  }).filter((segment) => segment.count > 0);

  const dominantImpact =
    impactMatrix.reduce((best, segment) => (segment.count > best.count ? segment : best)) ?? null;

  return { impactMatrix, dominantImpact };
}

/** Profil Epic dérivé des user stories sélectionnées (héritage bottom-up). */
export function computeEpicDerivedProfile(
  allRows: EpicStoryPickRow[],
  selectedIds: string[]
): EpicDerivedProfile {
  const selected = allRows.filter((row) => selectedIds.includes(row.id));
  const personaMap = new Map<string, EpicDerivedPersona>();

  for (const row of selected) {
    if (!row.personaId) continue;
    if (!personaMap.has(row.personaId)) {
      personaMap.set(row.personaId, {
        id: row.personaId,
        code: row.personaCode,
        name: row.personaName ?? "Persona",
        tierCode: row.tierCode,
      });
    }
  }

  const tierCodes = Array.from(
    new Set(selected.map((r) => r.tierCode).filter(Boolean) as string[])
  ).sort();
  const jtbdLabels = Array.from(
    new Set(selected.map((r) => r.jtbdLabel).filter(Boolean) as string[])
  );
  const touchesNorthStar = selected.some((r) => r.impactCategory === "north_star");
  const { impactMatrix, dominantImpact } = buildImpactMatrixFromStories(selected);

  return {
    isGhost: selected.length === 0,
    storyCount: selected.length,
    personas: Array.from(personaMap.values()).sort((a, b) =>
      (a.code ?? a.name).localeCompare(b.code ?? b.name)
    ),
    tierCodes,
    jtbdLabels,
    touchesNorthStar,
    impactMatrix,
    dominantImpact,
  };
}

export function dominantImpactRoot(
  profile: EpicDerivedProfile
): Exclude<ImpactCategoryKey, "unassigned"> | null {
  const key = profile.dominantImpact?.key;
  return key ? key : null;
}

export function cachePrimaryPersonaId(profile: EpicDerivedProfile): string | null {
  return profile.personas[0]?.id ?? null;
}
