"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectEditor, requireProjectMember, getProjectSquadRole } from "@/lib/sttns/access";
import {
  buildSaveInputFromStored,
  getWorkItem,
  readMetadataDescription,
  saveWorkItem,
  type StoredWorkItem,
} from "@/lib/sttns/workItems";
import {
  parseMetadataDocUrlInput,
  readMetadataDocUrl,
} from "@/lib/sttns/workItemMetadata";
import { fetchProjectMembersGrouped, type ProjectMemberRow } from "@/lib/sttns/projectMembers";
import {
  fetchStoryTasks,
  type StoryTaskRow,
} from "@/lib/sttns/storiesSpine";
import { taskMetadataSchema } from "@/lib/sttns/schema";
import type { SaveUserStoryInput, TaskMetadata } from "@/lib/sttns/types";
import { isComplexity, isEffortDays } from "@/lib/sttns/valueEffort";

export type StoryTaskProjectMember = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

function mapProjectMembers(rows: ProjectMemberRow[]): StoryTaskProjectMember[] {
  return rows.map((row) => ({
    user_id: row.user_id,
    full_name: row.profile.full_name,
    email: row.profile.email,
    avatar_url: row.profile.avatar_url,
  }));
}

export async function fetchProjectMembersForTasksAction(
  projectId: string
): Promise<
  | { ok: true; members: StoryTaskProjectMember[]; readOnly: boolean }
  | { ok: false; error: string }
> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const squad = await getProjectSquadRole(projectId, access.userId);
  const members = mapProjectMembers(await fetchProjectMembersGrouped(projectId));

  return {
    ok: true,
    members,
    readOnly: squad === "viewer",
  };
}

function revalidateStoryPaths(projectSlug: string, storyId?: string) {
  revalidatePath(`/projects/${projectSlug}/user-stories`);
  revalidatePath(`/projects/${projectSlug}/user-stories/new`);
  revalidatePath(`/projects/${projectSlug}/kanban`);
  revalidatePath(`/projects/${projectSlug}/radar`);
  revalidatePath(`/projects/${projectSlug}/spine`);
  if (storyId) {
    revalidatePath(`/projects/${projectSlug}/user-stories/${storyId}`);
  }
}

function assertStory(item: StoredWorkItem | null): item is Extract<StoredWorkItem, { type: "story" }> {
  return item !== null && item.type === "story";
}

async function persistStory(projectId: string, data: SaveUserStoryInput) {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  if (!data.feature_id?.trim()) {
    return { ok: false as const, error: "Une story doit être rattachée à une feature." };
  }

  if (!isEffortDays(data.effort_days) || !isComplexity(data.complexity)) {
    return {
      ok: false as const,
      error: "Effort (0.5–5j) et Risque (1–3) sont obligatoires.",
    };
  }

  let existingItem: Extract<StoredWorkItem, { type: "story" }> | null = null;
  if (data.id) {
    const current = await getWorkItem(data.id);
    if (!current.ok) return current;
    if (!assertStory(current.item)) {
      return { ok: false as const, error: "Story introuvable." };
    }
    existingItem = current.item;
  }

  const nextStatus = data.status ?? existingItem?.status ?? "todo";

  if (data.status && data.status !== existingItem?.status) {
    const editor = await requireProjectEditor(projectId);
    if (!editor.ok) return editor;
  }

  const docParsed =
    data.doc_url !== undefined
      ? parseMetadataDocUrlInput(data.doc_url)
      : { ok: true as const, url: readMetadataDocUrl(existingItem?.metadata) };
  if (!docParsed.ok) return { ok: false as const, error: docParsed.error };

  let nextAssigneeId = existingItem?.assignee_id ?? null;
  if (data.assignee_id !== undefined) {
    if (data.assignee_id) {
      const members = await fetchProjectMembersGrouped(projectId);
      if (!members.some((m) => m.user_id === data.assignee_id)) {
        return { ok: false as const, error: "Ce membre n'appartient pas au projet." };
      }
    }
    nextAssigneeId = data.assignee_id;
  }

  return saveWorkItem({
    id: data.id,
    project_id: projectId,
    type: "story",
    parent_id: data.feature_id,
    status: nextStatus,
    assignee_id: nextAssigneeId,
    priority: existingItem?.priority ?? 3,
    title: data.title.trim(),
    code: existingItem?.code ?? null,
    sort_order: existingItem?.sort_order ?? 0,
    archived_at: existingItem?.archived_at ?? null,
    context_links: existingItem?.context_links ?? [],
    cycle_id: data.cycle_id !== undefined ? data.cycle_id : (existingItem?.cycle_id ?? null),
    metadata: {
      ...(existingItem?.metadata ?? {}),
      description:
        data.description !== undefined
          ? data.description?.trim() || null
          : readMetadataDescription(existingItem?.metadata),
      doc_url: docParsed.url,
      effort_days: data.effort_days,
      complexity: data.complexity,
    },
  });
}

