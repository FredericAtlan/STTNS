import type { SupabaseClient } from "@supabase/supabase-js";
import type { FibonacciEffort } from "@/lib/sttns/types";
import { readTaskNotionUrl } from "@/lib/sttns/schema";
import { readMetadataDescription } from "@/lib/sttns/workItemMetadata";
import { enrichCycleRow, isCycleAssignable } from "@/lib/sttns/cycles";
import {
  readComplexity,
  readEffortDays,
  sumActiveEffortDays,
  type ComplexityLevel,
  type EffortDays,
} from "@/lib/sttns/valueEffort";

/** @deprecated Remplacé par EFFORT_DAYS_OPTIONS (valueEffort). */
export const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13] as const;

export const STORY_STATUS_LABELS: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  review: "Revue",
  done: "Terminé",
};

export interface StoryFeatureOption {
  id: string;
  title: string;
  epicTitle?: string;
}

export interface StoryCycleOption {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  capacity_points: number;
}

/** DoR Spine binaire — prête pour le Kanban ou incomplète. */
export type SpineStoryHealth = {
  ready: boolean;
  label: string;
  tip: string;
};

export interface SpineStoryListItem {
  id: string;
  title: string;
  code: string | null;
  status: string;
  description: string | null;
  /** Jours d'effort (metadata.effort_days). */
  effortDays: number;
  complexity: ComplexityLevel | null;
  /** @deprecated Alias de effortDays pour rétrocompat UI. */
  effortPoints: number;
  cycleId: string | null;
  cycleName: string | null;
  assigneeId: string | null;
  featureId: string | null;
  featureTitle: string;
  epicTitle: string;
  epicId: string | null;
  hasFeature: boolean;
  hasEpic: boolean;
  hasValidEffort: boolean;
  health: SpineStoryHealth;
  tasks: SpineStoryTaskPreview[];
}

export type SpineStoryTaskPreview = {
  id: string;
  title: string;
  done: boolean;
  assignee_id: string | null;
  notion_url: string | null;
};

export type ExecutionBacklogMetrics = {
  totalStories: number;
  totalActiveEffort: number;
  orphanStories: number;
  unestimatedStories: number;
};

export function isFibonacciEffort(value: number): value is FibonacciEffort {
  return (FIBONACCI_POINTS as readonly number[]).includes(value);
}

export function computeSpineStoryHealth(input: {
  hasFeature: boolean;
  hasValidEffort: boolean;
}): SpineStoryHealth {
  if (input.hasFeature && input.hasValidEffort) {
    return {
      ready: true,
      label: "Prête",
      tip: "Feature parente, jours d'effort et Risque — prête pour le Kanban.",
    };
  }

  const gaps: string[] = [];
  if (!input.hasFeature) gaps.push("Feature parente manquante");
  if (!input.hasValidEffort) gaps.push("Jours / Risque manquants");

  return {
    ready: false,
    label: "Incomplète",
    tip: gaps.join(" · "),
  };
}

export function computeExecutionBacklogMetrics(
  stories: SpineStoryListItem[]
): ExecutionBacklogMetrics {
  return {
    totalStories: stories.length,
    totalActiveEffort: sumActiveEffortDays(stories),
    orphanStories: stories.filter((s) => !s.hasFeature).length,
    unestimatedStories: stories.filter((s) => !s.hasValidEffort).length,
  };
}

export async function fetchStoryFeatureOptions(
  supabase: SupabaseClient,
  projectId: string
): Promise<StoryFeatureOption[]> {
  const { data: features } = await supabase
    .from("sttns_work_items")
    .select("id, title, parent_id")
    .eq("project_id", projectId)
    .eq("type", "feature")
    .is("archived_at", null)
    .order("title", { ascending: true });

  const { data: epics } = await supabase
    .from("sttns_work_items")
    .select("id, title")
    .eq("project_id", projectId)
    .eq("type", "epic")
    .is("archived_at", null);

  const epicMap = Object.fromEntries(epics?.map((e) => [e.id, e.title]) ?? []);

  return (
    features?.map((f) => ({
      id: f.id,
      title: f.title,
      epicTitle: f.parent_id ? epicMap[f.parent_id] ?? undefined : undefined,
    })) ?? []
  );
}

export async function fetchStoryCycleOptions(
  supabase: SupabaseClient,
  projectId: string
): Promise<StoryCycleOption[]> {
  const { data: cycles } = await supabase
    .from("sttns_cycles")
    .select("id, name, start_date, end_date, is_active, capacity_points")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .order("start_date", { ascending: true });

  return (cycles ?? [])
    .map((c) =>
      enrichCycleRow({
        id: c.id,
        name: c.name,
        start_date: c.start_date,
        end_date: c.end_date,
        is_active: c.is_active ?? false,
        capacity_points: c.capacity_points ?? 0,
      })
    )
    .filter(isCycleAssignable)
    .map((c) => ({
      id: c.id,
      name: c.name,
      start_date: c.start_date,
      end_date: c.end_date,
      capacity_points: c.capacity_points ?? 0,
    }));
}

