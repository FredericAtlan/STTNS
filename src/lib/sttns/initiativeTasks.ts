import type { SupabaseClient } from "@supabase/supabase-js";
import type { SttnsInitiativeTask } from "@/types/sttns";

export function sortInitiativeTasks<T extends Pick<SttnsInitiativeTask, "sort_order" | "created_at" | "id">>(
  tasks: T[]
): T[] {
  return [...tasks].sort(
    (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      a.created_at.localeCompare(b.created_at) ||
      a.id.localeCompare(b.id)
  );
}

export async function nextInitiativeTaskSortOrder(
  supabase: SupabaseClient,
  projectId: string,
  initiativeId: string
): Promise<number> {
  const { data } = await supabase
    .from("sttns_initiative_tasks")
    .select("sort_order")
    .eq("project_id", projectId)
    .eq("initiative_id", initiativeId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data?.sort_order as number | undefined) ?? 0) + 10;
}

export async function applyInitiativeTaskReorder(
  supabase: SupabaseClient,
  projectId: string,
  initiativeId: string,
  taskId: string,
  targetIndex: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: rowsRaw } = await supabase
    .from("sttns_initiative_tasks")
    .select("id, sort_order")
    .eq("project_id", projectId)
    .eq("initiative_id", initiativeId)
    .order("sort_order")
    .order("created_at");

  const rows = rowsRaw ?? [];
  const fromIndex = rows.findIndex((row) => row.id === taskId);
  if (fromIndex < 0) {
    return { ok: false, error: "Sous-étape introuvable." };
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
      .from("sttns_initiative_tasks")
      .update({ sort_order: nextOrder })
      .eq("id", reordered[i].id)
      .eq("project_id", projectId)
      .eq("initiative_id", initiativeId);
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}
