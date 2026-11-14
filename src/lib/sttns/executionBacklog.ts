import type { SupabaseClient } from "@supabase/supabase-js";
import { isExecutionGovernanceFeature } from "@/lib/sttns/governanceAxes";
import type { SttnsInitiative, SttnsInitiativeExecutionStatus } from "@/types/sttns";

const EXECUTION_QUEUE_STATUSES: SttnsInitiativeExecutionStatus[] = [
  "pending",
  "in_development",
  "in_test",
  "deployed",
];

const REORDERABLE_STATUSES: SttnsInitiativeExecutionStatus[] = [
  "pending",
  "in_development",
  "in_test",
];

function isExecutionQueueRow(row: Parameters<typeof isExecutionGovernanceFeature>[0]) {
  return isExecutionGovernanceFeature(row);
}

export function isReorderableExecutionStatus(
  status: SttnsInitiativeExecutionStatus | null | undefined
): boolean {
  return REORDERABLE_STATUSES.includes(status ?? "pending");
}

export async function fetchExecutionQueueInitiatives(
  supabase: SupabaseClient,
  projectId: string
): Promise<SttnsInitiative[]> {
  const { data } = await supabase
    .from("sttns_initiatives")
    .select("*")
    .eq("project_id", projectId)
    .in("execution_status", EXECUTION_QUEUE_STATUSES)
    .is("archived_at", null)
    .order("execution_sort_order")
    .order("feature_code");

  return ((data ?? []) as SttnsInitiative[]).filter(isExecutionQueueRow);
}

/** Sous-ensemble réordonnanable : pending, in_development et in_test. */
export async function fetchReorderableQueueInitiatives(
  supabase: SupabaseClient,
  projectId: string
): Promise<SttnsInitiative[]> {
  const queue = await fetchExecutionQueueInitiatives(supabase, projectId);
  return queue.filter((row) => isReorderableExecutionStatus(row.execution_status));
}

/** @deprecated Préférer fetchReorderableQueueInitiatives */
export async function fetchPendingBacklogInitiatives(
  supabase: SupabaseClient,
  projectId: string
): Promise<SttnsInitiative[]> {
  return fetchReorderableQueueInitiatives(supabase, projectId).then((rows) =>
    rows.filter((row) => (row.execution_status ?? "pending") === "pending")
  );
}

/** Applique un réordonnancement sur la file active (pending + in_development). */
export async function applyExecutionQueueReorder(
  supabase: SupabaseClient,
  projectId: string,
  initiativeId: string,
  targetIndex: number
): Promise<
  | { ok: true; oldSortOrder: number; newSortOrder: number }
  | { ok: false; error: string }
> {
  const reorderable = await fetchReorderableQueueInitiatives(supabase, projectId);
  const fromIndex = reorderable.findIndex((row) => row.id === initiativeId);
  if (fromIndex < 0) {
    return { ok: false, error: "Feature introuvable dans la file d'exécution." };
  }

  const clampedIndex = Math.max(0, Math.min(targetIndex, reorderable.length - 1));
  if (fromIndex === clampedIndex) {
    return { ok: false, error: "Position inchangée." };
  }

  const oldSortOrder = reorderable[fromIndex].execution_sort_order ?? 0;
  const reordered = [...reorderable];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(clampedIndex, 0, moved);
  const newSortOrder = (clampedIndex + 1) * 10;

  for (let i = 0; i < reordered.length; i++) {
    const nextOrder = (i + 1) * 10;
    const { error } = await supabase
      .from("sttns_initiatives")
      .update({ execution_sort_order: nextOrder })
      .eq("id", reordered[i].id)
      .eq("project_id", projectId);
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true, oldSortOrder, newSortOrder };
}

/** @deprecated alias */
export const applyBacklogReorder = applyExecutionQueueReorder;

export function previewBacklogOrder(
  backlog: SttnsInitiative[],
  initiativeId: string,
  targetIndex: number
): SttnsInitiative[] {
  const fromIndex = backlog.findIndex((row) => row.id === initiativeId);
  if (fromIndex < 0) return backlog;

  const clampedIndex = Math.max(0, Math.min(targetIndex, backlog.length - 1));
  if (fromIndex === clampedIndex) return backlog;

  const next = [...backlog];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(clampedIndex, 0, moved);
  return next;
}

export function previewExecutionQueueOrder(
  queue: SttnsInitiative[],
  initiativeId: string,
  targetIndexAmongReorderable: number
): SttnsInitiative[] {
  const reorderable = queue.filter((row) => isReorderableExecutionStatus(row.execution_status));
  const fixed = queue.filter((row) => !isReorderableExecutionStatus(row.execution_status));
  const previewReorderable = previewBacklogOrder(
    reorderable,
    initiativeId,
    targetIndexAmongReorderable
  );
  return [...previewReorderable, ...fixed].sort(
    (a, b) =>
      (a.execution_sort_order ?? 0) - (b.execution_sort_order ?? 0) ||
      (a.feature_code ?? "").localeCompare(b.feature_code ?? "", undefined, { numeric: true })
  );
}

/** Réordonnancement direct du registre features (toutes initiatives actives). */
export async function applyRegistryReorder(
  supabase: SupabaseClient,
  projectId: string,
  initiativeId: string,
  targetIndex: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: rowsRaw } = await supabase
    .from("sttns_initiatives")
    .select("id, execution_sort_order")
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("execution_sort_order")
    .order("feature_code");

  const rows = rowsRaw ?? [];
  const fromIndex = rows.findIndex((row) => row.id === initiativeId);
  if (fromIndex < 0) {
    return { ok: false, error: "Feature introuvable." };
  }

  const clampedIndex = Math.max(0, Math.min(targetIndex, rows.length - 1));
  if (fromIndex === clampedIndex) {
    return { ok: true };
  }

  const reordered = [...rows];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(clampedIndex, 0, moved);

  for (let i = 0; i < reordered.length; i++) {
    const nextOrder = (i + 1) * 10;
    const { error } = await supabase
      .from("sttns_initiatives")
      .update({ execution_sort_order: nextOrder })
      .eq("id", reordered[i].id)
      .eq("project_id", projectId);
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function hasPendingExecutionProposal(
  supabase: SupabaseClient,
  projectId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("sttns_initiative_execution_proposals")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("status", "pending");

  return (count ?? 0) > 0;
}
