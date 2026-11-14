"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import { featuresPath } from "@/lib/sttns/paths";
import {
  buildSaveInputFromStored,
  getWorkItem,
  saveWorkItem,
  type StoredWorkItem,
} from "@/lib/sttns/workItems";

import type { InitiativeFormPayload } from "@/lib/sttns/types";
import { parseMetadataDocUrlInput, readMetadataDocUrl } from "@/lib/sttns/workItemMetadata";
import { fetchProjectWorkflowSettings } from "@/lib/sttns/workflowGovernance";
import { isEpicEqualsCycle } from "@/lib/sttns/projectExecutionMode";
import { findEpicIdByCycleId } from "@/lib/sttns/cycleEpicLink";

export async function saveInitiativeAction(
  projectSlug: string,
  payload: InitiativeFormPayload,
  options: {
    initiativeId?: string;
    metricSelect: string;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const access = await requireProjectMember(payload.project_id);
  if (!access.ok) return access;

  let existingItem: StoredWorkItem | null = null;

  if (options.initiativeId) {
    const current = await getWorkItem(options.initiativeId);
    if (!current.ok) return current;
    if (!current.item || current.item.type !== "feature") {
      return { ok: false, error: "Feature introuvable." };
    }
    existingItem = current.item;
  }

  const docParsed =
    payload.doc_url !== undefined
      ? parseMetadataDocUrlInput(payload.doc_url)
      : { ok: true as const, url: readMetadataDocUrl(existingItem?.metadata) };
  if (!docParsed.ok) return { ok: false, error: docParsed.error };

  let metadata: Record<string, unknown> | undefined;

  if (options.initiativeId && existingItem) {
    metadata = {
      ...(existingItem.metadata ?? {}),
      description: payload.description?.trim() || null,
      doc_url: docParsed.url,
      impact: payload.impact ?? (existingItem.metadata as { impact?: number })?.impact,
      effort_days:
        payload.effort_days ?? (existingItem.metadata as { effort_days?: number })?.effort_days,
      complexity:
        payload.complexity ?? (existingItem.metadata as { complexity?: number })?.complexity,
    };
  } else {
    metadata = {
      ...(payload.description?.trim() ? { description: payload.description.trim() } : {}),
      ...(docParsed.url ? { doc_url: docParsed.url } : {}),
      ...(payload.impact !== undefined ? { impact: payload.impact } : {}),
      ...(payload.effort_days !== undefined ? { effort_days: payload.effort_days } : {}),
      ...(payload.complexity !== undefined ? { complexity: payload.complexity } : {}),
    };
  }

  if (payload.impact === undefined && !options.initiativeId) {
    return { ok: false, error: "L'impact (0–3) est obligatoire sur une Feature." };
  }

  const parentId = payload.epic_id?.trim();
  if (!parentId) {
    return { ok: false, error: "Une feature doit être rattachée à un epic." };
  }

  // Constitution Spine (Hard Stop) — Feature ↔ JTBD obligatoire côté API.
  // Miroir serveur de la règle FeatureForm client-side : bloque toute sauvegarde
  // (création ou édition) sans au moins un context_link `type=job`.
  // N'affecte ni les seeds (saveWorkItem direct), ni archive/duplicate/rename
  // (qui préservent context_links via buildSaveInputFromStored).
  const contextLinks = payload.context_links ?? [];
  const hasJtbdLink = contextLinks.some((link) => link.type === "job");
  if (!hasJtbdLink) {
    return {
      ok: false,
      error:
        "Constitution Spine : une Feature doit être rattachée à au moins un JTBD (context_link type=job).",
    };
  }

  const rawCycleId = payload.cycle_id;
  const cycleId =
    typeof rawCycleId === "string"
      ? rawCycleId.trim() || null
      : rawCycleId === null
        ? null
        : existingItem?.cycle_id ?? null;

  let resolvedParentId = parentId;
  if (cycleId) {
    const supabase = await createClient();
    const workflow = await fetchProjectWorkflowSettings(payload.project_id, supabase);
    if (isEpicEqualsCycle(workflow)) {
      const linkedEpicId = await findEpicIdByCycleId(supabase, payload.project_id, cycleId);
      if (linkedEpicId) {
        resolvedParentId = linkedEpicId;
      }
    }
  }

  const result = await saveWorkItem({
    id: options.initiativeId,
    project_id: payload.project_id,
    type: "feature",
    parent_id: resolvedParentId,
    cycle_id: cycleId,
    status: existingItem?.status ?? "todo",
    title: payload.feature_name,
    code: existingItem?.code ?? null,
    archived_at: existingItem?.archived_at ?? null,
    context_links: payload.context_links ?? [],
    priority: existingItem?.priority ?? 3,
    sort_order: existingItem?.sort_order ?? 0,
    metadata: metadata ?? {},
  });

  if (!result.ok) return result;

  revalidatePath(featuresPath(projectSlug));
  revalidatePath(`/projects/${projectSlug}/portfolio`);
  revalidatePath(`/projects/${projectSlug}/radar`);
  revalidatePath(`/projects/${projectSlug}/kanban`);
  revalidatePath(`/projects/${projectSlug}/mindmap`);
  if (options.initiativeId) {
    revalidatePath(featuresPath(projectSlug, options.initiativeId));
  }

  return { ok: true, id: result.id };
}

export async function archiveInitiativeAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await getWorkItem(initiativeId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "feature") {
    return { ok: false, error: "Feature introuvable." };
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, {
      archived_at: new Date().toISOString(),
    })
  );

  if (!result.ok) return result;
  revalidatePath(featuresPath(projectSlug, "arbitrage"));
  return { ok: true };
}

