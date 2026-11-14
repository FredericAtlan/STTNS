"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import { cycleSaveSchema, type CycleSaveInput } from "@/lib/sttns/cycles";
import {
  createEpicForCycle,
  syncEpicTitleForCycle,
  findEpicIdByCycleId,
  archiveLinkedEpicForCycle,
} from "@/lib/sttns/cycleEpicLink";
import { fetchProjectWorkflowSettings } from "@/lib/sttns/workflowGovernance";
import { isEpicEqualsCycle } from "@/lib/sttns/projectExecutionMode";

function revalidateCyclePaths(projectSlug: string, cycleId?: string) {
  revalidatePath(`/projects/${projectSlug}/cycles`);
  if (cycleId) {
    revalidatePath(`/projects/${projectSlug}/cycles/${cycleId}`);
  }
  revalidatePath(`/projects/${projectSlug}/kanban`);
  revalidatePath(`/projects/${projectSlug}/user-stories`);
  revalidatePath(`/projects/${projectSlug}/user-stories/new`);
  revalidatePath(`/projects/${projectSlug}/mindmap`);
  revalidatePath(`/projects/${projectSlug}/portfolio`);
}

export async function createCycleAction(
  projectId: string,
  projectSlug: string,
  data: CycleSaveInput
) {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const parsed = cycleSaveSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Données cycle invalides.",
    };
  }

  const supabase = await createClient();

  const { data: cycle, error } = await supabase
    .from("sttns_cycles")
    .insert({
      project_id: projectId,
      name: parsed.data.name,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      is_active: parsed.data.is_active ?? true,
      capacity_points: parsed.data.capacity_points ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const workflow = await fetchProjectWorkflowSettings(projectId, supabase);
  if (isEpicEqualsCycle(workflow)) {
    const epicResult = await createEpicForCycle(supabase, {
      projectId,
      cycleId: cycle.id,
      cycleName: parsed.data.name,
    });
    if (!epicResult.ok) {
      return epicResult;
    }
  }

  revalidateCyclePaths(projectSlug);
  return { ok: true as const, id: cycle.id };
}

export async function updateCycleAction(
  cycleId: string,
  projectId: string,
  projectSlug: string,
  data: CycleSaveInput
) {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const parsed = cycleSaveSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Données cycle invalides.",
    };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("sttns_cycles")
    .select("id")
    .eq("id", cycleId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false as const, error: fetchError.message };
  }
  if (!existing) {
    return { ok: false as const, error: "Cycle introuvable." };
  }

  const { error } = await supabase
    .from("sttns_cycles")
    .update({
      name: parsed.data.name,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      is_active: parsed.data.is_active ?? true,
      capacity_points: parsed.data.capacity_points ?? 0,
    })
    .eq("id", cycleId)
    .eq("project_id", projectId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const workflow = await fetchProjectWorkflowSettings(projectId, supabase);
  if (isEpicEqualsCycle(workflow)) {
    await syncEpicTitleForCycle(supabase, projectId, cycleId, parsed.data.name);
  }

  revalidateCyclePaths(projectSlug, cycleId);
  return { ok: true as const, id: cycleId };
}

export async function archiveCycleAction(
  cycleId: string,
  projectId: string,
  projectSlug: string
) {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();

  const { error } = await supabase
    .from("sttns_cycles")
    .update({ is_active: false })
    .eq("id", cycleId)
    .eq("project_id", projectId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  // Détache les items (stories + features) rattachés à ce cycle pour éviter
  // qu'ils restent orphelins d'un cycle clôturé. Le nettoyage se limite au
  // scope projet + colonne cycle_id (RLS UPDATE existante).
  const { error: detachError } = await supabase
    .from("sttns_work_items")
    .update({ cycle_id: null })
    .eq("project_id", projectId)
    .eq("cycle_id", cycleId)
    .in("type", ["story", "feature"]);

  if (detachError) {
    return { ok: false as const, error: detachError.message };
  }

  const workflow = await fetchProjectWorkflowSettings(projectId, supabase);
  if (isEpicEqualsCycle(workflow)) {
    const epicArchive = await archiveLinkedEpicForCycle(supabase, projectId, cycleId);
    if (!epicArchive.ok) {
      return epicArchive;
    }
  }

  revalidateCyclePaths(projectSlug);
  revalidatePath(`/projects/${projectSlug}/portfolio`);
  return { ok: true as const };
}

export async function updateCycleCapacityAction(
  cycleId: string,
  projectId: string,
  projectSlug: string,
  capacity: number
) {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  if (capacity < 0) {
    return { ok: false as const, error: "La capacité doit être un nombre positif." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("sttns_cycles")
    .update({ capacity_points: capacity })
    .eq("id", cycleId)
    .eq("project_id", projectId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidateCyclePaths(projectSlug, cycleId);
  return { ok: true as const };
}

export async function assignStoryToCycleAction(
  storyId: string,
  cycleId: string | null,
  projectId: string,
  projectSlug: string
) {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();

  const { error } = await supabase
    .from("sttns_work_items")
    .update({ cycle_id: cycleId })
    .eq("id", storyId)
    .eq("project_id", projectId)
    .eq("type", "story");

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidateCyclePaths(projectSlug, cycleId ?? undefined);
  return { ok: true as const };
}

export async function assignFeatureToCycleAction(
  featureId: string,
  cycleId: string | null,
  projectId: string,
  projectSlug: string
) {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const workflow = await fetchProjectWorkflowSettings(projectId, supabase);

  const updatePayload: { cycle_id: string | null; parent_id?: string } = {
    cycle_id: cycleId,
  };

  if (cycleId && isEpicEqualsCycle(workflow)) {
    const epicId = await findEpicIdByCycleId(supabase, projectId, cycleId);
    if (epicId) {
      updatePayload.parent_id = epicId;
    }
  }

  const { error } = await supabase
    .from("sttns_work_items")
    .update(updatePayload)
    .eq("id", featureId)
    .eq("project_id", projectId)
    .eq("type", "feature");

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidateCyclePaths(projectSlug, cycleId ?? undefined);
  return { ok: true as const };
}
