import type { SttnsProjectMetric, SttnsUserStory } from "@/types/sttns";

export type MetricDraft = {
  id?: string;
  key: string;
  name: string;
  description: string;
  children: MetricDraft[];
};

export type MetricSelectOption = {
  value: string;
  label: string;
  level: "north_star" | "main" | "sub";
  /** Display depth: 0 = level-2 main metric, 1+ = nested sub-metrics */
  depth?: number;
};

function sortMetrics(a: SttnsProjectMetric, b: SttnsProjectMetric) {
  return a.sort_order - b.sort_order || a.name.localeCompare(b.name);
}

export function buildMetricsTree(flat: SttnsProjectMetric[]): SttnsProjectMetric[] {
  const childrenByParent = new Map<string, SttnsProjectMetric[]>();
  for (const m of flat) {
    if (!m.parent_id) continue;
    const list = childrenByParent.get(m.parent_id) ?? [];
    list.push(m);
    childrenByParent.set(m.parent_id, list);
  }

  function attachChildren(node: SttnsProjectMetric): SttnsProjectMetric {
    const kids = (childrenByParent.get(node.id) ?? []).sort(sortMetrics);
    return {
      ...node,
      children: kids.map(attachChildren),
    };
  }

  return flat
    .filter((m) => !m.parent_id)
    .sort(sortMetrics)
    .map(attachChildren);
}

/** NSM = level 1; root metrics = 2; each nested child +1 */
export function metricDisplayLevel(
  metric: SttnsProjectMetric,
  byId: Record<string, SttnsProjectMetric>
): number {
  if (!metric.parent_id) return 2;
  let level = 3;
  let cur = byId[metric.parent_id];
  while (cur?.parent_id) {
    level += 1;
    cur = byId[cur.parent_id];
  }
  return level;
}

export function metricsById(flat: SttnsProjectMetric[]): Record<string, SttnsProjectMetric> {
  return Object.fromEntries(flat.map((m) => [m.id, m]));
}

export function flatToDrafts(flat: SttnsProjectMetric[]): MetricDraft[] {
  function toDraft(node: SttnsProjectMetric): MetricDraft {
    return {
      id: node.id,
      key: node.id,
      name: node.name,
      description: node.description ?? "",
      children: (node.children ?? []).map(toDraft),
    };
  }
  return buildMetricsTree(flat).map(toDraft);
}

export function newMetricDraft(): MetricDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    description: "",
    children: [],
  };
}

export function newSubMetricDraft(): MetricDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    description: "",
    children: [],
  };
}

export function buildMetricSelectOptions(
  flat: SttnsProjectMetric[],
  nsmLabel: string
): MetricSelectOption[] {
  const options: MetricSelectOption[] = [
    { value: "north_star", label: `North Star — ${nsmLabel}`, level: "north_star", depth: -1 },
  ];

  function walk(node: SttnsProjectMetric, breadcrumb: string, depth: number) {
    const label = breadcrumb ? `${breadcrumb} › ${node.name}` : node.name;
    options.push({
      value: node.id,
      label,
      level: depth === 0 ? "main" : "sub",
      depth,
    });
    for (const child of node.children ?? []) {
      walk(child, label, depth + 1);
    }
  }

  for (const main of buildMetricsTree(flat)) {
    walk(main, "", 0);
  }

  return options;
}

export function storyImpactSelectValue(story: SttnsUserStory): string {
  if (story.impacts_north_star) return "north_star";
  return story.impact_metric_id ?? "";
}

export function parseImpactSelectValue(value: string): {
  impacts_north_star: boolean;
  impact_metric_id: string | null;
} {
  if (!value) return { impacts_north_star: false, impact_metric_id: null };
  if (value === "north_star") return { impacts_north_star: true, impact_metric_id: null };
  return { impacts_north_star: false, impact_metric_id: value };
}

export function resolveMetricLabel(
  metricId: string | null | undefined,
  flat: SttnsProjectMetric[]
): string | null {
  if (!metricId) return null;
  const byId = metricsById(flat);
  const names: string[] = [];
  let cur: SttnsProjectMetric | undefined = byId[metricId];
  while (cur) {
    names.unshift(cur.name);
    cur = cur.parent_id ? byId[cur.parent_id] : undefined;
  }
  return names.length ? names.join(" › ") : null;
}

export function resolveStoryImpactLabel(
  story: SttnsUserStory,
  flat: SttnsProjectMetric[],
  nsmLabel: string
): string | null {
  if (story.impacts_north_star) return `North Star — ${nsmLabel}`;
  return resolveMetricLabel(story.impact_metric_id, flat);
}
