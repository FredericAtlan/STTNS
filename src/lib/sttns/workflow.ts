import type {
  InitiativeStats,
  Phase1Stats,
  SttnsDecision,
  SttnsInitiative,
  SttnsInitiativeReview,
  SttnsProjectMember,
  SttnsProjectRole,
  SttnsValidationStep,
  SttnsWorkflowStatus,
} from "@/types/sttns";
import { computePhase2Stats } from "@/lib/sttns/arbitrage";

export const ROLE_LABELS: Record<SttnsProjectRole, string> = {
  ceo: "CEO",
  pm: "PM",
  cto: "CTO",
  expert: "Expert",
  dev: "Dev",
};

export const WORKFLOW_LABELS: Record<SttnsWorkflowStatus, string> = {
  draft: "Brouillon",
  tier1_pending: "En attente expert",
  tier1_complete: "Niveau 1 validé",
  cto_pending: "En revue CTO",
  ceo_pending: "Décision CEO",
  approved: "BUILD approuvé",
  parking_lot: "Parking lot",
  killed: "KILL",
};

export const STEP_LABELS: Record<SttnsValidationStep, string> = {
  tier1: "Niveau 1 — Expert",
  cto: "Niveau 2 — CTO",
  ceo: "Niveau 3 — CEO (décision finale)",
};

export function isProjectCeoMember(members: SttnsProjectMember[], userId: string): boolean {
  return members.some((m) => m.user_id === userId && m.role === "ceo");
}

/** @deprecated Use computePhase2Stats from arbitrage.ts */
export function computeInitiativeStats(
  initiatives: Pick<SttnsInitiative, "phase1_status" | "decision" | "final_decision">[]
): InitiativeStats {
  return computePhase2Stats(initiatives);
}

export function canSubmitReview(
  members: SttnsProjectMember[],
  userId: string,
  workflowStatus: SttnsWorkflowStatus,
  existingReviews: SttnsInitiativeReview[]
): { allowed: boolean; step: SttnsValidationStep | null; role: SttnsProjectRole | null } {
  const roles = members.filter((m) => m.user_id === userId).map((m) => m.role);
  if (!roles.length) return { allowed: false, step: null, role: null };

  const hasTier1 = existingReviews.some((r) => r.validation_step === "tier1");
  const hasCto = existingReviews.some((r) => r.validation_step === "cto");
  const hasCeo = existingReviews.some((r) => r.validation_step === "ceo");
  const userTier1 = existingReviews.find(
    (r) => r.validation_step === "tier1" && r.reviewer_id === userId
  );

  if (
    !hasTier1 &&
    (workflowStatus === "draft" || workflowStatus === "tier1_pending") &&
    roles.includes("expert") &&
    !userTier1
  ) {
    return { allowed: true, step: "tier1", role: "expert" };
  }

  if (
    hasTier1 &&
    !hasCto &&
    workflowStatus === "cto_pending" &&
    roles.includes("cto")
  ) {
    return { allowed: true, step: "cto", role: "cto" };
  }

  if (
    hasCto &&
    !hasCeo &&
    workflowStatus === "ceo_pending" &&
    roles.includes("ceo")
  ) {
    return { allowed: true, step: "ceo", role: "ceo" };
  }

  return { allowed: false, step: null, role: null };
}

export function submitForReview(workflowStatus: SttnsWorkflowStatus): boolean {
  return workflowStatus === "draft";
}