export async function fetchSpineStories(
  supabase: SupabaseClient,
  projectId: string
): Promise<SpineStoryListItem[]> {
  const { data: stories } = await supabase
    .from("sttns_work_items")
    .select("id, title, code, status, parent_id, effort_points, cycle_id, metadata, assignee_id")
    .eq("project_id", projectId)
    .eq("type", "story")
    .is("archived_at", null)
    .order("sort_order")
    .order("created_at", { ascending: false });

  if (!stories?.length) return [];

  const featureIds = Array.from(
    new Set(stories.map((s) => s.parent_id).filter(Boolean) as string[])
  );

  const { data: features } =
    featureIds.length > 0
      ? await supabase
          .from("sttns_work_items")
          .select("id, title, parent_id")
          .eq("project_id", projectId)
          .eq("type", "feature")
          .in("id", featureIds)
      : { data: [] };

  const featureMap = Object.fromEntries(
    (features ?? []).map((f) => [f.id, { title: f.title, epicId: f.parent_id }])
  );

  const epicIds = Array.from(
    new Set((features ?? []).map((f) => f.parent_id).filter(Boolean) as string[])
  );

  const { data: epics } =
    epicIds.length > 0
      ? await supabase
          .from("sttns_work_items")
          .select("id, title")
          .eq("project_id", projectId)
          .eq("type", "epic")
          .in("id", epicIds)
      : { data: [] };

  const epicMap = Object.fromEntries(epics?.map((e) => [e.id, e.title]) ?? []);

  const cycleIds = Array.from(
    new Set(stories.map((s) => s.cycle_id).filter(Boolean) as string[])
  );

  const { data: cycles } =
    cycleIds.length > 0
      ? await supabase
          .from("sttns_cycles")
          .select("id, name")
          .eq("project_id", projectId)
          .in("id", cycleIds)
      : { data: [] };

  const cycleMap = Object.fromEntries(cycles?.map((c) => [c.id, c.name]) ?? []);

  const storyIds = stories.map((s) => s.id);
  const { data: taskRows } =
    storyIds.length > 0
      ? await supabase
          .from("sttns_work_items")
          .select("id, title, status, assignee_id, metadata, parent_id")
          .in("parent_id", storyIds)
          .eq("type", "task")
          .is("archived_at", null)
          .order("created_at", { ascending: true })
      : { data: [] };

  const tasksByStory = new Map<string, SpineStoryTaskPreview[]>();
  for (const row of taskRows ?? []) {
    if (!row.parent_id) continue;
    const preview: SpineStoryTaskPreview = {
      id: row.id,
      title: row.title,
      done: row.status === "done",
      assignee_id: row.assignee_id ?? null,
      notion_url: readTaskNotionUrl(row.metadata),
    };
    const list = tasksByStory.get(row.parent_id) ?? [];
    list.push(preview);
    tasksByStory.set(row.parent_id, list);
  }

  return stories.map((story) => {
    const featureInfo = story.parent_id ? featureMap[story.parent_id] : null;
    const epicId = featureInfo?.epicId ?? null;
    const epicTitle = epicId ? epicMap[epicId] ?? "Epic inconnu" : "Sans Epic";
    const hasFeature = !!story.parent_id;
    const hasEpic = !!epicId;
    const effortDays = readEffortDays(story.metadata);
    const complexity = readComplexity(story.metadata);
    const hasValidEffort = effortDays != null && complexity != null;

    return {
      id: story.id,
      title: story.title,
      code: story.code,
      status: story.status,
      description: readMetadataDescription(story.metadata),
      effortDays: effortDays ?? 0,
      complexity,
      effortPoints: effortDays ?? 0,
      cycleId: story.cycle_id,
      cycleName: story.cycle_id ? cycleMap[story.cycle_id] ?? null : null,
      assigneeId: story.assignee_id ?? null,
      featureId: story.parent_id,
      featureTitle: featureInfo?.title ?? "Sans Feature",
      epicTitle,
      epicId,
      hasFeature,
      hasEpic,
      hasValidEffort,
      health: computeSpineStoryHealth({ hasFeature, hasValidEffort }),
      tasks: tasksByStory.get(story.id) ?? [],
    };
  });
}

export type StoryTaskRow = {
  id: string;
  title: string;
  status: string;
  done: boolean;
  assignee_id: string | null;
  notion_url: string | null;
};

export async function fetchStoryTasks(
  supabase: SupabaseClient,
  storyId: string
): Promise<StoryTaskRow[]> {
  const { data, error } = await supabase
    .from("sttns_work_items")
    .select("id, title, status, assignee_id, metadata")
    .eq("parent_id", storyId)
    .eq("type", "task")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    done: row.status === "done",
    assignee_id: row.assignee_id ?? null,
    notion_url: readTaskNotionUrl(row.metadata),
  }));
}
