import { jobsForPersona } from "@/lib/sttns/personas";
import type { SttnsPersona, SttnsPersonaJob, SttnsProjectMetric, SttnsUserStory } from "@/types/sttns";

/**
 * DoR `sttns_user_stories` — persona/JTBD = UUID Spine `work_items` (A1).
 * Écrans epics / value chain. Backlog `/user-stories` → `storiesSpine` (DoR binaire).
 */
export type ImpactCategoryKey =
  | "north_star"
  | "breadth"
  | "depth"
  | "frequency"
  | "efficiency"
  | "unassigned";

export type ImpactMatrixSegment = {
  key: Exclude<ImpactCategoryKey, "unassigned">;
  label: string;
  count: number;
  pct: number;
};

export type DominantImpactSummary = {
  key: Exclude<ImpactCategoryKey, "unassigned">;
  label: string;
  keyword: string;
  pct: number;
};

export type UserStoryHealthLevel = "healthy" | "warning" | "critical";

export type UserStoryHealth = {
  level: UserStoryHealthLevel;
  label: string;
  tip: string;
  hasEpic: boolean;
  hasJtbd: boolean;
  hasSprintFormat: boolean;
  dorComplete: boolean;
};

export type UserStoryDoRInput = {
  epic_id?: string | null;
  initiative_id?: string | null;
  target_persona_job_id?: string | null;
  primary_persona_id?: string | null;
  sprint_want?: string | null;
  sprint_so_that?: string | null;
  impact_metric_id?: string | null;
  impacts_north_star?: boolean;
  persona_ids?: string[];
};

export type UserStoryDoRState = {
  primaryPersonaReady: boolean;
  jtbdLinked: boolean;
  sprintWantReady: boolean;
  sprintSoThatReady: boolean;
  epicLinked: boolean;
  featureLinked: boolean;
  impactMetricReady: boolean;
  readyToPublish: boolean;
  gaps: string[];
};

function hasImpactMetric(input: Pick<UserStoryDoRInput, "impacts_north_star" | "impact_metric_id">): boolean {
  return !!input.impacts_north_star || !!input.impact_metric_id?.trim();
}

export function computeUserStoryDoR(input: UserStoryDoRInput): UserStoryDoRState {
  const primaryPersonaReady = !!input.primary_persona_id?.trim();
  const jtbdLinked = !!input.target_persona_job_id?.trim();
  const sprintWantReady = !!input.sprint_want?.trim();
  const sprintSoThatReady = !!input.sprint_so_that?.trim();
  const epicLinked = !!input.epic_id?.trim();
  const featureLinked = !!input.initiative_id?.trim();
  const impactMetricReady = hasImpactMetric(input);

  const gaps: string[] = [];
  if (!primaryPersonaReady) gaps.push("Persona principal (En tant que…)");
  if (!jtbdLinked) gaps.push("JTBD associé");
  if (!sprintWantReady) gaps.push("Je veux");
  if (!sprintSoThatReady) gaps.push("Afin de");
  if (!epicLinked) gaps.push("Lien epic");
  if (!featureLinked) gaps.push("Lien feature");
  if (!impactMetricReady) gaps.push("Indicateur d'impact");

  const readyToPublish = gaps.length === 0;

  return {
    primaryPersonaReady,
    jtbdLinked,
    sprintWantReady,
    sprintSoThatReady,
    epicLinked,
    featureLinked,
    impactMetricReady,
    readyToPublish,
    gaps,
  };
}

export function computeUserStoryHealth(
  story: Pick<
    SttnsUserStory,
    | "epic_id"
    | "target_persona_job_id"
    | "primary_persona_id"
    | "sprint_want"
    | "sprint_so_that"
    | "initiative_id"
    | "impact_metric_id"
    | "impacts_north_star"
  >
): UserStoryHealth {
  const dor = computeUserStoryDoR(story);
  const hasEpic = dor.epicLinked;
  const hasJtbd = dor.jtbdLinked;
  const hasSprintFormat = dor.sprintWantReady && dor.sprintSoThatReady && dor.primaryPersonaReady;

  if (dor.readyToPublish) {
    return {
      level: "healthy",
      label: "Healthy",
      tip: "Story alignée : DoR complète (persona, JTBD, sprint, epic, feature, impact).",
      hasEpic,
      hasJtbd,
      hasSprintFormat,
      dorComplete: true,
    };
  }

  const tip = !hasJtbd
    ? "Warning STTNS : Cette story avance sans boussole. Elle n'est liée à aucun objectif de progrès (JTBD) du persona principal."
    : !hasSprintFormat
      ? "Warning STTNS : Complétez le format sprint (En tant que…, Je veux, Afin de)."
      : !hasEpic
        ? "Warning STTNS : Rattachez la story à une epic."
        : !dor.featureLinked
          ? "Warning STTNS : Liez une feature à cette story."
          : !dor.impactMetricReady
            ? "Warning STTNS : Sélectionnez un indicateur d'impact."
            : "Warning STTNS : Definition of Ready incomplète.";

  return {
    level: "warning",
    label: "Warning",
    tip,
    hasEpic,
    hasJtbd,
    hasSprintFormat,
    dorComplete: false,
  };
}

export function resolveStoryTargetJob(
  story: Pick<SttnsUserStory, "target_persona_job_id">,
  personas: SttnsPersona[]
): SttnsPersonaJob | null {
  if (!story.target_persona_job_id) return null;
  for (const persona of personas) {
    const job = jobsForPersona(persona).find((j) => j.id === story.target_persona_job_id);
    if (job) return job;
  }
  return null;
}

