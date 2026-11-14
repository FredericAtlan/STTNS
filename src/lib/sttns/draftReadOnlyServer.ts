import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/sttns/auth";
import {
  authorDisplayName,
  isDraftReadOnlyView,
  type DraftEntityType,
} from "@/lib/sttns/draftOwnership";
import type { SttnsReviewStatus } from "@/types/sttns";

export async function resolveDraftReadOnly(params: {
  entityType: DraftEntityType;
  projectId: string;
  createdBy: string | null | undefined;
  currentUserId: string;
  reviewStatus?: string | null;
  status?: string | null;
}) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("sttns_profiles")
    .select("platform_role")
    .eq("id", params.currentUserId)
    .single();

  const isPlatformAdminUser = isPlatformAdmin(
    profile as { platform_role: "admin" | "user" } | null
  );

  const readOnly = isDraftReadOnlyView({
    entityType: params.entityType,
    createdBy: params.createdBy,
    currentUserId: params.currentUserId,
    isPlatformAdmin: isPlatformAdminUser,
    reviewStatus: params.reviewStatus as SttnsReviewStatus | null,
    status: params.status,
  });

  let authorName = "un membre de l'équipe";
  if (params.createdBy) {
    const { data: authorProfile } = await supabase
      .from("sttns_profiles")
      .select("full_name, email")
      .eq("id", params.createdBy)
      .single();
    authorName = authorDisplayName(authorProfile);
  }

  return { readOnly, authorName, isPlatformAdmin: isPlatformAdminUser };
}
