"use client";

import { SttnsKpiGrid } from "@/components/ui/SttnsKpiGrid";
import type { ExecutionBacklogMetrics } from "@/lib/sttns/storiesSpine";

export function ExecutionBacklogKpis({ metrics }: { metrics: ExecutionBacklogMetrics }) {
  return (
    <SttnsKpiGrid
      items={[
        {
          iconKey: "backlogStoryTotal",
          value: metrics.totalStories,
          detail: "Stories actives",
        },
        {
          iconKey: "backlogEffortTotal",
          value: metrics.totalActiveEffort,
          detail: "Jours d'effort (hors terminées)",
        },
        {
          iconKey: "backlogOrphans",
          value: metrics.orphanStories,
          detail: "Sans feature parente",
          tone: metrics.orphanStories > 0 ? "rose" : undefined,
        },
        {
          iconKey: "backlogUnestimated",
          value: metrics.unestimatedStories,
          detail: "Sans jours / Risque",
          tone: metrics.unestimatedStories > 0 ? "amber" : undefined,
        },
      ]}
    />
  );
}