export type UserStoryPortfolioMetrics = {
  storyCount: number;
  dorCompliancePct: number;
  dorCompliantCount: number;
  incompleteCount: number;
  valueDensityRatio: number | null;
  coveredJtbdCount: number;
  orphanCount: number;
  orphanNoEpic: number;
  orphanNoJtbd: number;
  impactMatrix: ImpactMatrixSegment[];
  dominantImpact: DominantImpactSummary | null;
};

const IMPACT_CATEGORY_LABELS: Record<Exclude<ImpactCategoryKey, "unassigned">, string> = {
  north_star: "North Star",
  breadth: "Largeur",
  depth: "Profondeur",
  frequency: "Fréquence",
  efficiency: "Efficience",
};

const IMPACT_CATEGORY_KEYWORDS: Record<Exclude<ImpactCategoryKey, "unassigned">, string> = {
  north_star: "NORTH STAR PRIORITAIRE",
  breadth: "LARGEUR PRIORITAIRE",
  depth: "PROFONDEUR PRIORITAIRE",
  frequency: "FRÉQUENCE PRIORITAIRE",
  efficiency: "EFFICIENCE PRIORITAIRE",
};

const IMPACT_SEGMENT_ORDER: Exclude<ImpactCategoryKey, "unassigned">[] = [
  "efficiency",
  "north_star",
  "breadth",
  "depth",
  "frequency",
];

type MetricLite = Pick<SttnsProjectMetric, "id" | "parent_id" | "legacy_key" | "name">;

function metricsById(flat: MetricLite[]): Record<string, MetricLite> {
  return Object.fromEntries(flat.map((m) => [m.id, m]));
}

export function resolveStoryImpactCategory(
  story: Pick<SttnsUserStory, "impacts_north_star" | "impact_metric_id">,
  byId: Record<string, MetricLite>
): ImpactCategoryKey {
  if (story.impacts_north_star) return "north_star";
  if (!story.impact_metric_id?.trim()) return "unassigned";

  let cur: MetricLite | undefined = byId[story.impact_metric_id];
  while (cur?.parent_id && byId[cur.parent_id]) {
    cur = byId[cur.parent_id];
  }

  const legacy = cur?.legacy_key;
  if (
    legacy === "breadth" ||
    legacy === "depth" ||
    legacy === "frequency" ||
    legacy === "efficiency"
  ) {
    return legacy;
  }

  return "unassigned";
}

function buildImpactMatrix(
  stories: Pick<SttnsUserStory, "impacts_north_star" | "impact_metric_id">[],
  metricsFlat: MetricLite[]
): { impactMatrix: ImpactMatrixSegment[]; dominantImpact: DominantImpactSummary | null } {
  const byId = metricsById(metricsFlat);
  const counts = new Map<Exclude<ImpactCategoryKey, "unassigned">, number>();

  for (const story of stories) {
    const category = resolveStoryImpactCategory(story, byId);
    if (category === "unassigned") continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const assignedTotal = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);
  if (assignedTotal === 0) {
    return { impactMatrix: [], dominantImpact: null };
  }

  const impactMatrix = IMPACT_SEGMENT_ORDER.map((key) => {
    const count = counts.get(key) ?? 0;
    return {
      key,
      label: IMPACT_CATEGORY_LABELS[key],
      count,
      pct: Math.round((count / assignedTotal) * 100),
    };
  }).filter((segment) => segment.count > 0);

  const top = impactMatrix.reduce((best, segment) =>
    segment.count > best.count ? segment : best
  );

  return {
    impactMatrix,
    dominantImpact: {
      key: top.key,
      label: top.label,
      keyword: IMPACT_CATEGORY_KEYWORDS[top.key],
      pct: top.pct,
    },
  };
}

export function computeUserStoryPortfolioMetrics(
  stories: Pick<
    SttnsUserStory,
    | "epic_id"
    | "target_persona_job_id"
    | "primary_persona_id"
    | "sprint_want"
    | "sprint_so_that"
    | "initiative_id"
    | "impact_metric_id"
    | "impacts_north_star"
  >[],
  metricsFlat: MetricLite[] = []
): UserStoryPortfolioMetrics {
  const storyCount = stories.length;
  let dorCompliantCount = 0;
  let orphanNoEpic = 0;
  let orphanNoJtbd = 0;
  let orphanCount = 0;
  const jtbdIds = new Set<string>();

  for (const story of stories) {
    const dor = computeUserStoryDoR(story);
    if (dor.readyToPublish) dorCompliantCount += 1;
    if (!dor.epicLinked) orphanNoEpic += 1;
    if (!dor.jtbdLinked) orphanNoJtbd += 1;
    if (!dor.epicLinked || !dor.jtbdLinked) orphanCount += 1;
    if (story.target_persona_job_id) jtbdIds.add(story.target_persona_job_id);
  }

  const incompleteCount = storyCount - dorCompliantCount;
  const dorCompliancePct =
    storyCount === 0 ? 0 : Math.round((dorCompliantCount / storyCount) * 100);
  const valueDensityRatio =
    jtbdIds.size === 0 ? null : Math.round((storyCount / jtbdIds.size) * 10) / 10;

  const { impactMatrix, dominantImpact } = buildImpactMatrix(stories, metricsFlat);

  return {
    storyCount,
    dorCompliancePct,
    dorCompliantCount,
    incompleteCount,
    valueDensityRatio,
    coveredJtbdCount: jtbdIds.size,
    orphanCount,
    orphanNoEpic,
    orphanNoJtbd,
    impactMatrix,
    dominantImpact,
  };
}
