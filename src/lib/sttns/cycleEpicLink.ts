import type { SupabaseClient } from "@supabase/supabase-js";
import { saveWorkItem, getWorkItem, buildSaveInputFromStored } from "@/lib/sttns/workItems";
import type { EpicMetadata } from "@/lib/sttns/types";

export function readEpicCycleId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const id = (metadata as Record<string, unknown>).cycle_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function findEpicIdByCycleId(
  supabase: SupabaseClient,
  projectId: string,
  cycleId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("sttns_work_items")
    .select("id, metadata")
    .eq("project_id", projectId)
    .eq("type", "epic")
    .is("archived_at", null);

  if (error) return null;

  for (const row of data ?? []) {
    if (readEpicCycleId(row.metadata) === cycleId) return row.id as string;
  }
  return null;
}

export async function createEpicForCycle(
  supabase: SupabaseClient,
  input: { projectId: string; cycleId: string; cycleName: string }
): Promise<{ ok: true; epicId: string } | { ok: false; error: string }> {
  const existingId = await findEpicIdByCycleId(supabase, input.projectId, input.cycleId);
  if (existingId) return { ok: true, epicId: existingId };

  const metadata: EpicMetadata = {
    cycle_id: input.cycleId,
  };

  const result = await saveWorkItem({
    project_id: input.projectId,
    type: "epic",
    title: input.cycleName,
    status: "todo",
    parent_id: null,
    priority: 3,
    sort_order: 0,
    metadata,
  });

  if (!result.ok) return result;
  return { ok: true, epicId: result.id };
}

export async function syncEpicTitleForCycle(
  supabase: SupabaseClient,
  projectId: string,
  cycleId: string,
  cycleName: string
): Promise<void> {
  const epicId = await findEpicIdByCycleId(supabase, projectId, cycleId);
  if (!epicId) return;

  const { data: epic } = await supabase
    .from("sttns_work_items")
    .select("id, title, metadata, status, priority, sort_order, code, archived_at, assignee_id")
    .eq("id", epicId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!epic || epic.title === cycleName) return;

  const metadata = (epic.metadata ?? {}) as EpicMetadata;
  await saveWorkItem({
    id: epic.id,
    project_id: projectId,
    type: "epic",
    title: cycleName,
    status: epic.status,
    parent_id: null,
    priority: epic.priority,
    sort_order: epic.sort_order,
    code: epic.code,
    archived_at: epic.archived_at,
    assignee_id: epic.assignee_id,
    metadata: { ...metadata, cycle_id: cycleId },
  });
}

/** Archive l'epic lié à un cycle (option Epic = Cycle). */
export async function archiveLinkedEpicForCycle(
  supabase: SupabaseClient,
  projectId: string,
  cycleId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const epicId = await findEpicIdByCycleId(supabase, projectId, cycleId);
  if (!epicId) return { ok: true };

  const current = await getWorkItem(epicId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "epic") {
    return { ok: true };
  }
  if (current.item.archived_at) {
    return { ok: true };
  }

  return saveWorkItem(
    buildSaveInputFromStored(current.item, {
      archived_at: new Date().toISOString(),
    })
  );
}