export async function saveUserStoryAction(
  projectId: string,
  projectSlug: string,
  data: SaveUserStoryInput
) {
  const result = await persistStory(projectId, data);
  if (result.ok) revalidateStoryPaths(projectSlug, result.id);
  return result;
}

export async function deleteUserStoryAction(
  storyId: string,
  projectId: string,
  projectSlug: string
) {
  const access = await requireProjectEditor(projectId);
  if (!access.ok) return access;

  const current = await getWorkItem(storyId);
  if (!current.ok) return current;
  if (!assertStory(current.item)) {
    return { ok: false, error: "Story introuvable." };
  }
  if (current.item.project_id !== projectId) {
    return { ok: false, error: "Story hors projet." };
  }
  if (current.item.archived_at) {
    return { ok: false, error: "Cette story est déjà archivée." };
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, {
      archived_at: new Date().toISOString(),
    })
  );
  if (result.ok) revalidateStoryPaths(projectSlug, storyId);
  return result;
}

export async function bulkArchiveUserStoriesAction(
  projectId: string,
  projectSlug: string,
  storyIds: string[]
): Promise<
  | { ok: true; archived: number; failed: number; errors: string[] }
  | { ok: false; error: string }
> {
  const access = await requireProjectEditor(projectId);
  if (!access.ok) return access;

  const uniqueIds = Array.from(new Set(storyIds.map((id) => id.trim()).filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { ok: false, error: "Sélectionnez au moins une story." };
  }

  const archivedAt = new Date().toISOString();
  let archived = 0;
  const errors: string[] = [];

  for (const storyId of uniqueIds) {
    const current = await getWorkItem(storyId);
    if (!current.ok) {
      errors.push(current.error);
      continue;
    }
    if (!assertStory(current.item)) {
      errors.push(`Story introuvable (${storyId.slice(0, 8)}…).`);
      continue;
    }
    if (current.item.project_id !== projectId) {
      errors.push(`Story hors projet : ${current.item.title}`);
      continue;
    }
    if (current.item.archived_at) {
      errors.push(`Déjà archivée : ${current.item.title}`);
      continue;
    }

    const result = await saveWorkItem(
      buildSaveInputFromStored(current.item, { archived_at: archivedAt })
    );
    if (result.ok) {
      archived += 1;
    } else {
      errors.push(`${current.item.title} : ${result.error}`);
    }
  }

  if (archived === 0) {
    return {
      ok: false,
      error: errors[0] ?? "Aucune story n'a pu être archivée.",
    };
  }

  revalidateStoryPaths(projectSlug);
  return { ok: true, archived, failed: uniqueIds.length - archived, errors };
}

export async function renameUserStoryAction(
  storyId: string,
  projectId: string,
  projectSlug: string,
  newTitle: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await getWorkItem(storyId);
  if (!current.ok) return current;
  if (!assertStory(current.item)) {
    return { ok: false, error: "Story introuvable." };
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, { title: newTitle.trim() })
  );
  if (result.ok) revalidateStoryPaths(projectSlug, storyId);
  return result;
}

export async function duplicateUserStoryAction(
  storyId: string,
  projectId: string,
  projectSlug: string
) {
  const current = await getWorkItem(storyId);
  if (!current.ok) return current;
  if (!assertStory(current.item)) {
    return { ok: false, error: "Story introuvable." };
  }

  const result = await saveWorkItem({
    project_id: projectId,
    type: "story",
    parent_id: current.item.parent_id,
    status: current.item.status,
    assignee_id: current.item.assignee_id,
    priority: current.item.priority,
    title: `${current.item.title} Copy`,
    code: current.item.code ? `${current.item.code}-copy` : null,
    sort_order: current.item.sort_order + 1,
    archived_at: null,
    context_links: current.item.context_links,
    cycle_id: current.item.cycle_id,
    metadata: current.item.metadata,
  });
  if (result.ok) revalidateStoryPaths(projectSlug, result.id);
  return result;
}

export async function saveAndSubmitUserStoryAction(
  projectId: string,
  projectSlug: string,
  data: SaveUserStoryInput
) {
  return saveUserStoryAction(projectId, projectSlug, data);
}

