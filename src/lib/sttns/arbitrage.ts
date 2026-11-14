import { unassignedInitiatives } from "@/lib/sttns/modules";
import type {
  InitiativeStats,
  Phase1Stats,
  SttnsDecision,
  SttnsInitiative,
  SttnsModule,
  SttnsProject,
  SttnsUserStory,
} from "@/types/sttns";

/** Phase 1 — Filters 0 & 0 bis */
export type SttnsPhase1Verdict = "kill" | "ok_phase2" | "expert_review";

export const PHASE1_VERDICTS: SttnsPhase1Verdict[] = ["kill", "ok_phase2", "expert_review"];

export const PHASE1_VERDICT_LABELS: Record<SttnsPhase1Verdict, string> = {
  kill: "KILL",
  ok_phase2: "Ok for phase 2",
  expert_review: "Expert review",
};

export const PHASE2_DECISIONS: SttnsDecision[] = ["build", "learn", "expert_review", "kill"];

export function parsePhase1Status(raw: string | null | undefined): SttnsPhase1Verdict | "" {
  if (!raw) return "";
  const n = raw.toLowerCase().trim();
  if (n === "kill") return "kill";
  if (n === "ok_phase2" || n === "ok for phase 2" || n === "poursuite") return "ok_phase2";
  if (n === "expert_review" || n === "expert review") return "expert_review";
  return "";
}

export function phase1StatusToDb(verdict: SttnsPhase1Verdict | ""): string | null {
  if (!verdict) return null;
  return verdict;
}

/** Phase 1 retirée — tout dossier complet passe directement au comité. */
export function isPhase2Eligible(_init: Pick<SttnsInitiative, "phase1_status">): boolean {
  return true;
}

export function isInPhase1Arbitrage(_init: Pick<SttnsInitiative, "phase1_status">): boolean {
  return false;
}

export function computePhase1Stats(
  initiatives: Pick<SttnsInitiative, "phase1_status">[]
): Phase1Stats {
  const stats: Phase1Stats = {
    total: initiatives.length,
    kill: 0,
    ok_phase2: 0,
    expert_review: 0,
    pending: 0,
  };
  for (const i of initiatives) {
    const v = parsePhase1Status(i.phase1_status);
    if (v === "kill") stats.kill++;
    else if (v === "ok_phase2") stats.ok_phase2++;
    else if (v === "expert_review") stats.expert_review++;
    else stats.pending++;
  }
  return stats;
}

export function computePhase2Stats(
  initiatives: Pick<SttnsInitiative, "phase1_status" | "decision" | "final_decision">[]
): InitiativeStats {
  const eligible = initiatives.filter(isPhase2Eligible);
  const stats: InitiativeStats = {
    total: eligible.length,
    build: 0,
    learn: 0,
    expert: 0,
    kill: 0,
  };
  for (const i of eligible) {
    const d = i.final_decision ?? i.decision;
    if (d === "build") stats.build++;
    else if (d === "learn") stats.learn++;
    else if (d === "expert_review") stats.expert++;
    else if (d === "kill") stats.kill++;
  }
  return stats;
}

export type AnalyticsSignalTone = "slate" | "emerald" | "amber" | "red" | "violet";

export interface AnalyticsSignal {
  label: string;
  value: string;
  note?: string;
  tone?: AnalyticsSignalTone;
}

