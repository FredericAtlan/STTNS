import type { SupabaseClient } from "@supabase/supabase-js";
import type { SttnsRelease, SttnsReleaseStatus } from "@/types/sttns";

export const RELEASE_STATUS_LABELS: Record<SttnsReleaseStatus, string> = {
  draft: "Brouillon",
  active: "Active",
  shipped: "Livrée",
};

export const LIFECYCLE_STATUS_LABELS = {
  planned: "Planifiée",
  live: "Live",
  deprecated: "Obsolète",
} as const;

export async function fetchProjectReleases(
  supabase: SupabaseClient,
  projectId: string
): Promise<SttnsRelease[]> {
  const { data, error } = await supabase
    .from("sttns_releases")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("label");
  if (error) throw error;
  return (data ?? []) as SttnsRelease[];
}

export async function fetchAssignableReleases(
  supabase: SupabaseClient,
  projectId: string
): Promise<SttnsRelease[]> {
  const all = await fetchProjectReleases(supabase, projectId);
  return all.filter((r) => r.status !== "shipped");
}

export function releaseLabelById(releases: SttnsRelease[]): Record<string, string> {
  return Object.fromEntries(releases.map((r) => [r.id, r.label]));
}

export function groupInitiativesByRelease<T extends { release_id: string | null }>(
  initiatives: T[],
  releases: SttnsRelease[]
): { backlog: T[]; columns: { release: SttnsRelease | null; label: string; items: T[] }[] } {
  const backlog = initiatives.filter((i) => !i.release_id);
  const byRelease = new Map<string, T[]>();
  for (const init of initiatives) {
    if (!init.release_id) continue;
    const list = byRelease.get(init.release_id) ?? [];
    list.push(init);
    byRelease.set(init.release_id, list);
  }

  const columns = releases.map((release) => ({
    release,
    label: release.label,
    items: byRelease.get(release.id) ?? [],
  }));

  return { backlog, columns };
}
