import { createClient } from "@/lib/supabase/server";
import type { MetricDraft } from "@/lib/sttns/metrics";

export function validateMetricDrafts(drafts: MetricDraft[]): string | null {
  function walk(nodes: MetricDraft[], depth: number): string | null {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node.name.trim()) {
        const level = depth === 0 ? 2 : depth + 2;
        return `Level ${level} metric #${i + 1} needs a name before saving.`;
      }
      const childErr = walk(node.children ?? [], depth + 1);
      if (childErr) return childErr;
    }
    return null;
  }
  return walk(drafts, 0);
}

async function saveMetricNode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  node: MetricDraft,
  parentId: string | null,
  sortOrder: number,
  keptIds: Set<string>
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const name = node.name.trim();
  if (!name) {
    return { ok: false, error: "Empty metric name in save tree." };
  }

  let nodeId: string | undefined = node.id;

  if (nodeId) {
    const { error } = await supabase
      .from("sttns_project_metrics")
      .update({
        name,
        description: node.description.trim() || null,
        sort_order: sortOrder,
        parent_id: parentId,
      })
      .eq("id", nodeId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: inserted, error } = await supabase
      .from("sttns_project_metrics")
      .insert({
        project_id: projectId,
        name,
        description: node.description.trim() || null,
        sort_order: sortOrder,
        parent_id: parentId,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return { ok: false, error: error?.message ?? "Failed to create sub-metric" };
    }
    nodeId = inserted.id;
  }

  if (!nodeId) {
    return { ok: false, error: "Failed to resolve metric id after save." };
  }

  keptIds.add(nodeId);

  let childOrder = 0;
  for (const child of node.children ?? []) {
    childOrder += 1;
    const result = await saveMetricNode(supabase, projectId, child, nodeId, childOrder, keptIds);
    if (!result.ok) return result;
  }

  return { ok: true, id: nodeId };
}

export async function saveProjectMetrics(
  projectId: string,
  nsmLabel: string,
  nsmDescription: string,
  drafts: MetricDraft[],
  existingIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const validationError = validateMetricDrafts(drafts);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error: projError } = await supabase
    .from("sttns_projects")
    .update({
      nsm_label: nsmLabel.trim(),
      nsm_description: nsmDescription.trim() || null,
    })
    .eq("id", projectId);

  if (projError) return { ok: false, error: projError.message };

  const keptIds = new Set<string>();

  for (let mi = 0; mi < drafts.length; mi++) {
    const main = drafts[mi];
    if (!main.name.trim()) continue;
    const result = await saveMetricNode(supabase, projectId, main, null, mi + 1, keptIds);
    if (!result.ok) return result;
  }

  const toDelete = existingIds.filter((id) => !keptIds.has(id));
  if (toDelete.length) {
    const { error: delError } = await supabase
      .from("sttns_project_metrics")
      .delete()
      .in("id", toDelete);
    if (delError) return { ok: false, error: delError.message };
  }

  return { ok: true };
}
