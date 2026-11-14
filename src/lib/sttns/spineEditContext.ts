/**
 * Listes déroulantes pour slide-overs Spine (personas, epics, features, cycles…).
 * Distinct de `sttnsContext.ts` (tooltips UI).
 * Cartographie : README.md § Cartographie des fichiers de contexte
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchStoryCycleOptions,
  fetchStoryFeatureOptions,
  type StoryCycleOption,
  type StoryFeatureOption,
} from "@/lib/sttns/storiesSpine";
import { readEpicCycleId } from "@/lib/sttns/cycleEpicLink";
import { parsePainPointFields, splitWhyJobs } from "@/lib/sttns/whySpine";

export type SpineEditPersona = { id: string; title: string; code: string | null };
export type SpineEditPainPoint = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  persona_id: string;
};
export type SpineEditEpic = { id: string; title: string; cycle_id?: string | null };
export type SpineEditJtbdOption = { id: string; title: string; personaName: string };

export type SpineEditContext = {
  personas: SpineEditPersona[];
  painPoints: SpineEditPainPoint[];
  epics: SpineEditEpic[];
  jtbdOptions: SpineEditJtbdOption[];
  features: StoryFeatureOption[];
  cycles: StoryCycleOption[];
};

export async function fetchSpineEditContext(
  supabase: SupabaseClient,
  projectId: string
): Promise<SpineEditContext> {
  const [personasData, jobsData, features, cycles] = await Promise.all([
    supabase
      .from("sttns_work_items")
      .select("id, title, code")
      .eq("project_id", projectId)
      .eq("type", "persona")
      .is("archived_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("sttns_work_items")
      .select("id, title, parent_id, metadata")
      .eq("project_id", projectId)
      .eq("type", "job")
      .is("archived_at", null),
    fetchStoryFeatureOptions(supabase, projectId),
    fetchStoryCycleOptions(supabase, projectId),
  ]);

  const personas =
    personasData.data?.map((p) => ({
      id: p.id,
      title: p.title,
      code: p.code,
    })) ?? [];

  const personaNameMap = Object.fromEntries(personas.map((p) => [p.id, p.title]));

  const { painPoints: ppJobs, jtbds } = splitWhyJobs(jobsData.data ?? []);

  const painPoints: SpineEditPainPoint[] = ppJobs
    .map((j) => {
      const parsed = parsePainPointFields(j.title, j.metadata);
      return {
        id: j.id,
        title: parsed.label,
        severity: parsed.severity,
        persona_id: j.parent_id ?? "",
      };
    })
    .filter((pp) => pp.persona_id);

  const jtbdOptions: SpineEditJtbdOption[] = jtbds.map((j) => ({
    id: j.id,
    title: j.title,
    personaName: personaNameMap[j.parent_id ?? ""] ?? "Inconnu",
  }));

  const { data: epicsData } = await supabase
    .from("sttns_work_items")
    .select("id, title, metadata")
    .eq("project_id", projectId)
    .eq("type", "epic")
    .is("archived_at", null)
    .order("title", { ascending: true });

  return {
    personas,
    painPoints,
    epics:
      epicsData?.map((e) => ({
        id: e.id,
        title: e.title,
        cycle_id: readEpicCycleId(e.metadata),
      })) ?? [],
    jtbdOptions,
    features,
    cycles,
  };
}