export async function duplicateInitiativeAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const current = await getWorkItem(initiativeId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "feature") {
    return { ok: false, error: "Feature introuvable." };
  }

  const result = await saveWorkItem({
    project_id: projectId,
    type: "feature",
    parent_id: current.item.parent_id,
    status: current.item.status,
    title: `${current.item.title} Copy`,
    code: current.item.code ? `${current.item.code}-copy` : null,
    archived_at: null,
    context_links: current.item.context_links,
    priority: current.item.priority,
    sort_order: current.item.sort_order + 1,
    metadata: current.item.metadata,
  });

  if (!result.ok) return result;
  revalidatePath(featuresPath(projectSlug, "arbitrage"));
  return { ok: true, id: result.id };
}

export async function deleteInitiativeAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_work_items")
    .delete()
    .eq("id", initiativeId)
    .eq("project_id", projectId)
    .eq("type", "feature");

  if (error) return { ok: false, error: error.message };

  revalidatePath(featuresPath(projectSlug, "arbitrage"));
  return { ok: true };
}

export async function renameInitiativeAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  newName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await getWorkItem(initiativeId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "feature") {
    return { ok: false, error: "Feature introuvable." };
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, { title: newName })
  );

  if (!result.ok) return result;
  revalidatePath(featuresPath(projectSlug, "arbitrage"));
  return { ok: true };
}

export async function saveArbitragePhase1Action(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  data: { phase1_status: string | null; sensitive_domain: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  revalidatePath(featuresPath(projectSlug, "arbitrage"));
  return { ok: true };
}

export async function saveArbitragePhase2Action(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  data: {
    metric_id: string | null;
    nsm_link_clear: boolean;
    kano_type: string | null;
    rice_reach: number | null;
    rice_impact: number | null;
    rice_confidence: number | null;
    rice_effort: number | null;
    decision: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const current = await getWorkItem(initiativeId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "feature") {
    return { ok: false, error: "Feature introuvable." };
  }

  const result = await saveWorkItem(buildSaveInputFromStored(current.item));

  if (!result.ok) return result;
  revalidatePath(featuresPath(projectSlug, "arbitrage"));
  return { ok: true };
}

export async function submitFeatureForReviewAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  title: string,
  submitComment?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  revalidatePath(featuresPath(projectSlug, "arbitrage"));
  return { ok: true };
}

export async function submitHierarchicalValidationAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  revalidatePath(featuresPath(projectSlug, initiativeId));
  return { ok: true };
}

export async function saveHierarchicalReviewAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  data: {
    validation_step: "tier1" | "cto" | "ceo";
    reviewer_role: string;
    decision: string;
    comment: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  revalidatePath(featuresPath(projectSlug, initiativeId));
  return { ok: true };
}

export async function reorderFeatureRegistryAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  targetIndex: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  revalidatePath(featuresPath(projectSlug));
  revalidatePath(`/projects/${projectSlug}/agile`);
  return { ok: true };
}

export async function updateFeatureExecutionStatusAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  executionStatus: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  revalidatePath(featuresPath(projectSlug));
  revalidatePath(featuresPath(projectSlug, initiativeId));
  revalidatePath(`/projects/${projectSlug}/agile`);
  return { ok: true };
}

export async function reopenFeatureForRevisionAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  note?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  revalidatePath(featuresPath(projectSlug, "arbitrage"));
  revalidatePath(featuresPath(projectSlug, initiativeId));
  return { ok: true };
}
