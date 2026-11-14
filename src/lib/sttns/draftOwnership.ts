import type { SttnsEpicStatus, SttnsReviewStatus, SttnsUserStoryStatus } from "@/types/sttns";

export const DRAFT_READONLY_MESSAGE =
  "Vous ne pouvez que consulter ce brouillon. Seul son auteur peut le modifier ou le soumettre.";

export type DraftEntityType = "persona" | "user_story" | "epic" | "initiative";

export function isPersonaDraft(reviewStatus?: SttnsReviewStatus | null): boolean {
  return (reviewStatus ?? "draft") === "draft";
}

export function isUserStoryDraft(
  status?: SttnsUserStoryStatus | null,
  reviewStatus?: SttnsReviewStatus | null
): boolean {
  return (status ?? "proposed") === "proposed" && (reviewStatus ?? "draft") === "draft";
}

export function isEpicDraft(
  status?: SttnsEpicStatus | null,
  reviewStatus?: SttnsReviewStatus | null
): boolean {
  if (reviewStatus) {
    return reviewStatus === "draft" || reviewStatus === "changes_requested";
  }
  return (status ?? "draft") === "draft";
}

export function isInitiativeDraft(reviewStatus?: SttnsReviewStatus | null): boolean {
  const s = reviewStatus ?? "draft";
  return s === "draft" || s === "changes_requested";
}

export function isEntityInDraftOwnership(
  entityType: DraftEntityType,
  fields: {
    reviewStatus?: SttnsReviewStatus | null;
    status?: string | null;
  }
): boolean {
  switch (entityType) {
    case "persona":
      return isPersonaDraft(fields.reviewStatus);
    case "user_story":
      return isUserStoryDraft(
        fields.status as SttnsUserStoryStatus | null,
        fields.reviewStatus
      );
    case "epic":
      return isEpicDraft(
        fields.status as SttnsEpicStatus | null,
        fields.reviewStatus
      );
    case "initiative":
      return isInitiativeDraft(fields.reviewStatus);
    default:
      return false;
  }
}

/** UI : brouillon initial + utilisateur ≠ auteur (admin plateforme exempté). */
export function isDraftReadOnlyView(params: {
  entityType: DraftEntityType;
  createdBy: string | null | undefined;
  currentUserId: string;
  isPlatformAdmin: boolean;
  reviewStatus?: SttnsReviewStatus | null;
  status?: string | null;
}): boolean {
  if (params.isPlatformAdmin) return false;
  if (!isEntityInDraftOwnership(params.entityType, { reviewStatus: params.reviewStatus, status: params.status })) {
    return false;
  }
  if (!params.createdBy) return false;
  return params.createdBy !== params.currentUserId;
}

export function canEditDraftEntity(params: {
  entityType: DraftEntityType;
  createdBy: string | null | undefined;
  userId: string;
  isPlatformAdmin: boolean;
  reviewStatus?: SttnsReviewStatus | null;
  status?: string | null;
}): boolean {
  return !isDraftReadOnlyView({
    entityType: params.entityType,
    createdBy: params.createdBy,
    currentUserId: params.userId,
    isPlatformAdmin: params.isPlatformAdmin,
    reviewStatus: params.reviewStatus,
    status: params.status,
  });
}

export function authorDisplayName(profile: {
  full_name?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!profile) return "un membre de l'équipe";
  return profile.full_name?.trim() || profile.email?.split("@")[0] || "Auteur";
}
