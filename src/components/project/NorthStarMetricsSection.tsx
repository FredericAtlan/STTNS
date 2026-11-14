import { computeNsmCoverage } from "@/lib/metrics/nsmCoverage";
import type {
  EpicCoverageInput,
  NsmCoverageBundle,
  StoryCoverageInput,
} from "@/lib/metrics/nsmCoverage";
import { NorthStarMetricsView } from "@/components/project/NorthStarMetricsView";
import type { SttnsProject, SttnsProjectMetric } from "@/types/sttns";

interface Props {
  project: SttnsProject;
  metrics: SttnsProjectMetric[];
  projectSlug: string;
  embedded?: boolean;
  /** Pré-calculé côté page ; sinon dérivé des stories/epics passés */
  coverage?: NsmCoverageBundle;
  storiesForCoverage?: StoryCoverageInput[];
  epicsForCoverage?: EpicCoverageInput[];
}

export function NorthStarMetricsSection({
  project,
  metrics,
  projectSlug,
  embedded = false,
  coverage: coverageProp,
  storiesForCoverage = [],
  epicsForCoverage = [],
}: Props) {
  const coverage =
    coverageProp ??
    computeNsmCoverage(metrics, storiesForCoverage, epicsForCoverage);

  return (
    <NorthStarMetricsView
      project={project}
      metrics={metrics}
      projectSlug={projectSlug}
      embedded={embedded}
      coverage={coverage}
    />
  );
}
