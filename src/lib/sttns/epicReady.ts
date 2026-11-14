import type { SupabaseClient } from "@supabase/supabase-js";
import { computeEpicDoR, epicDoRFromRecord } from "@/lib/epics/epicHealth";
import {
  type EpicFormStoryRow,
  EPIC_FORM_STORY_SELECT,
} from "@/lib/epics/epicStoryPicker";
import type { SttnsUserStory, SttnsUserStoryStatus } from "@/types/sttns";

export const EPIC_READY_STORY_STATUSES: SttnsUserStoryStatus[] = [
  "validated",
  "in_sprint",
  "delivered",
];

export const EPIC_READY_BLOCKED_MESSAGE =
  "Impossible : nom, définition et au moins une user story rattachée sont requis (DoR Epic).";

export const EPIC_READY_TOOLTIP =
  "Nom, définition et ≥ 1 user story rattachée. Personas et impact sont hérités des stories.";

export function isStoryReadyForEpic(status: SttnsUserStoryStatus): boolean {
  return EPIC_READY_STORY_STATUSES.includes(status);
}

export function epicMeetsDefinitionOfReady(
  stories: Pick<SttnsUserStory, "status">[]
): boolean {
  return stories.length > 0;
}

export async function fetchEpicLinkedStories(
  supabase: SupabaseClient,
  projectId: string,
  epicId: string
): Promise<SttnsUserStory[]> {
  const { data } = await supabase
    .from("sttns_user_stories")
    .select(
      "id, title, context_label, status, review_status, final_decision, epic_id, sprint_want, notes"
    )
    .eq("project_id", projectId)
    .eq("epic_id", epicId)
    .is("archived_at", null)
    .order("sort_order");

  return (data ?? []) as SttnsUserStory[];
}

export async function fetchOrphanStoriesForEpicForm(
  supabase: SupabaseClient,
  projectId: string,
  epicId?: string
): Promise<EpicFormStoryRow[]> {
  let query = supabase
    .from("sttns_user_stories")
    .select(EPIC_FORM_STORY_SELECT)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("sort_order");

  if (epicId) {
    query = query.or(`epic_id.is.null,epic_id.eq.${epicId}`);
  } else {
    query = query.is("epic_id", null);
  }

  const { data } = await query;
  return (data ?? []) as unknown as EpicFormStoryRow[];
}

export async function assertEpicDefinitionOfReady(
  supabase: SupabaseClient,
  projectId: string,
  epicId: string,
  linkedStoryCountOverride?: number,
  titleOverride?: string,
  objectiveOverride?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: epic } = await supabase
    .from("sttns_epics")
    .select("title, objective")
    .eq("id", epicId)
    .eq("project_id", projectId)
    .single();

  if (!epic) return { ok: false, error: "Epic introuvable." };

  let linkedCount = linkedStoryCountOverride;
  if (linkedCount == null) {
    const stories = await fetchEpicLinkedStories(supabase, projectId, epicId);
    linkedCount = stories.length;
  }

  const dor = epicDoRFromRecord(
    {
      title: titleOverride ?? epic.title,
      objective: objectiveOverride ?? epic.objective,
    },
    linkedCount
  );
  if (!dor.readyForProposed) {
    return { ok: false, error: EPIC_READY_BLOCKED_MESSAGE };
  }

  return { ok: true };
}

export async function countReadyEpics(
  supabase: SupabaseClient,
  projectId: string
): Promise<number> {
  const { count } = await supabase
    .from("sttns_epics")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("status", "ready")
    .is("archived_at", null);

  return count ?? 0;
}

export { computeEpicDoR, epicDoRFromRecord };
