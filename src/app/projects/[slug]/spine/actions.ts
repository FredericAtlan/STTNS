"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import { fetchSpineTree, type SpineTreeDataset } from "@/lib/sttns/spineTree";
import { getWorkItem, readMetadataDescription } from "@/lib/sttns/workItems";
import { readMetadataDocUrl } from "@/lib/sttns/workItemMetadata";
import type { StoredWorkItem } from "@/lib/sttns/types";
import type { WhyEditTarget } from "@/components/why/WhyEditSlideOver";
import type { StoryEditData } from "@/components/execution/StoryEditSlideOver";
import type { ComplexityLevel, EffortDays, ImpactLevel } from "@/lib/sttns/valueEffort";
import {
  calculateEpicRollup,
  calculateFeatureDays,
  countRiskyUnits,
  readComplexity,
  readEffortDays,
  readImpact,
} from "@/lib/sttns/valueEffort";
import {
  buildEpicFeatureChildren,
  countStoriesInFeatures,
  mapStoryChild,
  type SpineFeatureChild,
  type SpineStoryChild,
} from "@/lib/sttns/spineChildren";
import type { WorkItemStatus } from "@/lib/sttns/types";

export type { SpineFeatureChild, SpineStoryChild };

export type SpineEpicEditData = {
  id: string;
  title: string;
  description?: string;
  doc_url?: string | null;
  status?: WorkItemStatus;
  totalImpact?: number;
  totalDays?: number;
  valueEffortRatio?: number | null;
  /** Features enfants avec Stories imbriquées (onglet Structure). */
  features: SpineFeatureChild[];
  featureCount: number;
  storyCount: number;
};

export type SpineFeatureEditData = {
  id: string;
  title: string;
  description?: string;
  doc_url?: string | null;
  status?: WorkItemStatus;
  epic_id: string | null;
  epicTitle?: string | null;
  cycle_id?: string | null;
  linked_jtbd_id: string | null;
  impact: ImpactLevel | null;
  effort_days: EffortDays | null;
  complexity: ComplexityLevel | null;
  /** Stories enfants — 0 = Shape Up (saisie Effort/Risque Feature). */
  childStoryCount: number;
  rollupDays: number;
  riskyCount: number;
  stories: SpineStoryChild[];
};

export type SpineNodeEditPayload =
  | { kind: "why"; target: WhyEditTarget }
  | { kind: "epic"; data: SpineEpicEditData }
  | { kind: "feature"; data: SpineFeatureEditData }
  | { kind: "story"; data: StoryEditData };

function mapWorkItemToPayload(item: StoredWorkItem): SpineNodeEditPayload | { error: string } {
  switch (item.type) {
    case "persona":
      return {
        kind: "why",
        target: {
          kind: "persona",
          data: {
            id: item.id,
            name: item.title,
            code: item.code,
            description: item.metadata.description,
            segment: item.metadata.segment,
            doc_url: readMetadataDocUrl(item.metadata),
            avatar_url: item.metadata.avatar_url ?? null,
          },
        },
      };
    case "pain_point":
      return {
        kind: "why",
        target: {
          kind: "pp",
          data: {
            id: item.id,
            persona_id: item.parent_id,
            label: item.metadata.label,
            severity: item.metadata.severity,
          },
        },
      };
    case "job":
      return {
        kind: "why",
        target: {
          kind: "jtbd",
          data: {
            id: item.id,
            title: item.title,
            parent_id: item.parent_id,
            solved_pain_points: item.solved_pain_points ?? [],
          },
        },
      };
    case "epic":
      return {
        kind: "epic",
        data: {
          id: item.id,
          title: item.title,
          description: readMetadataDescription(item.metadata) ?? undefined,
          doc_url: readMetadataDocUrl(item.metadata),
          status: item.status,
          features: [],
          featureCount: 0,
          storyCount: 0,
        },
      };
    case "feature": {
      const jtbdLink = item.context_links.find((l) => l.type === "job");
      return {
        kind: "feature",
        data: {
          id: item.id,
          title: item.title,
          description: readMetadataDescription(item.metadata) ?? undefined,
          doc_url: readMetadataDocUrl(item.metadata),
          status: item.status,
          epic_id: item.parent_id,
          cycle_id: item.cycle_id,
          linked_jtbd_id: jtbdLink?.context_id ?? null,
          impact: readImpact(item.metadata),
          effort_days: readEffortDays(item.metadata),
          complexity: readComplexity(item.metadata),
          // Enrichi dans fetchSpineNodeEditAction (compte Stories).
          childStoryCount: 0,
          rollupDays: readEffortDays(item.metadata) ?? 0,
          riskyCount: 0,
          stories: [],
        },
      };
    }
    case "story":
      return {
        kind: "story",
        data: {
          id: item.id,
          title: item.title,
          description: readMetadataDescription(item.metadata),
          doc_url: readMetadataDocUrl(item.metadata),
          feature_id: item.parent_id,
          cycle_id: item.cycle_id,
          effort_days: readEffortDays(item.metadata),
          complexity: readComplexity(item.metadata),
          metadata: item.metadata,
          status: item.status,
          assignee_id: item.assignee_id,
        },
      };
    default:
      return { error: "Ce type de nœud n'est pas éditable depuis l'arbre." };
  }
}