export async function saveStoryTaskAction(
  projectId: string,
  projectSlug: string,
  storyId: string,
  title: string
) {
  const access = await requireProjectEditor(projectId);
  if (!access.ok) return access;

  const trimmed = title.trim();
  if (!trimmed) {
    return { ok: false as const, error: "Le titre de la task est obligatoire." };
  }

  const story = await getWorkItem(storyId);
  if (!story.ok) return story;
  if (!assertStory(story.item)) {
    return { ok: false as const, error: "Story parente introuvable." };
  }

  const result = await saveWorkItem({
    project_id: projectId,
    type: "task",
    parent_id: storyId,
    title: trimmed,
    status: "todo",
    priority: 3,
    sort_order: 0,
    code: null,
    metadata: {},
  });

  if (result.ok) revalidateStoryPaths(projectSlug, storyId);
  return result;
}

export async function toggleStoryTaskAction(
  taskId: string,
  projectSlug: string,
  done: boolean
) {
  const current = await getWorkItem(taskId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "task") {
    return { ok: false as const, error: "Task introuvable." };
  }

  const access = await requireProjectEditor(current.item.project_id);
  if (!access.ok) return access;

  const storyId = current.item.parent_id ?? undefined;
  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, {
      status: done ? "done" : "todo",
    })
  );

  if (result.ok) revalidateStoryPaths(projectSlug, storyId);
  return result;
}

export async function updateStoryAssignmentAction(
  storyId: string,
  assigneeId: string | null,
  projectSlug: string
) {
  const current = await getWorkItem(storyId);
  if (!current.ok) return current;
  if (!assertStory(current.item)) {
    return { ok: false as const, error: "Story introuvable." };
  }

  const access = await requireProjectEditor(current.item.project_id);
  if (!access.ok) return access;

  if (assigneeId) {
    const members = await fetchProjectMembersGrouped(current.item.project_id);
    if (!members.some((m) => m.user_id === assigneeId)) {
      return { ok: false as const, error: "Ce membre n'appartient pas au projet." };
    }
  }

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, {
      assignee_id: assigneeId,
    })
  );

  if (result.ok) revalidateStoryPaths(projectSlug, storyId);
  return result;
}

export async function updateTaskAssignmentAction(
  taskId: string,
  assigneeId: string | null,
  projectSlug: string
) {
  const current = await getWorkItem(taskId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "task") {
    return { ok: false as const, error: "Task introuvable." };
  }

  const access = await requireProjectEditor(current.item.project_id);
  if (!access.ok) return access;

  if (assigneeId) {
    const members = await fetchProjectMembersGrouped(current.item.project_id);
    const isMember = members.some((m) => m.user_id === assigneeId);
    if (!isMember) {
      return { ok: false as const, error: "Ce membre n'appartient pas au projet." };
    }
  }

  const storyId = current.item.parent_id ?? undefined;
  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, {
      assignee_id: assigneeId,
    })
  );

  if (result.ok) revalidateStoryPaths(projectSlug, storyId);
  return result;
}

export async function updateTaskNotionUrlAction(
  taskId: string,
  notionUrl: string | null,
  projectSlug: string
) {
  const current = await getWorkItem(taskId);
  if (!current.ok) return current;
  if (!current.item || current.item.type !== "task") {
    return { ok: false as const, error: "Task introuvable." };
  }

  const access = await requireProjectEditor(current.item.project_id);
  if (!access.ok) return access;

  let normalizedUrl: string | null = null;
  if (notionUrl?.trim()) {
    const parsed = taskMetadataSchema.safeParse({ notion_url: notionUrl.trim() });
    if (!parsed.success) {
      return { ok: false as const, error: "URL Notion invalide." };
    }
    normalizedUrl = parsed.data.notion_url ?? null;
  }

  const storyId = current.item.parent_id ?? undefined;
  const metadata: TaskMetadata = {
    ...(current.item.metadata ?? {}),
    notion_url: normalizedUrl,
  };

  const result = await saveWorkItem(
    buildSaveInputFromStored(current.item, {
      metadata,
    })
  );

  if (result.ok) revalidateStoryPaths(projectSlug, storyId);
  return result;
}

export async function fetchStoryTasksAction(
  storyId: string
): Promise<{ ok: true; tasks: StoryTaskRow[] } | { ok: false; error: string }> {
  const current = await getWorkItem(storyId);
  if (!current.ok) return current;
  if (!assertStory(current.item)) {
    return { ok: false, error: "Story introuvable." };
  }

  const access = await requireProjectMember(current.item.project_id);
  if (!access.ok) return access;

  const supabase = await createClient();
  const tasks = await fetchStoryTasks(supabase, storyId);
  return { ok: true, tasks };
}
