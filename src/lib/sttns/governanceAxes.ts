import {
  countOpenReviewInitiatives,
  countPendingCeoInitiatives,
  countRecentInitiatives,
} from "@/lib/sttns/arbitrage";
import { effectiveFeatureDecision, isFeatureRejected } from "@/lib/sttns/featureStep";
import type { SttnsEpic, SttnsInitiative, SttnsReviewStatus, SttnsUserStory } from "@/types/sttns";

/** Bucket gouvernance — Control Room, Kanban, matrice legacy (RICE déprécié). */
export type GovernanceBucket =
  | "draft"
  | "in_review"
  | "ceo_pending"
  | "build"
  | "learn"
  | "killed";

/** Colonnes cibles pour un vote comité ou une validation CEO (glisser-déposer). */
export type GovernanceVoteBucket = "build" | "learn" | "killed";

export const GOVERNANCE_BUCKET_LABELS: Record<GovernanceBucket, string> = {
  draft: "Brouillon",
  in_review: "Comité",
  ceo_pending: "Validation CEO",
  build: "BUILD",
  learn: "LEARN",
  killed: "KILL",
};

export const GOVERNANCE_BUCKET_ORDER: GovernanceBucket[] = [
  "draft",
  "in_review",
  "ceo_pending",
  "build",
  "learn",
  "killed",
];

export const GOVERNANCE_STATUS_LABELS = {
  draft: "Brouillon",
  in_review: "En revue (Comité)",
  ceo_pending: "Validation CEO",
  build: "BUILD — Sprint",
  learn: "LEARN — À tester",
  killed: "KILL — Rejeté",
  parking_lot: "Parking lot",
} as const;

type InitiativeGovernanceInput = Pick<
  SttnsInitiative,
  | "review_status"
  | "phase1_status"
  | "final_decision"
  | "decision"
  | "ceo_final_phase2"
  | "status"
  | "workflow_status"
>;

export function deriveGovernanceBucket(init: InitiativeGovernanceInput): GovernanceBucket {
  if (isFeatureRejected(init)) return "killed";

  const review = (init.review_status ?? "draft") as SttnsReviewStatus;
  if (review === "aligned" || review === "needs_ceo_decision") return "ceo_pending";
  if (review === "in_review") return "in_review";
  if (review === "changes_requested") return "draft";

  if (review === "validated") {
    const decision = effectiveFeatureDecision(init);
    if (decision === "learn") return "learn";
    if (decision === "kill") return "killed";
    return "build";
  }

  return "draft";
}

export function governanceBucketLabel(init: InitiativeGovernanceInput): string {
  return GOVERNANCE_BUCKET_LABELS[deriveGovernanceBucket(init)];
}

export function computeGovernanceStats(initiatives: SttnsInitiative[]) {
  const counts: Record<GovernanceBucket, number> = {
    draft: 0,
    in_review: 0,
    ceo_pending: 0,
    build: 0,
    learn: 0,
    killed: 0,
  };

  for (const initiative of initiatives) {
    counts[deriveGovernanceBucket(initiative)]++;
  }

  const total = initiatives.length;
  const killRate = total ? Math.round((counts.killed / total) * 100) : 0;
  const pendingCeo = countPendingCeoInitiatives(initiatives);
  const openReview = countOpenReviewInitiatives(initiatives);
  const recent7d = countRecentInitiatives(initiatives, 7);

  return {
    total,
    ...counts,
    /** @deprecated Préférer counts.build */
    approved: counts.build,
    killRate,
    pendingCeo,
    openReview,
    recent7d,
  };
}

export function computeExecutionStats(
  initiatives: SttnsInitiative[],
  stories: Pick<SttnsUserStory, "status">[],
  epics: Pick<SttnsEpic, "status">[]
) {
  const executionFeatures = initiatives.filter((i) => isExecutionGovernanceFeature(i));
  const buildFeatures = executionFeatures.filter((i) => deriveGovernanceBucket(i) === "build");
  const learnFeatures = executionFeatures.filter((i) => deriveGovernanceBucket(i) === "learn");

  return {
    epicsInProgress: epics.filter((e) => e.status === "in_progress").length,
    epicsDone: epics.filter((e) => e.status === "done").length,
    storiesInSprint: stories.filter((s) => s.status === "in_sprint").length,
    storiesDelivered: stories.filter((s) => s.status === "delivered").length,
    featuresPending: executionFeatures.filter((i) => (i.execution_status ?? "pending") === "pending").length,
    featuresInDev: executionFeatures.filter((i) => i.execution_status === "in_development").length,
    featuresInTest: executionFeatures.filter((i) => i.execution_status === "in_test").length,
    featuresDeployed: executionFeatures.filter((i) => i.execution_status === "deployed").length,
    featuresBuildPending: buildFeatures.filter((i) => (i.execution_status ?? "pending") === "pending").length,
    featuresLearnPending: learnFeatures.filter((i) => (i.execution_status ?? "pending") === "pending").length,
  };
}

export function formatEpicStoryProgress(stories: Pick<SttnsUserStory, "status">[]): string {
  const total = stories.length;
  if (total === 0) return "Aucune story";

  const inSprint = stories.filter((s) => s.status === "in_sprint").length;
  const delivered = stories.filter((s) => s.status === "delivered").length;
  const parts = [`${total} story${total > 1 ? "s" : ""}`];
  if (inSprint > 0) parts.push(`${inSprint} en sprint`);
  if (delivered > 0) parts.push(`${delivered} livrée${delivered > 1 ? "s" : ""}`);
  return parts.join(" · ");
}

export function computeModuleExecutionStats(initiatives: SttnsInitiative[]) {
  const executionFeatures = initiatives.filter((i) => isExecutionGovernanceFeature(i));
  return {
    governance: computeGovernanceStats(initiatives),
    inDev: executionFeatures.filter((i) => i.execution_status === "in_development").length,
    deployed: executionFeatures.filter((i) => i.execution_status === "deployed").length,
  };
}

/** Feature éligible au suivi d'exécution sprint (BUILD acté uniquement). */
export function isBuildGovernanceFeature(init: InitiativeGovernanceInput): boolean {
  return deriveGovernanceBucket(init) === "build";
}

/** Tab Exécution visible : BUILD (delivery) ou LEARN (validation terrain). */
export function isExecutionGovernanceFeature(init: InitiativeGovernanceInput): boolean {
  const bucket = deriveGovernanceBucket(init);
  return bucket === "build" || bucket === "learn";
}

export function executionGovernanceMode(
  init: InitiativeGovernanceInput
): "build" | "learn" | null {
  const bucket = deriveGovernanceBucket(init);
  if (bucket === "build") return "build";
  if (bucket === "learn") return "learn";
  return null;
}
