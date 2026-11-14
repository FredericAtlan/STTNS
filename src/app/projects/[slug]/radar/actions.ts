"use server";

import { revalidatePath } from "next/cache";
import { saveWorkItem, getWorkItem, buildSaveInputFromStored } from "@/lib/sttns/workItems";
import type { ArchiveReason } from "@/lib/sttns/postMortem";

interface ArchiveWithReasonInput {
  workItemId: string;
  projectId: string;
  projectSlug: string;
  reason: ArchiveReason;
  reasonDetails?: string;
  archivedBy: string;
}

export async function archiveWithPostMortemAction({
  workItemId,
  projectId,
  projectSlug,
  reason,
  reasonDetails,
  archivedBy,
}: ArchiveWithReasonInput) {
  void projectId;
  const current = await getWorkItem(workItemId);
  if (!current.ok) return current;
  if (!current.item) return { ok: false, error: "Work item introuvable." };

  const archivedAt = new Date().toISOString();
  const archiveMeta = {
    archived_reason: reason,
    archived_reason_details: reasonDetails || null,
    archived_at: archivedAt,
    archived_by: archivedBy,
  };

  // Types dont le metadata Zod supporte les champs archived_* (voir schema.ts).
  const supportsPostMortemMetadata =
    current.item.type === "epic" ||
    current.item.type === "feature" ||
    current.item.type === "story";

  const result = supportsPostMortemMetadata
    ? await saveWorkItem(
        buildSaveInputFromStored(current.item, {
          archived_at: archivedAt,
          metadata: { ...current.item.metadata, ...archiveMeta },
        })
      )
    : await saveWorkItem(
        buildSaveInputFromStored(current.item, { archived_at: archivedAt })
      );

  if (result.ok) {
    revalidatePath(`/projects/${projectSlug}/radar`);
    revalidatePath(`/projects/${projectSlug}/portfolio`);
    revalidatePath(`/projects/${projectSlug}/kanban`);
    revalidatePath(`/projects/${projectSlug}/post-mortem`);
  }

  return result;
}

export async function fetchPostMortemLogs(projectId: string) {
  const supabase = await import("@/lib/supabase/server").then((m) =>
    m.createClient()
  );

  const { data, error } = await supabase
    .from("sttns_work_items")
    .select("id, title, type, metadata, archived_at, rice_score")
    .eq("project_id", projectId)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  if (error) {
    return { ok: false, error: error.message };
  }

  const logs =
    data
      ?.filter((item) => {
        const meta = (item.metadata ?? {}) as Record<string, unknown>;
        return meta.archived_reason && meta.archived_by;
      })
      .map((item) => {
        const meta = (item.metadata ?? {}) as Record<string, unknown>;
        return {
          id: item.id,
          title: item.title,
          type: item.type,
          archivedAt: item.archived_at,
          reason: meta.archived_reason as ArchiveReason,
          reasonDetails: (meta.archived_reason_details as string | null) ?? null,
          archivedBy: meta.archived_by as string,
          riceScore: item.rice_score ?? 0,
        };
      }) || [];

  return { ok: true, logs };
}
