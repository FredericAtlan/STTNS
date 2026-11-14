import { normalizeGovernanceDecision } from "@/lib/sttns/governance";
import type { SttnsDecision, SttnsInitiative, SttnsReviewStatus } from "@/types/sttns";

export type FeatureStep = "draft" | "review" | "acted" | "kill";

export const FEATURE_STEP_LABELS: Record<FeatureStep, string> = {
  draft: "Brouillon",
  review: "Comité",
  acted: "Approuvé",
  kill: "Rejeté",
};

/** Décision actée par le comité puis confirmée par le CEO si requis. */
export function effectiveFeatureDecision(
  init: Pick<SttnsInitiative, "ceo_final_phase2" | "final_decision">
): SttnsDecision | null {
  const raw = init.ceo_final_phase2 ?? init.final_decision ?? null;
  return normalizeGovernanceDecision(raw);
}

/** @deprecated Plus de phase 2 créateur — conservé pour compatibilité données. */
export function proposedFeatureDecision(
  init: Pick<SttnsInitiative, "decision">
): SttnsDecision | null {
  return normalizeGovernanceDecision(init.decision ?? null);
}

export function isFeatureRejected(
  init: Pick<
    SttnsInitiative,
    "final_decision" | "ceo_final_phase2" | "status" | "workflow_status"
  >
): boolean {
  if (effectiveFeatureDecision(init) === "kill") return true;
  if (init.status === "parking_lot") return true;
  if (init.workflow_status === "killed") return true;
  return false;
}

export function deriveFeatureStep(
  init: Pick<
    SttnsInitiative,
    "review_status" | "final_decision" | "ceo_final_phase2" | "status" | "workflow_status"
  >
): FeatureStep {
  if (isFeatureRejected(init)) return "kill";

  const review = (init.review_status ?? "draft") as SttnsReviewStatus;

  if (review === "validated") return "acted";
  if (
    review === "in_review" ||
    review === "aligned" ||
    review === "needs_ceo_decision" ||
    review === "changes_requested"
  ) {
    return "review";
  }

  return "draft";
}

/** @deprecated Phase 1 retirée du processus. */
export function phase1VerdictShort(_raw: string | null | undefined): string {
  return "—";
}

/** Creator may edit content outside an open committee round. */
export function creatorCanEditInitiative(reviewStatus: SttnsReviewStatus | undefined): boolean {
  const s = reviewStatus ?? "draft";
  return s === "draft" || s === "changes_requested";
}
