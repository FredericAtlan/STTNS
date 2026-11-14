import type { SupabaseClient } from "@supabase/supabase-js";
import type { SttnsAssetType, SttnsReviewStatus } from "@/types/sttns";
import {
  ASSET_GOVERNANCE_REOPEN_RESET,
  governanceAssetTable,
  isAssetReopenable,
} from "@/lib/sttns/assetGovernance";
import { cancelOpenTasksForAsset } from "@/lib/sttns/tasks";

export { isAssetReopenable, ASSET_GOVERNANCE_REOPEN_RESET };

export async function reopenAssetForRevision(
  supabase: SupabaseClient,
  input: {
    projectId: string;
    assetType: SttnsAssetType;
    assetId: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const table = governanceAssetTable(input.assetType);
  const selectFields =
    input.assetType === "initiative"
      ? "review_status, status, final_decision, ceo_final_phase2"
      : "review_status, final_decision, ceo_final_phase2";

  const { data: existing } = await supabase
    .from(table)
    .select(selectFields)
    .eq("id", input.assetId)
    .eq("project_id", input.projectId)
    .single();

  if (!existing) {
    return { ok: false, error: "Élément introuvable." };
  }

  if (
    !isAssetReopenable(
      existing as {
        review_status?: SttnsReviewStatus;
        final_decision?: string | null;
        status?: string | null;
      }
    )
  ) {
    return {
      ok: false,
      error: "Seuls les éléments validés ou rejetés (KILL) peuvent être rouverts en brouillon.",
    };
  }

  const patch: Record<string, unknown> = { ...ASSET_GOVERNANCE_REOPEN_RESET };

  if (input.assetType === "initiative") {
    Object.assign(patch, {
      status: "draft",
      workflow_status: "draft",
      execution_status: "pending",
    });
  }

  const { error } = await supabase
    .from(table)
    .update(patch)
    .eq("id", input.assetId)
    .eq("project_id", input.projectId);

  if (error) return { ok: false, error: error.message };

  await supabase
    .from("sttns_peer_reviews")
    .delete()
    .eq("project_id", input.projectId)
    .eq("asset_type", input.assetType)
    .eq("asset_id", input.assetId);

  await cancelOpenTasksForAsset(input.projectId, input.assetType, input.assetId);

  return { ok: true };
}
