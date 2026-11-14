import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  parseProjectWorkflowSettings,
  type ProjectWorkflowSettings,
} from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import { readImpact } from "@/lib/sttns/valueEffort";

export type GovernanceCheckResult = { ok: true } | { ok: false; error: string };

export const IMPACT_ZERO_BLOCK_MESSAGE =
  "Impact Gaspillage (0) : passage en cours interdit. Revalorisez la Feature avant d'exécuter.";

export const FEATURE_JTBD_REQUIRED_MESSAGE =
  "Constitution Spine : une Feature doit être rattachée à au moins un JTBD (context_link type=job).";

export async function fetchProjectWorkflowSettings(
  projectId: string,
  supabase?: SupabaseClient
): Promise<ProjectWorkflowSettings> {
  const client = supabase ?? (await createClient());
  const { data } = await client
    .from("sttns_projects")
    .select("settings")
    .eq("id", projectId)
    .single();

  return parseProjectWorkflowSettings(data?.settings);
}

const WIP_LIMIT_MESSAGE = "WIP Limit atteinte : terminez le travail en cours.";

/** Hard block absolu : Feature impact=0 ne peut pas rester / passer in_progress. */
export function assertFeatureImpactAllowsExecution(
  impact: number | null | undefined,
  status: string | null | undefined
): GovernanceCheckResult {
  if (status === "in_progress" && impact === 0) {
    return { ok: false, error: IMPACT_ZERO_BLOCK_MESSAGE };
  }
  return { ok: true };
}

/** Hard block : Feature impact=0 ne peut pas passer in_progress. */
export async function assertFeatureImpactNotWaste(
  supabase: SupabaseClient,
  projectId: string,
  featureId: string | null | undefined,
  previousStatus: string | null | undefined,
  nextStatus: string
): Promise<GovernanceCheckResult> {
  if (nextStatus !== "in_progress") {
    return { ok: true };
  }
  if (!featureId) {
    // Création : l’impact payload est vérifié via assertFeatureImpactAllowsExecution.
    return { ok: true };
  }

  const { data, error } = await supabase
    .from("sttns_work_items")
    .select("metadata")
    .eq("id", featureId)
    .eq("project_id", projectId)
    .eq("type", "feature")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return assertFeatureImpactAllowsExecution(readImpact(data?.metadata), nextStatus);
}

/**
 * Hard block : Feature sans JTBD (context_type=job) ne peut pas passer in_progress.
 * Si `payloadLinks` est fourni (même save), il prime sur la DB.
 */
export async function assertFeatureHasJtbdLink(
  supabase: SupabaseClient,
  featureId: string | null | undefined,
  previousStatus: string | null | undefined,
  nextStatus: string,
  payloadLinks?: { type: string }[] | undefined
): Promise<GovernanceCheckResult> {
  if (nextStatus !== "in_progress" || previousStatus === "in_progress") {
    return { ok: true };
  }

  if (payloadLinks !== undefined) {
    const has = payloadLinks.some((link) => link.type === "job");
    return has
      ? { ok: true }
      : { ok: false, error: FEATURE_JTBD_REQUIRED_MESSAGE };
  }

  if (!featureId) {
    return { ok: false, error: FEATURE_JTBD_REQUIRED_MESSAGE };
  }

  const { count, error } = await supabase
    .from("sttns_context_links")
    .select("id", { count: "exact", head: true })
    .eq("work_item_id", featureId)
    .eq("context_type", "job");

  if (error) return { ok: false, error: error.message };
  if ((count ?? 0) < 1) {
    return { ok: false, error: FEATURE_JTBD_REQUIRED_MESSAGE };
  }
  return { ok: true };
}

/** Hard block : Story dont la Feature parente a impact=0. */
export async function assertStoryFeatureImpactNotWaste(
  supabase: SupabaseClient,
  projectId: string,
  storyId: string | null | undefined,
  previousStatus: string | null | undefined,
  nextStatus: string
): Promise<GovernanceCheckResult> {
  if (nextStatus !== "in_progress" || previousStatus === "in_progress") {
    return { ok: true };
  }
  if (!storyId) return { ok: true };

  const { data: story, error } = await supabase
    .from("sttns_work_items")
    .select("parent_id")
    .eq("id", storyId)
    .eq("project_id", projectId)
    .eq("type", "story")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!story?.parent_id) return { ok: true };

  return assertFeatureImpactNotWaste(
    supabase,
    projectId,
    story.parent_id,
    null,
    nextStatus
  );
}

