import type { SupabaseClient } from "@supabase/supabase-js";
import type { SttnsExecutionHistoryEventKind, SttnsPlacementReasonType } from "@/types/sttns";

export async function insertExecutionHistoryEntry(
  supabase: SupabaseClient,
  params: {
    initiativeId: string;
    changedBy: string;
    oldSortOrder: number;
    newSortOrder: number;
    reasonType: SttnsPlacementReasonType;
    comment: string;
    eventKind?: SttnsExecutionHistoryEventKind;
    reviewedBy?: string | null;
    ceoComment?: string | null;
    proposalId?: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from("sttns_initiative_execution_history").insert({
    initiative_id: params.initiativeId,
    changed_by: params.changedBy,
    old_sort_order: params.oldSortOrder,
    new_sort_order: params.newSortOrder,
    reason_type: params.reasonType,
    comment: params.comment,
    event_kind: params.eventKind ?? "applied",
    reviewed_by: params.reviewedBy ?? null,
    ceo_comment: params.ceoComment ?? null,
    proposal_id: params.proposalId ?? null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function resolveExecutionHistoryActor(
  supabase: SupabaseClient,
  initiativeId: string,
  explicitUserId?: string | null
): Promise<string | null> {
  if (explicitUserId) return explicitUserId;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) return user.id;

  const { data: initiative } = await supabase
    .from("sttns_initiatives")
    .select("ceo_final_by, created_by")
    .eq("id", initiativeId)
    .maybeSingle();

  return initiative?.ceo_final_by ?? initiative?.created_by ?? null;
}
