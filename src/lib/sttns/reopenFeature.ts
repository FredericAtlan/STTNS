import type { SttnsInitiative, SttnsReviewStatus } from "@/types/sttns";

/** Feature actée (CEO validé ou KILL) — peut revenir en brouillon pour un nouveau cycle. */
export function isFeatureReopenable(
  init: Pick<SttnsInitiative, "review_status" | "status">
): boolean {
  const review = (init.review_status ?? "draft") as SttnsReviewStatus;
  if (review === "validated") return true;
  if (init.status === "parking_lot") return true;
  return false;
}

export const FEATURE_REOPEN_RESET = {
  review_status: "draft" as const,
  status: "draft" as const,
  workflow_status: "draft" as const,
  final_decision: null,
  ceo_final_phase1: null,
  ceo_final_phase2: null,
  ceo_final_comment: null,
  ceo_final_by: null,
  ceo_final_at: null,
  execution_status: "pending" as const,
};