/** Bloque le passage d'une story vers in_progress si la limite WIP est atteinte. */
export async function assertStoryWipLimit(
  supabase: SupabaseClient,
  projectId: string,
  storyId: string | null | undefined,
  previousStatus: string | null | undefined,
  nextStatus: string,
  settings?: ProjectWorkflowSettings
): Promise<GovernanceCheckResult> {
  if (nextStatus !== "in_progress" || previousStatus === "in_progress") {
    return { ok: true };
  }

  const workflow = settings ?? (await fetchProjectWorkflowSettings(projectId, supabase));

  let query = supabase
    .from("sttns_work_items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("type", "story")
    .eq("status", "in_progress")
    .is("archived_at", null);

  if (storyId) {
    query = query.neq("id", storyId);
  }

  const { count, error } = await query;

  if (error) {
    return { ok: false, error: error.message };
  }

  if ((count ?? 0) >= workflow.wipLimit) {
    return { ok: false, error: WIP_LIMIT_MESSAGE };
  }

  return { ok: true };
}

/** Bloque le passage d'une story vers done si strictDoD et tasks ouvertes. */
export async function assertStoryStrictDoD(
  supabase: SupabaseClient,
  projectId: string,
  storyId: string | null | undefined,
  previousStatus: string | null | undefined,
  nextStatus: string,
  settings?: ProjectWorkflowSettings
): Promise<GovernanceCheckResult> {
  if (nextStatus !== "done" || previousStatus === "done") {
    return { ok: true };
  }

  const workflow = settings ?? (await fetchProjectWorkflowSettings(projectId, supabase));
  if (!workflow.strictDoD) {
    return { ok: true };
  }

  if (!storyId) {
    return { ok: true };
  }

  const { data: tasks, error } = await supabase
    .from("sttns_work_items")
    .select("id, status")
    .eq("project_id", projectId)
    .eq("parent_id", storyId)
    .eq("type", "task")
    .is("archived_at", null);

  if (error) {
    return { ok: false, error: error.message };
  }

  const openTasks = (tasks ?? []).filter((t) => t.status !== "done");
  if (openTasks.length > 0) {
    return {
      ok: false,
      error: `Definition of Done : ${openTasks.length} tâche(s) non terminée(s).`,
    };
  }

  return { ok: true };
}

/** Bloque le passage d'une feature vers in_progress si la limite WIP est atteinte (mode feature). */
export async function assertFeatureWipLimit(
  supabase: SupabaseClient,
  projectId: string,
  featureId: string | null | undefined,
  previousStatus: string | null | undefined,
  nextStatus: string,
  settings?: ProjectWorkflowSettings
): Promise<GovernanceCheckResult> {
  const workflow = settings ?? (await fetchProjectWorkflowSettings(projectId, supabase));
  if (!isFeatureExecutionMode(workflow)) {
    return { ok: true };
  }

  if (nextStatus !== "in_progress" || previousStatus === "in_progress") {
    return { ok: true };
  }

  let query = supabase
    .from("sttns_work_items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("type", "feature")
    .eq("status", "in_progress")
    .is("archived_at", null);

  if (featureId) {
    query = query.neq("id", featureId);
  }

  const { count, error } = await query;

  if (error) {
    return { ok: false, error: error.message };
  }

  if ((count ?? 0) >= workflow.wipLimit) {
    return { ok: false, error: WIP_LIMIT_MESSAGE };
  }

  return { ok: true };
}

export async function assertFeatureStatusGovernance(
  supabase: SupabaseClient,
  projectId: string,
  featureId: string | null | undefined,
  previousStatus: string | null | undefined,
  nextStatus: string,
  options?: { contextLinks?: { type: string }[] }
): Promise<GovernanceCheckResult> {
  const settings = await fetchProjectWorkflowSettings(projectId, supabase);

  const impact = await assertFeatureImpactNotWaste(
    supabase,
    projectId,
    featureId,
    previousStatus,
    nextStatus
  );
  if (!impact.ok) return impact;

  const jtbd = await assertFeatureHasJtbdLink(
    supabase,
    featureId,
    previousStatus,
    nextStatus,
    options?.contextLinks
  );
  if (!jtbd.ok) return jtbd;

  return assertFeatureWipLimit(
    supabase,
    projectId,
    featureId,
    previousStatus,
    nextStatus,
    settings
  );
}

export async function assertStoryStatusGovernance(
  supabase: SupabaseClient,
  projectId: string,
  storyId: string | null | undefined,
  previousStatus: string | null | undefined,
  nextStatus: string
): Promise<GovernanceCheckResult> {
  const settings = await fetchProjectWorkflowSettings(projectId, supabase);

  const impact = await assertStoryFeatureImpactNotWaste(
    supabase,
    projectId,
    storyId,
    previousStatus,
    nextStatus
  );
  if (!impact.ok) return impact;

  const wip = await assertStoryWipLimit(
    supabase,
    projectId,
    storyId,
    previousStatus,
    nextStatus,
    settings
  );
  if (!wip.ok) return wip;

  return assertStoryStrictDoD(
    supabase,
    projectId,
    storyId,
    previousStatus,
    nextStatus,
    settings
  );
}

export { WIP_LIMIT_MESSAGE };
