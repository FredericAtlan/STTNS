import { createClient } from "@/lib/supabase/server";
import { requireDraftAuthor, requireProjectMember } from "@/lib/sttns/access";
import {
  cachePrimaryPersonaId,
  computeEpicDerivedProfile,
  dominantImpactRoot,
} from "@/lib/epics/epicDerivedProfile";
import { computeEpicDoR } from "@/lib/epics/epicHealth";
import {
  EPIC_FORM_STORY_SELECT,
  type EpicFormStoryRow,
  mapStoriesToEpicPickerRows,
} from "@/lib/epics/epicStoryPicker";
import {
  assertEpicDefinitionOfReady,
  EPIC_READY_BLOCKED_MESSAGE,
} from "@/lib/sttns/epicReady";
import type { SttnsEpicStatus, SttnsProjectMetric } from "@/types/sttns";

export type SaveEpicInput = {
  id?: string;
  title: string;
  objective: string;
  status?: SttnsEpicStatus;
  sort_order?: number;
  linked_story_ids?: string[];
};

async function syncEpicStoryLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  epicId: string,
  selectedIds: string[]
) {
  const { data: currentlyLinked } = await supabase
    .from("sttns_user_stories")
    .select("id")
    .eq("project_id", projectId)
    .eq("epic_id", epicId)
    .is("archived_at", null);

  const currentIds = (currentlyLinked ?? []).map((row) => row.id);
  const toUnlink = currentIds.filter((id) => !selectedIds.includes(id));

  if (toUnlink.length) {
    await supabase
      .from("sttns_user_stories")
      .update({ epic_id: null })
      .eq("project_id", projectId)
      .in("id", toUnlink);
  }

  if (selectedIds.length) {
    await supabase
      .from("sttns_user_stories")
      .update({ epic_id: epicId })
      .eq("project_id", projectId)
      .in("id", selectedIds)
      .is("archived_at", null);
  }
}

async function loadDerivedCache(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  linkedStoryIds: string[]
) {
  if (!linkedStoryIds.length) {
    return {
      primary_persona_id: null,
      target_tier_codes: [] as string[],
      impact_metric_root: null,
    };
  }

  const [{ data: stories }, { data: metrics }] = await Promise.all([
    supabase
      .from("sttns_user_stories")
      .select(EPIC_FORM_STORY_SELECT)
      .eq("project_id", projectId)
      .in("id", linkedStoryIds)
      .is("archived_at", null),
    supabase
      .from("sttns_project_metrics")
      .select("id, parent_id, legacy_key, name")
      .eq("project_id", projectId),
  ]);

  const pickerRows = mapStoriesToEpicPickerRows(
    (stories ?? []) as unknown as EpicFormStoryRow[],
    (metrics ?? []) as Pick<SttnsProjectMetric, "id" | "parent_id" | "legacy_key" | "name">[]
  );
  const profile = computeEpicDerivedProfile(pickerRows, linkedStoryIds);

  return {
    primary_persona_id: cachePrimaryPersonaId(profile),
    target_tier_codes: profile.tierCodes,
    impact_metric_root: dominantImpactRoot(profile),
  };
}

export async function saveEpic(
  projectId: string,
  data: SaveEpicInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const title = data.title.trim();
  const objective = data.objective.trim();
  if (!title) return { ok: false, error: "Le titre de l'Epic est obligatoire." };

  const linkedStoryIds = data.linked_story_ids ?? [];
  const derivedCache = await loadDerivedCache(supabase, projectId, linkedStoryIds);

  const payload = {
    project_id: projectId,
    title,
    objective: objective || null,
    primary_persona_id: derivedCache.primary_persona_id,
    target_tier_codes: derivedCache.target_tier_codes,
    impact_metric_root: derivedCache.impact_metric_root,
    success_kpi_target: null,
    delivery_horizon: null,
  };

  if (data.id) {
    const author = await requireDraftAuthor(projectId, "epic", data.id);
    if (!author.ok) return author;

    const { data: current } = await supabase
      .from("sttns_epics")
      .select("status")
      .eq("id", data.id)
      .eq("project_id", projectId)
      .single();

    const currentStatus = (current?.status ?? "draft") as SttnsEpicStatus;
    let nextStatus = data.status ?? currentStatus;

    if (nextStatus === "ready" || nextStatus === "in_progress") {
      const dor = computeEpicDoR({
        title,
        objective,
        linkedStoryCount: linkedStoryIds.length,
      });
      if (!dor.readyForProposed) {
        return {
          ok: false,
          error: `Definition of Ready incomplète : ${dor.gaps.join(", ")}.`,
        };
      }
    }

    if (nextStatus === "ready" && currentStatus !== "ready") {
      const dorAssert = await assertEpicDefinitionOfReady(
        supabase,
        projectId,
        data.id,
        linkedStoryIds.length,
        title,
        objective
      );
      if (!dorAssert.ok) return dorAssert;
    }

    if (currentStatus === "draft" && nextStatus !== "draft" && nextStatus !== "ready") {
      if (nextStatus === "in_progress") {
        const dorAssert = await assertEpicDefinitionOfReady(
          supabase,
          projectId,
          data.id,
          linkedStoryIds.length,
          title,
          objective
        );
        if (!dorAssert.ok) return dorAssert;
      } else {
        return { ok: false, error: EPIC_READY_BLOCKED_MESSAGE };
      }
    }

    const { error } = await supabase
      .from("sttns_epics")
      .update({ ...payload, status: nextStatus })
      .eq("id", data.id)
      .eq("project_id", projectId);
    if (error) return { ok: false, error: error.message };

    await syncEpicStoryLinks(supabase, projectId, data.id, linkedStoryIds);
    return { ok: true, id: data.id };
  }

  const initialStatus = data.status ?? "draft";
  if (initialStatus !== "draft") {
    const dor = computeEpicDoR({
      title,
      objective,
      linkedStoryCount: linkedStoryIds.length,
    });
    if (!dor.readyForProposed) {
      return {
        ok: false,
        error: `Definition of Ready incomplète : ${dor.gaps.join(", ")}.`,
      };
    }
  }

  const { data: inserted, error } = await supabase
    .from("sttns_epics")
    .insert({
      ...payload,
      status: initialStatus,
      sort_order: data.sort_order ?? 0,
      created_by: access.userId,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Échec de création de l'Epic." };
  }

  if (linkedStoryIds.length) {
    await syncEpicStoryLinks(supabase, projectId, inserted.id, linkedStoryIds);
  }

  return { ok: true, id: inserted.id };
}

export async function markEpicReady(
  projectId: string,
  epicId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const author = await requireDraftAuthor(projectId, "epic", epicId);
  if (!author.ok) return author;

  const supabase = await createClient();
  const { data: epic } = await supabase
    .from("sttns_epics")
    .select("status, title, objective")
    .eq("id", epicId)
    .eq("project_id", projectId)
    .single();

  if (!epic) return { ok: false, error: "Epic introuvable." };
  if (epic.status !== "draft") {
    return { ok: false, error: "Seules les Epics en brouillon peuvent être marquées Prêtes." };
  }

  const dor = await assertEpicDefinitionOfReady(supabase, projectId, epicId);
  if (!dor.ok) return dor;

  const { error } = await supabase
    .from("sttns_epics")
    .update({ status: "ready" })
    .eq("id", epicId)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function archiveEpic(
  epicId: string,
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const author = await requireDraftAuthor(projectId, "epic", epicId);
  if (!author.ok) return author;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_epics")
    .update({
      archived_at: new Date().toISOString(),
    })
    .eq("id", epicId)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
