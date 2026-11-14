"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import { featuresPath } from "@/lib/sttns/paths";

// Actions d'exécution simplifiées - à reconstruire avec le modèle Spine
export async function applyTaskOrderAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  orderedTaskIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  // TODO: Reconstruire avec workItems (tasks)
  revalidatePath(featuresPath(projectSlug, initiativeId));
  return { ok: true };
}

export async function saveTaskPlanningAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  taskId: string,
  input: {
    assigneeId?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
    gitUrl?: string | null;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  // TODO: Reconstruire avec workItems
  revalidatePath(featuresPath(projectSlug, initiativeId));
  return { ok: true };
}