export async function refreshSpineTreeAction(
  projectId: string,
  projectSlug: string
): Promise<{ ok: true; dataset: SpineTreeDataset } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const dataset = await fetchSpineTree(supabase, projectId);
  revalidatePath(`/projects/${projectSlug}/spine`);
  revalidatePath(`/projects/${projectSlug}/mindmap`);
  return { ok: true, dataset };
}

export async function fetchSpineNodeEditAction(
  workItemId: string
): Promise<
  { ok: true; payload: SpineNodeEditPayload; title: string } | { ok: false; error: string }
> {
  const result = await getWorkItem(workItemId);
  if (!result.ok) return result;
  if (!result.item) {
    return { ok: false, error: "Élément introuvable." };
  }

  const access = await requireProjectMember(result.item.project_id);
  if (!access.ok) return access;

  const mapped = mapWorkItemToPayload(result.item);
  if ("error" in mapped) {
    return { ok: false, error: mapped.error };
  }

  // Enrichissement Feature / Epic : roll-ups + enfants affichables.
  if (mapped.kind === "feature" || mapped.kind === "epic") {
    const supabase = await createClient();

    if (mapped.kind === "feature") {
      const { data: storyRows } = await supabase
        .from("sttns_work_items")
        .select("id, title, status, metadata, assignee_id, parent_id")
        .eq("parent_id", result.item.id)
        .eq("type", "story")
        .is("archived_at", null)
        .order("sort_order", { ascending: true });
      const stories = (storyRows ?? []).map((s) =>
        mapStoryChild({
          id: s.id,
          title: s.title,
          status: s.status,
          parent_id: s.parent_id,
          metadata: s.metadata,
          assignee_id: s.assignee_id,
        })
      );
      const storyMetas = (storyRows ?? []).map((s) => s.metadata);
      mapped.data.stories = stories;
      mapped.data.childStoryCount = stories.length;
      mapped.data.rollupDays = calculateFeatureDays(result.item.metadata, storyMetas);
      mapped.data.riskyCount = countRiskyUnits(result.item.metadata, storyMetas);

      if (result.item.parent_id) {
        const { data: epicRow } = await supabase
          .from("sttns_work_items")
          .select("title")
          .eq("id", result.item.parent_id)
          .maybeSingle();
        mapped.data.epicTitle = epicRow?.title ?? null;
      }
    }

    if (mapped.kind === "epic") {
      const { data: features } = await supabase
        .from("sttns_work_items")
        .select("id, title, status, metadata")
        .eq("parent_id", result.item.id)
        .eq("type", "feature")
        .is("archived_at", null)
        .order("sort_order", { ascending: true });
      const featureIds = (features ?? []).map((f) => f.id);
      const { data: stories } =
        featureIds.length > 0
          ? await supabase
              .from("sttns_work_items")
              .select("id, title, status, parent_id, metadata, assignee_id")
              .eq("type", "story")
              .in("parent_id", featureIds)
              .is("archived_at", null)
              .order("sort_order", { ascending: true })
          : {
              data: [] as Array<{
                id: string;
                title: string;
                status: string;
                parent_id: string | null;
                metadata: unknown;
                assignee_id: string | null;
              }>,
            };

      const featureChildren = buildEpicFeatureChildren(features ?? [], stories ?? []);
      mapped.data.features = featureChildren;
      mapped.data.featureCount = featureChildren.length;
      mapped.data.storyCount = countStoriesInFeatures(featureChildren);

      const stats = featureChildren.map((f) => ({
        impact: f.impact,
        calculatedDays: f.effortDays,
      }));
      const rollup = calculateEpicRollup(stats);
      mapped.data.totalImpact = rollup.totalImpact;
      mapped.data.totalDays = rollup.totalDays;
      mapped.data.valueEffortRatio = rollup.ratio;
    }
  }

  return { ok: true, payload: mapped, title: result.item.title };
}
