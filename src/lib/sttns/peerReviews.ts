import { createClient } from "@/lib/supabase/server";
import type { SttnsAssetType, SttnsPeerReview, SttnsProfile } from "@/types/sttns";

export async function fetchPeerReviewsForAsset(
  projectId: string,
  assetType: SttnsAssetType,
  assetId: string
): Promise<SttnsPeerReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_peer_reviews")
    .select("*")
    .eq("project_id", projectId)
    .eq("asset_type", assetType)
    .eq("asset_id", assetId)
    .order("created_at");

  const reviews = (data ?? []) as SttnsPeerReview[];
  const ids = Array.from(new Set(reviews.map((r) => r.reviewer_id)));
  if (!ids.length) return reviews;

  const { data: profiles } = await supabase
    .from("sttns_profiles")
    .select("id, full_name, email, avatar_url, platform_role")
    .in("id", ids);

  const map = Object.fromEntries(((profiles ?? []) as SttnsProfile[]).map((p) => [p.id, p]));
  return reviews.map((r) => ({ ...r, profile: map[r.reviewer_id] }));
}

/** Count peer review responses per initiative (for matrix status). */
export async function fetchInitiativeReviewCounts(
  projectId: string
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_peer_reviews")
    .select("asset_id")
    .eq("project_id", projectId)
    .eq("asset_type", "initiative");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.asset_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export async function fetchAllInitiativePeerReviews(
  projectId: string
): Promise<Record<string, SttnsPeerReview[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_peer_reviews")
    .select("*")
    .eq("project_id", projectId)
    .eq("asset_type", "initiative");

  const reviews = (data ?? []) as SttnsPeerReview[];
  const ids = Array.from(new Set(reviews.map((r) => r.reviewer_id)));
  let profileMap: Record<string, SttnsProfile> = {};
  if (ids.length) {
    const { data: profiles } = await supabase
      .from("sttns_profiles")
      .select("id, full_name, email, avatar_url, platform_role")
      .in("id", ids);
    profileMap = Object.fromEntries(((profiles ?? []) as SttnsProfile[]).map((p) => [p.id, p]));
  }

  const byAsset: Record<string, SttnsPeerReview[]> = {};
  for (const r of reviews) {
    const enriched = { ...r, profile: profileMap[r.reviewer_id] };
    if (!byAsset[r.asset_id]) byAsset[r.asset_id] = [];
    byAsset[r.asset_id].push(enriched);
  }
  return byAsset;
}
