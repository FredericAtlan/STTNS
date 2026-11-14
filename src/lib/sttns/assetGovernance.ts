import type { SttnsAssetType, SttnsReviewStatus } from "@/types/sttns";

export const COMMITTEE_GOVERNED_ASSETS: SttnsAssetType[] = [
  "persona",
  "user_story",
  "epic",
  "initiative",
];

export function usesCommitteeGovernance(assetType: SttnsAssetType): boolean {
  return COMMITTEE_GOVERNED_ASSETS.includes(assetType);
}

export function governanceAssetTable(assetType: SttnsAssetType): string {
  switch (assetType) {
    case "persona":
      return "sttns_personas";
    case "user_story":
      return "sttns_user_stories";
    case "epic":
      return "sttns_epics";
    case "initiative":
      return "sttns_initiatives";
  }
}

export function committeeOpinionTaskType(assetType: SttnsAssetType): "feature_opinion" {
  return "feature_opinion";
}

export function isAssetOpenForCommitteeVote(
  reviewStatus: SttnsReviewStatus | null | undefined
): boolean {
  return (reviewStatus ?? "draft") === "in_review";
}

export function isAssetOpenForCeoFinalize(
  reviewStatus: SttnsReviewStatus | null | undefined
): boolean {
  const status = reviewStatus ?? "draft";
  return status === "aligned" || status === "needs_ceo_decision";
}

export function isAssetReopenable(input: {
  review_status?: SttnsReviewStatus | null;
  final_decision?: string | null;
  status?: string | null;
}): boolean {
  const review = (input.review_status ?? "draft") as SttnsReviewStatus;
  if (review === "validated") return true;
  if (input.final_decision === "kill") return true;
  if (input.status === "parking_lot") return true;
  return false;
}

export const ASSET_GOVERNANCE_REOPEN_RESET = {
  review_status: "draft" as const,
  final_decision: null,
  ceo_final_phase2: null,
  ceo_final_comment: null,
  ceo_final_by: null,
  ceo_final_at: null,
};