function formatPercent(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function isRecent(iso: string | null | undefined, days: number) {
  if (!iso) return false;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return ts >= cutoff;
}

function updatedWithin(initiative: Pick<SttnsInitiative, "created_at" | "updated_at">, days: number) {
  return isRecent(initiative.updated_at ?? initiative.created_at, days);
}

export function countRecentInitiatives(
  initiatives: Pick<SttnsInitiative, "created_at" | "updated_at">[],
  days = 7
): number {
  return initiatives.filter((initiative) => updatedWithin(initiative, days)).length;
}

export function countPendingCeoInitiatives(
  initiatives: Pick<SttnsInitiative, "review_status">[]
): number {
  return initiatives.filter(
    (initiative) =>
      initiative.review_status === "aligned" ||
      initiative.review_status === "needs_ceo_decision"
  ).length;
}

export function countOpenReviewInitiatives(
  initiatives: Pick<SttnsInitiative, "workflow_status">[]
): number {
  return initiatives.filter((initiative) =>
    ["tier1_pending", "tier1_complete", "cto_pending", "ceo_pending"].includes(initiative.workflow_status)
  ).length;
}

export function countUnassignedInitiatives(
  modules: SttnsModule[],
  initiatives: SttnsInitiative[]
): number {
  return unassignedInitiatives(modules, initiatives).length;
}

export function countStoriesWithoutImpactMetric(stories: Pick<SttnsUserStory, "impact_metric_id" | "impacts_north_star">[]) {
  return stories.filter((story) => !story.impacts_north_star && !story.impact_metric_id).length;
}

export function countCoverageModules(modules: SttnsModule[], initiatives: SttnsInitiative[]) {
  if (!modules.length) return { covered: 0, total: 0, unassigned: initiatives.length };
  const covered = modules.filter((mod) =>
    initiatives.some((initiative) =>
      initiative.module_id ? initiative.module_id === mod.id : initiative.module === mod.code
    )
  ).length;
  return {
    covered,
    total: modules.length,
    unassigned: countUnassignedInitiatives(modules, initiatives),
  };
}

export function buildGlobalAnalyticsSignals({
  projectsCount,
  initiatives,
}: {
  projectsCount: number;
  initiatives: SttnsInitiative[];
}): AnalyticsSignal[] {
  const total = initiatives.length;
  const phase1 = computePhase1Stats(initiatives);
  const phase2 = computePhase2Stats(initiatives);
  const pendingCeo = countPendingCeoInitiatives(initiatives);
  const openReview = countOpenReviewInitiatives(initiatives);
  const recent7d = countRecentInitiatives(initiatives, 7);

  return [
    {
      label: "Projets actifs",
      value: String(projectsCount),
      note: `${total} features au total`,
      tone: "emerald",
    },
    {
      label: "En arbitrage",
      value: String(openReview),
      note: `${pendingCeo} en attente CEO`,
      tone: openReview > 0 ? "amber" : "slate",
    },
    {
      label: "KILL rate",
      value: formatPercent(phase1.kill, phase1.total),
      note: `${phase1.kill} feature(s) rejetée(s)`,
      tone: phase1.kill > 0 ? "red" : "emerald",
    },
    {
      label: "Décisions phase 2",
      value: String(phase2.total),
      note: `${phase2.build + phase2.learn + phase2.expert + phase2.kill} arbitrées`,
      tone: "violet",
    },
    {
      label: "Mises à jour 7j",
      value: String(recent7d),
      note: "Derniers mouvements de backlog",
      tone: recent7d > 0 ? "emerald" : "slate",
    },
  ];
}

export function buildProjectAnalyticsSignals({
  initiatives,
  modules,
  stories,
}: {
  initiatives: SttnsInitiative[];
  modules: SttnsModule[];
  stories: Pick<SttnsUserStory, "impact_metric_id" | "impacts_north_star">[];
}): AnalyticsSignal[] {
  const phase1 = computePhase1Stats(initiatives);
  const openReview = countOpenReviewInitiatives(initiatives);
  const pendingCeo = countPendingCeoInitiatives(initiatives);
  const recent7d = countRecentInitiatives(initiatives, 7);
  const coverage = countCoverageModules(modules, initiatives);
  const storiesWithoutImpact = countStoriesWithoutImpactMetric(stories);

  return [
    {
      label: "À faire maintenant",
      value: pendingCeo > 0 ? `${pendingCeo} CEO` : openReview > 0 ? `${openReview} revues` : "Rien de bloquant",
      note:
        pendingCeo > 0
          ? "Trancher les features en attente"
          : openReview > 0
            ? "Finaliser les avis ouverts"
            : "Le pipeline est fluide",
      tone: pendingCeo > 0 ? "amber" : "emerald",
    },
    {
      label: "Couverture modules",
      value: coverage.total ? `${coverage.covered}/${coverage.total}` : "0/0",
      note: coverage.unassigned > 0 ? `${coverage.unassigned} feature(s) sans module` : "Aucune feature orpheline",
      tone: coverage.unassigned > 0 ? "red" : "emerald",
    },
    {
      label: "Stories sans impact",
      value: String(storiesWithoutImpact),
      note: "À relier à un metric ou à la North Star",
      tone: storiesWithoutImpact > 0 ? "amber" : "slate",
    },
    {
      label: "Rythme 7 jours",
      value: String(recent7d),
      note: `${phase1.total} features passées au filtre 0`,
      tone: recent7d > 0 ? "violet" : "slate",
    },
  ];
}
