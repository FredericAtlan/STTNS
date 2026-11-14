import { normalizeGovernanceDecision } from "@/lib/sttns/governance";
import { DECISION_LABELS } from "@/lib/sttns/constants";
import type { SttnsDecision, SttnsInitiative } from "@/types/sttns";

export type FeatureStatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "ceo";

export interface FeatureStatusView {
  label: string;
  tone: FeatureStatusTone;
  reviewProgress?: { responded: number; total: number };
  showReviewLink: boolean;
}

type InitiativeStatusInput = Pick<
  SttnsInitiative,
  "review_status" | "final_decision" | "ceo_final_phase2" | "status" | "workflow_status"
>;

const DECISION_SHORT: Record<SttnsDecision, string> = {
  build: "BUILD",
  learn: "LEARN",
  expert_review: "LEARN",
  kill: "KILL",
};

const TONE_BY_DECISION: Record<SttnsDecision, FeatureStatusTone> = {
  build: "success",
  learn: "warning",
  expert_review: "warning",
  kill: "danger",
};

function actedDecision(init: InitiativeStatusInput): SttnsDecision | null {
  return normalizeGovernanceDecision(init.ceo_final_phase2 ?? init.final_decision ?? null);
}

function decisionStatus(decision: SttnsDecision, prefix: string): FeatureStatusView {
  const normalized = normalizeGovernanceDecision(decision) ?? decision;
  return {
    label: `${prefix} · ${DECISION_SHORT[normalized]}`,
    tone: TONE_BY_DECISION[normalized],
    showReviewLink: false,
  };
}

export function deriveFeatureStatus(
  init: InitiativeStatusInput,
  options: {
    memberCount: number;
    reviewResponseCount: number;
  }
): FeatureStatusView {
  const { memberCount, reviewResponseCount } = options;
  const reviewStatus = init.review_status ?? "draft";

  if (reviewStatus === "needs_ceo_decision") {
    return { label: "Validation CEO", tone: "ceo", showReviewLink: true };
  }

  if (reviewStatus === "changes_requested") {
    return { label: "Modifications demandées", tone: "warning", showReviewLink: true };
  }

  if (reviewStatus === "in_review") {
    const total = Math.max(memberCount, 1);
    return {
      label: `Comité (${reviewResponseCount}/${total})`,
      tone: "info",
      reviewProgress: { responded: reviewResponseCount, total },
      showReviewLink: true,
    };
  }

  if (reviewStatus === "aligned") {
    const decision = actedDecision(init);
    if (decision) return decisionStatus(decision, "Validation CEO");
    return { label: "Validation CEO", tone: "ceo", showReviewLink: true };
  }

  if (reviewStatus === "validated") {
    const decision = actedDecision(init);
    if (decision) return decisionStatus(decision, "Validé");
    return { label: "Validé", tone: "success", showReviewLink: false };
  }

  if (init.status === "parking_lot" || init.workflow_status === "killed") {
    return { label: "KILL", tone: "danger", showReviewLink: false };
  }

  return { label: "Brouillon", tone: "neutral", showReviewLink: false };
}

export const FEATURE_STATUS_LEGEND = [
  "Brouillon → pas encore soumis au comité",
  "Comité (X/Y) → chaque membre vote BUILD / LEARN / KILL",
  "Validation CEO → confirmation finale si le mode gouvernance l'exige",
  "Validé · BUILD/LEARN/KILL → décision actée",
] as const;

export function decisionLabelLong(decision: SttnsDecision): string {
  const normalized = normalizeGovernanceDecision(decision) ?? decision;
  return DECISION_LABELS[normalized];
}
