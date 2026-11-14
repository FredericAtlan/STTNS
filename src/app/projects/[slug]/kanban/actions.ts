"use server";

import { revalidatePath } from "next/cache";
import { saveWorkItem, getWorkItem, buildSaveInputFromStored } from "@/lib/sttns/workItems";

type WorkItemStatus = "todo" | "in_progress" | "review" | "done";

export async function updateWorkItemStatusAction(
  workItemId: string,
  projectSlug: string,
  newStatus: WorkItemStatus
) {
  const current = await getWorkItem(workItemId);
  if (!current.ok) return current;
  if (!current.item) return { ok: false, error: "Work item introuvable." };

  const validStatuses: WorkItemStatus[] = ["todo", "in_progress", "review", "done"];
  if (!validStatuses.includes(newStatus)) {
    return {
      ok: false,
      error: `Statut invalide. Utilisez: ${validStatuses.join(", ")}`,
    };
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, { status: newStatus })
  );

  if (result.ok) {
    revalidatePath(`/projects/${projectSlug}/kanban`);
    revalidatePath(`/projects/${projectSlug}/user-stories`);
    revalidatePath(`/projects/${projectSlug}/cycles`);
    revalidatePath(`/projects/${projectSlug}/spine`);
    revalidatePath(`/projects/${projectSlug}/mindmap`);
    revalidatePath(`/projects/${projectSlug}/portfolio`);
  }

  return result;
}
