import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildInitialBacklogHistoryComment,
} from "@/lib/sttns/placementReason";
import {
  insertExecutionHistoryEntry,
  resolveExecutionHistoryActor,
} from "@/lib/sttns/executionHistory";
import type {
  SttnsDecision,
  SttnsEpicStatus,
  SttnsInitiativeExecutionStatus,
} from "@/types/sttns";

/** Seules les décisions BUILD déclenchent l'entrée backlog technique. */
export function shouldCascadeFeatureToSprint(decision: SttnsDecision | null): boolean {
  return decision === "build";
}

type InitiativeCascadeTarget = {
  id: string;
  user_story_id: string | null;
  epic_id: string;
};

/** Pousse une epic `ready` → `in_progress` si ≥1 story `in_sprint` ou `delivered`. */
export async function syncEpicStatusFromStories(
  supabase: SupabaseClient,
  projectId: string,
  epicId: string
): Promise<void> {
  const { data: epic } = await supabase
    .from("sttns_epics")
    .select("status")
    .eq("id", epicId)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .single();

  if (!epic) return;

  const { data: stories } = await supabase
    .from("sttns_user_stories")
    .select("status")
    .eq("project_id", projectId)
    .eq("epic_id", epicId)
    .is("archived_at", null);

  const rows = stories ?? [];
  if (rows.length === 0) return;

  const hasActive = rows.some((s) => s.status === "in_sprint" || s.status === "delivered");
  const allDelivered = rows.every((s) => s.status === "delivered");

  let nextStatus: SttnsEpicStatus | null = null;

  if (allDelivered) {
    nextStatus = "done";
  } else if (hasActive && (epic.status as SttnsEpicStatus) === "ready") {
    nextStatus = "in_progress";
  }

  if (nextStatus && nextStatus !== epic.status) {
    await supabase
      .from("sttns_epics")
      .update({ status: nextStatus })
      .eq("id", epicId)
      .eq("project_id", projectId);
  }
}

async function nextBacklogSortOrder(
  supabase: SupabaseClient,
  projectId: string
): Promise<number> {
  const { data } = await supabase
    .from("sttns_initiatives")
    .select("execution_sort_order")
    .eq("project_id", projectId)
    .eq("execution_status", "pending")
    .is("archived_at", null)
    .order("execution_sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data?.execution_sort_order as number | undefined) ?? 0) + 10;
}

/**
 * Décision BUILD actée (CEO) → backlog technique `pending`.
 * Epic et User Story ne bougent pas à cette étape.
 */
export async function cascadeOnFeatureBuildApproved(
  supabase: SupabaseClient,
  projectId: string,
  initiative: InitiativeCascadeTarget,
  changedBy?: string | null
): Promise<void> {
  const sortOrder = await nextBacklogSortOrder(supabase, projectId);

  const { data: initiativeRow } = await supabase
    .from("sttns_initiatives")
    .select("rice_score")
    .eq("id", initiative.id)
    .eq("project_id", projectId)
    .maybeSingle();

  await supabase
    .from("sttns_initiatives")
    .update({
      execution_status: "pending" satisfies SttnsInitiativeExecutionStatus,
      workflow_status: "approved",
      execution_sort_order: sortOrder,
      placement_reason_type: "strategic_priority",
      placement_comment: buildInitialBacklogHistoryComment(
        initiativeRow?.rice_score as number | null | undefined
      ),
    })
    .eq("id", initiative.id)
    .eq("project_id", projectId);

  const actorId = await resolveExecutionHistoryActor(supabase, initiative.id, changedBy);
  if (actorId) {
    await insertExecutionHistoryEntry(supabase, {
      initiativeId: initiative.id,
      changedBy: actorId,
      oldSortOrder: 0,
      newSortOrder: sortOrder,
      reasonType: "strategic_priority",
      comment: buildInitialBacklogHistoryComment(
        initiativeRow?.rice_score as number | null | undefined
      ),
      eventKind: "initial",
    });
  }
}

/**
 * Action Tech « Démarrer le dev » → sprint réel.
 * Feature `in_development`, story `in_sprint`, epic synchronisée.
 */
export async function cascadeOnFeatureDevelopmentStart(
  supabase: SupabaseClient,
  projectId: string,
  initiative: InitiativeCascadeTarget
): Promise<void> {
  await supabase
    .from("sttns_initiatives")
    .update({
      execution_status: "in_development" satisfies SttnsInitiativeExecutionStatus,
      workflow_status: "approved",
    })
    .eq("id", initiative.id)
    .eq("project_id", projectId);

  if (initiative.user_story_id) {
    await supabase
      .from("sttns_user_stories")
      .update({ status: "in_sprint" })
      .eq("id", initiative.user_story_id)
      .eq("project_id", projectId)
      .eq("status", "validated");
  }

  await syncEpicStatusFromStories(supabase, projectId, initiative.epic_id);
}

/** @deprecated Préférer cascadeOnFeatureBuildApproved */
export async function cascadeOnFeatureApproved(
  supabase: SupabaseClient,
  projectId: string,
  initiative: InitiativeCascadeTarget
): Promise<void> {
  await cascadeOnFeatureBuildApproved(supabase, projectId, initiative);
}

/** Story livrée quand toutes les features BUILD sont `deployed`. */
export async function allApprovedFeaturesDeployedForStory(
  supabase: SupabaseClient,
  projectId: string,
  userStoryId: string
): Promise<boolean> {
  const { data: features } = await supabase
    .from("sttns_initiatives")
    .select("execution_status")
    .eq("project_id", projectId)
    .eq("user_story_id", userStoryId)
    .eq("status", "approved")
    .is("archived_at", null);

  const rows = features ?? [];
  if (rows.length === 0) return false;

  return rows.every(
    (f) => (f.execution_status as SttnsInitiativeExecutionStatus | null) === "deployed"
  );
}

/** @deprecated alias */
export const allApprovedFeaturesDevDoneForStory = allApprovedFeaturesDeployedForStory;

/** Feature déployée → vérifie story + epic `done`. */
export async function cascadeOnFeatureDevDone(
  supabase: SupabaseClient,
  projectId: string,
  initiative: InitiativeCascadeTarget
): Promise<void> {
  await supabase
    .from("sttns_initiatives")
    .update({ execution_status: "deployed" satisfies SttnsInitiativeExecutionStatus })
    .eq("id", initiative.id)
    .eq("project_id", projectId);

  if (initiative.user_story_id) {
    const storyFullyDelivered = await allApprovedFeaturesDeployedForStory(
      supabase,
      projectId,
      initiative.user_story_id
    );
    if (storyFullyDelivered) {
      await supabase
        .from("sttns_user_stories")
        .update({ status: "delivered" })
        .eq("id", initiative.user_story_id)
        .eq("project_id", projectId);
    }
  }

  await syncEpicStatusFromStories(supabase, projectId, initiative.epic_id);
}

export async function fetchInitiativeCascadeTarget(
  supabase: SupabaseClient,
  projectId: string,
  initiativeId: string
): Promise<InitiativeCascadeTarget | null> {
  const { data } = await supabase
    .from("sttns_initiatives")
    .select("id, user_story_id, epic_id, status, execution_status")
    .eq("id", initiativeId)
    .eq("project_id", projectId)
    .single();

  if (!data?.epic_id) return null;
  return {
    id: data.id,
    user_story_id: data.user_story_id,
    epic_id: data.epic_id,
  };
}
