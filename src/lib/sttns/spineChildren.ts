/**
 * Enfants affichables pour l'Inspecteur Spine (Epic → Features → Stories).
 * Distinct du roll-up mathématique : ici titres, statuts et badges pour l'UI Structure.
 */

import type { WorkItemStatus } from "@/lib/sttns/types";
import {
  calculateFeatureDays,
  countRiskyUnits,
  readComplexity,
  readEffortDays,
  readImpact,
  type ComplexityLevel,
  type EffortDays,
  type ImpactLevel,
} from "@/lib/sttns/valueEffort";

export type SpineStoryChild = {
  id: string;
  title: string;
  status: WorkItemStatus;
  effortDays: EffortDays | null;
  complexity: ComplexityLevel | null;
  assignee_id: string | null;
};

export type SpineFeatureChild = {
  id: string;
  title: string;
  status: WorkItemStatus;
  impact: ImpactLevel | null;
  effortDays: number;
  riskyCount: number;
  stories: SpineStoryChild[];
};

type FeatureRow = {
  id: string;
  title: string;
  status: string;
  metadata: unknown;
};

type StoryRow = {
  id: string;
  title: string;
  status: string;
  parent_id: string | null;
  metadata: unknown;
  assignee_id?: string | null;
};

function asStatus(value: string): WorkItemStatus {
  if (value === "in_progress" || value === "review" || value === "done") return value;
  return "todo";
}

export function mapStoryChild(row: StoryRow): SpineStoryChild {
  return {
    id: row.id,
    title: row.title,
    status: asStatus(row.status),
    effortDays: readEffortDays(row.metadata),
    complexity: readComplexity(row.metadata),
    assignee_id: row.assignee_id ?? null,
  };
}

/** Construit l'arbre Features → Stories pour un Epic. */
export function buildEpicFeatureChildren(
  features: FeatureRow[],
  stories: StoryRow[]
): SpineFeatureChild[] {
  const storiesByFeature = new Map<string, SpineStoryChild[]>();
  for (const story of stories) {
    if (!story.parent_id) continue;
    const list = storiesByFeature.get(story.parent_id) ?? [];
    list.push(mapStoryChild(story));
    storiesByFeature.set(story.parent_id, list);
  }

  return features.map((f) => {
    const childStories = storiesByFeature.get(f.id) ?? [];
    const storyMetas = stories
      .filter((s) => s.parent_id === f.id)
      .map((s) => s.metadata);
    return {
      id: f.id,
      title: f.title,
      status: asStatus(f.status),
      impact: readImpact(f.metadata),
      effortDays: calculateFeatureDays(f.metadata, storyMetas),
      riskyCount: countRiskyUnits(f.metadata, storyMetas),
      stories: childStories,
    };
  });
}

export function countStoriesInFeatures(features: SpineFeatureChild[]): number {
  return features.reduce((sum, f) => sum + f.stories.length, 0);
}
