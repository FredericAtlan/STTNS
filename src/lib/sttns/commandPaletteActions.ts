"use server";

import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { fetchSpineEpics, fetchJtbdOptions } from "@/lib/sttns/featuresSpine";
import {
  fetchStoryFeatureOptions,
  fetchStoryCycleOptions,
} from "@/lib/sttns/storiesSpine";
import { toWhyPainPointOptions } from "@/lib/sttns/whySpine";
import type { CommandPaletteContext } from "@/lib/sttns/types";

export async function fetchCommandPaletteContext(
  projectSlug: string
): Promise<{ ok: true; data: CommandPaletteContext } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const project = await getProjectBySlug(projectSlug);
    const workflow = parseProjectWorkflowSettings(project.settings);

    const [personasRes, jobsRes, epics, jtbdOptions, featureOptions, cycleOptions] =
      await Promise.all([
        supabase
          .from("sttns_work_items")
          .select("id, title, code")
          .eq("project_id", project.id)
          .eq("type", "persona")
          .is("archived_at", null)
          .order("sort_order", { ascending: true }),
        supabase
          .from("sttns_work_items")
          .select("id, title, parent_id, metadata")
          .eq("project_id", project.id)
          .eq("type", "job")
          .is("archived_at", null),
        fetchSpineEpics(supabase, project.id),
        fetchJtbdOptions(supabase, project.id),
        fetchStoryFeatureOptions(supabase, project.id),
        fetchStoryCycleOptions(supabase, project.id),
      ]);

    if (personasRes.error) {
      return { ok: false, error: personasRes.error.message };
    }
    if (jobsRes.error) {
      return { ok: false, error: jobsRes.error.message };
    }

    const painPoints = toWhyPainPointOptions(jobsRes.data ?? []).map((pp) => ({
      id: pp.id,
      title: pp.label,
      severity: pp.severity,
      persona_id: pp.persona_id,
    }));

    return {
      ok: true,
      data: {
        projectId: project.id,
        executionUnit: workflow.executionUnit,
        epicEqualsCycle: workflow.epicEqualsCycle,
        personas:
          personasRes.data?.map((p) => ({
            id: p.id,
            title: p.title,
            code: p.code,
          })) ?? [],
        painPoints,
        epics: epics.map((e) => ({ id: e.id, title: e.title })),
        jtbdOptions,
        featureOptions,
        cycleOptions,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Impossible de charger le contexte projet.",
    };
  }
}
