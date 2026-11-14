"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import { featuresPath } from "@/lib/sttns/paths";

function revalidateAgilePaths(projectSlug: string, initiativeId?: string) {
  revalidatePath(`/projects/${projectSlug}/agile`);
  revalidatePath(featuresPath(projectSlug, "arbitrage"));
  revalidatePath(`/projects/${projectSlug}/epics`);
  revalidatePath(`/projects/${projectSlug}/user-stories`);
  revalidatePath("/me/tasks");
  if (initiativeId) revalidatePath(featuresPath(projectSlug, initiativeId));
}

// Actions simplifiées - à reconstruire avec le nouveau modèle Spine
export async function reorderBacklogFeatureAction(input: {
  projectId: string;
  projectSlug: string;
  initiativeId: string;
  targetIndex: number;
  reasonType: string;
  comment: string;
  featureLabel: string;
}): Promise<
  | { ok: true; mode: "applied" | "proposed" }
  | { ok: false; error: string }
> {
  const access = await requireProjectMember(input.projectId);
  if (!access.ok) return access;

  const trimmedComment = input.comment.trim();
  if (!trimmedComment) {
    return { ok: false, error: "Le commentaire justificatif est obligatoire." };
  }

  // TODO: Reconstruire avec workItems et cycles
  revalidateAgilePaths(input.projectSlug, input.initiativeId);
  return { ok: true, mode: "applied" };
}

export async function startFeatureDevelopmentAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  // TODO: Reconstruire avec workItems
  revalidateAgilePaths(projectSlug, initiativeId);
  return { ok: true };
}

export async function markFeatureDeployedAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  // TODO: Reconstruire avec workItems
  revalidateAgilePaths(projectSlug, initiativeId);
  return { ok: true };
}
