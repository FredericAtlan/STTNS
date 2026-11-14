"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  buildSaveInputFromStored,
  getWorkItem,
  saveWorkItem,
} from "@/lib/sttns/workItems";
import { requireProjectMember } from "@/lib/sttns/access";
import type { StoredWorkItem } from "@/lib/sttns/types";

function revalidateArchivedItem(projectSlug: string, type: StoredWorkItem["type"]) {
  switch (type) {
    case "persona":
    case "job":
    case "pain_point":
      revalidatePath(`/projects/${projectSlug}/why`);
      revalidatePath(`/projects/${projectSlug}/personas`);
      revalidatePath(`/projects/${projectSlug}/radar`);
      break;
    case "epic":
      revalidatePath(`/projects/${projectSlug}/epics`);
      revalidatePath(`/projects/${projectSlug}/portfolio`);
      revalidatePath(`/projects/${projectSlug}/radar`);
      break;
    case "feature":
      revalidatePath(`/projects/${projectSlug}/features`);
      revalidatePath(`/projects/${projectSlug}/portfolio`);
      revalidatePath(`/projects/${projectSlug}/radar`);
      break;
    case "story":
      revalidatePath(`/projects/${projectSlug}/user-stories`);
      revalidatePath(`/projects/${projectSlug}/kanban`);
      break;
    case "task":
      revalidatePath(`/projects/${projectSlug}/kanban`);
      break;
  }
}

/**
 * Soft-delete cascade Why : Persona → tous les jobs enfants (Pain Points + JTBD).
 * Évite les orphelins logiques dans la Matrice Besoins.
 */
async function archivePersonaWhyChildren(
  projectId: string,
  personaId: string,
  archivedAt: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: children, error } = await supabase
    .from("sttns_work_items")
    .select("id")
    .eq("project_id", projectId)
    .eq("parent_id", personaId)
    .eq("type", "job")
    .is("archived_at", null);

  if (error) {
    return { ok: false, error: error.message };
  }

  for (const child of children ?? []) {
    const current = await getWorkItem(child.id);
    if (!current.ok) return current;
    if (!current.item || current.item.archived_at) continue;

    const result = await saveWorkItem(
      buildSaveInputFromStored(current.item, {
        archived_at: archivedAt,
      })
    );
    if (!result.ok) return result;
  }

  return { ok: true };
}

/** Soft delete Spine — pose archived_at (pas de statut workflow « archived »). */
export async function archiveWorkItemAction(
  workItemId: string,
  projectSlug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await getWorkItem(workItemId);
  if (!current.ok) return current;
  if (!current.item) {
    return { ok: false, error: "Élément introuvable." };
  }
  if (current.item.archived_at) {
    return { ok: false, error: "Cet élément est déjà archivé." };
  }

  const access = await requireProjectMember(current.item.project_id);
  if (!access.ok) return access;

  const archivedAt = new Date().toISOString();

  if (current.item.type === "persona") {
    const cascade = await archivePersonaWhyChildren(
      current.item.project_id,
      current.item.id,
      archivedAt
    );
    if (!cascade.ok) return cascade;
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, {
      archived_at: archivedAt,
    })
  );

  if (!result.ok) return result;

  revalidateArchivedItem(projectSlug, current.item.type);
  return { ok: true };
}
