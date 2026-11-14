import type { SupabaseClient } from "@supabase/supabase-js";
import { readMetadataDescription } from "@/lib/sttns/workItemMetadata";
import type { SttnsEpic, SttnsInitiative, SttnsUserStory } from "@/types/sttns";

/** Epic Spine V1.1 (sttns_work_items) — source de vérité produit. */
export type SpineEpicListItem = {
  id: string;
  title: string;
  status: string;
  description: string | null;
  code: string | null;
  rice_score: number | null;
};

export const EPIC_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  ready: "Prête",
  in_progress: "En cours",
  done: "Terminée",
};

export const EPIC_LIFECYCLE_ORDER = ["draft", "ready", "in_progress", "done"] as const;

export async function fetchProjectSpineEpics(
  supabase: SupabaseClient,
  projectId: string
): Promise<SpineEpicListItem[]> {
  const { data, error } = await supabase
    .from("sttns_work_items")
    .select("id, title, status, metadata, code, rice_score, sort_order")
    .eq("project_id", projectId)
    .eq("type", "epic")
    .is("archived_at", null)
    .order("sort_order")
    .order("title");

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    description: readMetadataDescription(row.metadata),
    code: row.code,
    rice_score: row.rice_score,
  }));
}

/** @deprecated Legacy sttns_epics — préférer fetchProjectSpineEpics (Spine V1.1). */
export async function fetchProjectEpics(
  supabase: SupabaseClient,
  projectId: string
): Promise<SttnsEpic[]> {
  const { data, error } = await supabase
    .from("sttns_epics")
    .select("*")
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("sort_order")
    .order("title");

  if (error || !data) return [];
  return data as SttnsEpic[];
}

export async function fetchEpicById(
  supabase: SupabaseClient,
  projectId: string,
  epicId: string
): Promise<SttnsEpic | null> {
  const { data, error } = await supabase
    .from("sttns_epics")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", epicId)
    .maybeSingle();

  if (error || !data) return null;
  return data as SttnsEpic;
}

export function epicLabel(epic?: Pick<SttnsEpic, "title" | "objective"> | null): string {
  if (!epic) return "No epic";
  return epic.objective?.trim() ? `${epic.title} · ${epic.objective}` : epic.title;
}

export function storyEpicLabel(
  story: Pick<SttnsUserStory, "epic_id">,
  epics: SttnsEpic[]
): string {
  const epic = epics.find((item) => item.id === story.epic_id);
  return epic ? epic.title : "Sans epic";
}

export function initiativeEpicLabel(
  initiative: Pick<SttnsInitiative, "epic_id">,
  epics: SttnsEpic[]
): string {
  const epic = epics.find((item) => item.id === initiative.epic_id);
  return epic ? epic.title : "Sans epic";
}

export function epicsFromInitiatives(
  initiatives: Pick<SttnsInitiative, "epic_id">[],
  epics: SttnsEpic[]
): SttnsEpic[] {
  const ids = new Set(initiatives.map((item) => item.epic_id).filter(Boolean) as string[]);
  return epics.filter((epic) => ids.has(epic.id));
}
