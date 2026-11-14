import { resolveStoryImpactCategory } from "@/lib/userStories/userStoryHealth";
import type { EpicStoryPickRow } from "@/components/epics/EpicOrphanStoriesPicker";
import type { SttnsProjectMetric } from "@/types/sttns";

/** Embed PostgREST après A1 (FK → sttns_work_items). */
export type EpicFormStoryPersonaEmbed = {
  title: string;
  code: string | null;
  metadata: { segment?: string | null } | null;
};

export type EpicFormStoryJobEmbed = {
  title: string;
  code: string | null;
  metadata: Record<string, unknown> | null;
};

export type EpicFormStoryRow = {
  id: string;
  title: string;
  context_label: string | null;
  epic_id: string | null;
  notes: string | null;
  impacts_north_star: boolean;
  impact_metric_id: string | null;
  primary_persona_id: string | null;
  primary_persona: EpicFormStoryPersonaEmbed | null;
  target_job: EpicFormStoryJobEmbed | null;
};

export function mapStoriesToEpicPickerRows(
  stories: EpicFormStoryRow[],
  metrics: Pick<SttnsProjectMetric, "id" | "parent_id" | "legacy_key" | "name">[]
): EpicStoryPickRow[] {
  const byId = Object.fromEntries(metrics.map((m) => [m.id, m]));

  return stories.map((story) => ({
    id: story.id,
    title: story.title,
    contextLabel: story.context_label?.trim() || null,
    personaId: story.primary_persona_id,
    personaName: story.primary_persona?.title ?? null,
    personaCode: story.primary_persona?.code?.trim() || null,
    tierCode: story.primary_persona?.metadata?.segment?.trim() || null,
    jtbdLabel: story.target_job?.title?.trim() || null,
    jtbdClientKey: story.target_job?.code?.trim() || null,
    impactCategory: resolveStoryImpactCategory(
      {
        impacts_north_star: story.impacts_north_star,
        impact_metric_id: story.impact_metric_id,
      },
      byId
    ),
    storyCode: story.notes?.trim() || null,
    isOrphan: !story.epic_id,
  }));
}

export const EPIC_FORM_STORY_SELECT = `
  id,
  title,
  context_label,
  status,
  epic_id,
  notes,
  impacts_north_star,
  impact_metric_id,
  primary_persona_id,
  primary_persona:sttns_work_items!sttns_user_stories_primary_persona_id_fkey ( title, code, metadata ),
  target_job:sttns_work_items!sttns_user_stories_target_persona_job_id_fkey ( title, code, metadata )
`;
