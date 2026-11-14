"use server";

import { revalidatePath } from "next/cache";
import {
  buildSaveInputFromStored,
  getWorkItem,
  saveWorkItem,
  type StoredWorkItem,
} from "@/lib/sttns/workItems";
import { requireProjectMember } from "@/lib/sttns/access";
import type { EpicMetadata, EpicSaveData, SaveWorkItemResult } from "@/lib/sttns/types";
import { parseMetadataDocUrlInput, readMetadataDocUrl } from "@/lib/sttns/workItemMetadata";

function revalidateEpicPaths(projectSlug: string, epicId?: string) {
  revalidatePath(`/projects/${projectSlug}/epics`);
  if (epicId) revalidatePath(`/projects/${projectSlug}/epics/${epicId}`);
  revalidatePath(`/projects/${projectSlug}/portfolio`);
  revalidatePath(`/projects/${projectSlug}/spine`);
  revalidatePath(`/projects/${projectSlug}/user-stories`);
  revalidatePath(`/projects/${projectSlug}/user-stories/new`);
  revalidatePath(`/projects/${projectSlug}/summary`);
  revalidatePath(`/projects/${projectSlug}/agile`);
}

export async function saveEpicAction(
  projectId: string,
  projectSlug: string,
  data: EpicSaveData
): Promise<SaveWorkItemResult> {
  // P0.3 — Miroir saveInitiativeAction / saveUserStoryAction : garde d'accès obligatoire.
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  let existingEpic: Extract<StoredWorkItem, { type: "epic" }> | null = null;
  let existingMetadata: EpicMetadata = {};

  if (data.id) {
    const current = await getWorkItem(data.id);
    if (!current.ok) return current;
    if (!current.item || current.item.type !== "epic") {
      return { ok: false, error: "Epic introuvable." };
    }
    if (current.item.project_id !== projectId) {
      return { ok: false, error: "Epic hors projet." };
    }
    existingEpic = current.item;
    existingMetadata = current.item.metadata;
  }

  const docParsed =
    data.doc_url !== undefined
      ? parseMetadataDocUrlInput(data.doc_url)
      : { ok: true as const, url: readMetadataDocUrl(existingMetadata) };
  if (!docParsed.ok) return { ok: false, error: docParsed.error };

  // P0.1 — UPDATE ne doit jamais écraser status / priority / sort_order / assignee
  // silencieusement. On préserve l'existant sauf override explicite du caller.
  const result = await saveWorkItem({
    project_id: projectId,
    type: "epic",
    parent_id: null,
    status: data.status ?? existingEpic?.status ?? "todo",
    assignee_id:
      data.assignee_id !== undefined
        ? data.assignee_id
        : existingEpic?.assignee_id ?? null,
    priority: data.priority ?? existingEpic?.priority ?? 3,
    title: data.title,
    code: existingEpic?.code ?? null,
    sort_order: data.sort_order ?? existingEpic?.sort_order ?? 0,
    archived_at:
      data.archived_at !== undefined
        ? data.archived_at
        : existingEpic?.archived_at ?? null,
    context_links: data.context_links ?? existingEpic?.context_links,
    id: data.id,
    metadata: {
      ...existingMetadata,
      description:
        data.description !== undefined
          ? data.description.trim() || undefined
          : existingMetadata.description,
      doc_url: docParsed.url,
      persona_id: data.persona_id ?? existingMetadata.persona_id,
    },
  });
  if (result.ok) revalidateEpicPaths(projectSlug, result.id ?? data.id);
  return result;
}

export async function markEpicReadyAction(
  projectId: string,
  projectSlug: string,
  epicId: string
) {
  const current = await getWorkItem(epicId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "epic") {
    return { ok: false, error: "Epic introuvable." };
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, { status: "review" })
  );
  if (result.ok) revalidateEpicPaths(projectSlug, epicId);
  return result;
}

export async function archiveEpicAction(epicId: string, projectId: string, projectSlug: string) {
  const current = await getWorkItem(epicId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "epic") {
    return { ok: false, error: "Epic introuvable." };
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, {
      archived_at: new Date().toISOString(),
    })
  );
  if (result.ok) revalidateEpicPaths(projectSlug, epicId);
  return result;
}

export async function deleteEpicAction(
  epicId: string,
  projectId: string,
  projectSlug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const current = await getWorkItem(epicId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "epic") {
    return { ok: false, error: "Epic introuvable." };
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, {
      archived_at: new Date().toISOString(),
    })
  );
  if (result.ok) revalidateEpicPaths(projectSlug);
  return result;
}

export async function renameEpicAction(
  epicId: string,
  projectId: string,
  projectSlug: string,
  newTitle: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const current = await getWorkItem(epicId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "epic") {
    return { ok: false, error: "Epic introuvable." };
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, { title: newTitle })
  );
  if (result.ok) revalidateEpicPaths(projectSlug, epicId);
  return result;
}
