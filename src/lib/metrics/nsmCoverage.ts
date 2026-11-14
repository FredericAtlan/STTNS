import { EPIC_READY_STORY_STATUSES } from "@/lib/sttns/epicReady";
import type { SttnsProjectMetric, SttnsUserStoryStatus } from "@/types/sttns";

export const NSM_COVERAGE_KEY = "nsm" as const;

export type MetricCoverageNodeKey = typeof NSM_COVERAGE_KEY | string;

export type StoryCoverageInput = {
  id: string;
  title: string;
  context_label: string | null;
  epic_id: string | null;
  impacts_north_star: boolean;
  impact_metric_id: string | null;
  status: SttnsUserStoryStatus;
};

export type EpicCoverageInput = {
  id: string;
  title: string;
};

export type MetricCoverageCounts = {
  storyCount: number;
  epicCount: number;
  storyIds: string[];
  epicIds: string[];
  deliveredStoryIds: string[];
};

export type NsmCoverageBundle = {
  nodes: Record<string, MetricCoverageCounts>;
  storiesById: Record<
    string,
    Pick<StoryCoverageInput, "id" | "title" | "context_label" | "epic_id">
  >;
  epicsById: Record<string, EpicCoverageInput>;
};

type MetricLite = Pick<SttnsProjectMetric, "id" | "parent_id">;

function metricsById(flat: MetricLite[]): Record<string, MetricLite> {
  return Object.fromEntries(flat.map((m) => [m.id, m]));
}

/** Stories comptées : validées, en sprint ou livrées (non archivées en amont). */
export function isStoryEligibleForNsmCoverage(status: SttnsUserStoryStatus): boolean {
  return EPIC_READY_STORY_STATUSES.includes(status);
}

/** Nœuds métrique couverts par une story (NSM directe + remontée parent). */
export function resolveStoryCoveredNodeKeys(
  story: Pick<StoryCoverageInput, "impacts_north_star" | "impact_metric_id">,
  byId: Record<string, MetricLite>
): Set<MetricCoverageNodeKey> {
  const keys = new Set<MetricCoverageNodeKey>();

  if (story.impacts_north_star) {
    keys.add(NSM_COVERAGE_KEY);
  }

  if (story.impact_metric_id?.trim()) {
    let cur: MetricLite | undefined = byId[story.impact_metric_id];
    while (cur) {
      keys.add(cur.id);
      cur = cur.parent_id ? byId[cur.parent_id] : undefined;
    }
  }

  return keys;
}

function emptyCounts(): MetricCoverageCounts {
  return { storyCount: 0, epicCount: 0, storyIds: [], epicIds: [], deliveredStoryIds: [] };
}

export function computeNsmCoverage(
  metricsFlat: MetricLite[],
  stories: StoryCoverageInput[],
  epics: EpicCoverageInput[]
): NsmCoverageBundle {
  const byId = metricsById(metricsFlat);
  const eligibleStories = stories.filter((s) => isStoryEligibleForNsmCoverage(s.status));

  const nodeKeys: MetricCoverageNodeKey[] = [
    NSM_COVERAGE_KEY,
    ...metricsFlat.map((m) => m.id),
  ];

  const nodes: Record<string, MetricCoverageCounts> = Object.fromEntries(
    nodeKeys.map((key) => [key, emptyCounts()])
  );

  const storyIdsByNode = new Map<string, Set<string>>();
  const epicIdsByNode = new Map<string, Set<string>>();
  const deliveredStoryIdsByNode = new Map<string, Set<string>>();

  for (const key of nodeKeys) {
    storyIdsByNode.set(key, new Set());
    epicIdsByNode.set(key, new Set());
    deliveredStoryIdsByNode.set(key, new Set());
  }

  for (const story of eligibleStories) {
    const covered = resolveStoryCoveredNodeKeys(story, byId);
    covered.forEach((key) => {
      storyIdsByNode.get(key)?.add(story.id);
      if (story.status === "delivered") {
        deliveredStoryIdsByNode.get(key)?.add(story.id);
      }
      if (story.epic_id?.trim()) {
        epicIdsByNode.get(key)?.add(story.epic_id);
      }
    });
  }

  for (const key of nodeKeys) {
    const storyIds = Array.from(storyIdsByNode.get(key) ?? []);
    const epicIds = Array.from(epicIdsByNode.get(key) ?? []);
    const deliveredStoryIds = Array.from(deliveredStoryIdsByNode.get(key) ?? []);
    nodes[key] = {
      storyCount: storyIds.length,
      epicCount: epicIds.length,
      storyIds,
      epicIds,
      deliveredStoryIds,
    };
  }

  const storiesById = Object.fromEntries(
    eligibleStories.map((s) => [
      s.id,
      {
        id: s.id,
        title: s.title,
        context_label: s.context_label,
        epic_id: s.epic_id,
      },
    ])
  );

  const epicsById = Object.fromEntries(epics.map((e) => [e.id, e]));

  return { nodes, storiesById, epicsById };
}

export function coverageForNode(
  bundle: NsmCoverageBundle,
  nodeKey: MetricCoverageNodeKey
): MetricCoverageCounts {
  return bundle.nodes[nodeKey] ?? emptyCounts();
}

export type NsmPortfolioKpis = {
  /** Tous les nœuds métrique (NSM + arbre plat). */
  totalMetricNodes: number;
  coveredMetricNodes: number;
  coveragePct: number;
  deliveredMetricNodes: number;
  deliveredPct: number;
  orphanMetricNodes: number;
  nsmStoryCount: number;
  nsmEpicCount: number;
  eligibleStoryCount: number;
  storiesWithCoverage: number;
  distinctEpicsInTree: number;
};

export function computeNsmPortfolioKpis(
  bundle: NsmCoverageBundle,
  metricsFlat: MetricLite[]
): NsmPortfolioKpis {
  const nodeKeys = [NSM_COVERAGE_KEY, ...metricsFlat.map((m) => m.id)];
  let coveredMetricNodes = 0;
  let deliveredMetricNodes = 0;
  const epicIdsInTree = new Set<string>();

  for (const key of nodeKeys) {
    const node = bundle.nodes[key];
    if (!node) continue;
    if (node.storyCount > 0) coveredMetricNodes += 1;
    if (node.deliveredStoryIds.length > 0) deliveredMetricNodes += 1;
    node.epicIds.forEach((id) => epicIdsInTree.add(id));
  }

  const totalMetricNodes = nodeKeys.length;
  const orphanMetricNodes = totalMetricNodes - coveredMetricNodes;
  const coveragePct =
    totalMetricNodes > 0 ? Math.round((coveredMetricNodes / totalMetricNodes) * 100) : 0;
  const deliveredPct =
    totalMetricNodes > 0 ? Math.round((deliveredMetricNodes / totalMetricNodes) * 100) : 0;

  const eligibleStoryCount = Object.keys(bundle.storiesById).length;
  const storiesWithCoverageSet = new Set<string>();
  for (const key of nodeKeys) {
    bundle.nodes[key]?.storyIds.forEach((id) => storiesWithCoverageSet.add(id));
  }

  const nsm = bundle.nodes[NSM_COVERAGE_KEY] ?? emptyCounts();

  return {
    totalMetricNodes,
    coveredMetricNodes,
    coveragePct,
    deliveredMetricNodes,
    deliveredPct,
    orphanMetricNodes,
    nsmStoryCount: nsm.storyCount,
    nsmEpicCount: nsm.epicCount,
    eligibleStoryCount,
    storiesWithCoverage: storiesWithCoverageSet.size,
    distinctEpicsInTree: epicIdsInTree.size,
  };
}
