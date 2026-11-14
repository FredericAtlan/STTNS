import { createClient } from "@/lib/supabase/server";
import type { SttnsAssetType, SttnsTaskType } from "@/types/sttns";

export async function createTasksForUsers(
  projectId: string,
  userIds: string[],
  task: {
    task_type: SttnsTaskType;
    asset_type: SttnsAssetType;
    asset_id: string;
    title: string;
  }
) {
  if (!userIds.length) return;
  const supabase = await createClient();
  await supabase.from("sttns_user_tasks").insert(
    userIds.map((user_id) => ({
      project_id: projectId,
      user_id,
      task_type: task.task_type,
      asset_type: task.asset_type,
      asset_id: task.asset_id,
      title: task.title,
      status: "open",
    }))
  );
}

export async function cancelOpenTasksForAsset(
  projectId: string,
  assetType: SttnsAssetType,
  assetId: string
) {
  const supabase = await createClient();
  await supabase
    .from("sttns_user_tasks")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("asset_type", assetType)
    .eq("asset_id", assetId)
    .eq("status", "open");
}

export async function completeTaskForUser(
  userId: string,
  assetType: SttnsAssetType,
  assetId: string,
  taskTypes: SttnsTaskType[]
) {
  const supabase = await createClient();
  await supabase
    .from("sttns_user_tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("asset_type", assetType)
    .eq("asset_id", assetId)
    .in("task_type", taskTypes)
    .eq("status", "open");
}

export async function countOpenTasks(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("sttns_user_tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "open");
  return count ?? 0;
}

export async function countOpenCeoFinalizeTasks(
  userId: string,
  projectId: string
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("sttns_user_tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("task_type", "ceo_finalize_feature")
    .eq("status", "open");
  return count ?? 0;
}

export async function fetchOpenTasks(userId: string, limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_user_tasks")
    .select("*, project:sttns_projects(slug, name)")
    .eq("user_id", userId)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export function taskTargetPath(
  slug: string,
  assetType: SttnsAssetType | null,
  assetId: string | null,
  taskType?: SttnsTaskType | null
): string {
  if (taskType === "ceo_approve_execution_order") {
    return `/projects/${slug}/kanban`;
  }
  if (!assetType || !assetId) return `/projects/${slug}/team`;
  if (assetType === "persona") return `/projects/${slug}/why`;
  if (assetType === "user_story") return `/projects/${slug}/user-stories/${assetId}`;
  return `/projects/${slug}/features/${assetId}`;
}
