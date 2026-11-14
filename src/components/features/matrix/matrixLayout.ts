import { deriveGovernanceBucket, type GovernanceBucket } from "@/lib/sttns/governanceAxes";
import type { SttnsInitiative } from "@/types/sttns";
import {
  effortToScatterXPercent,
  governanceBubbleColor,
  impactToScatterYPercent,
  kanoCellKey,
  kanoPositionPercent,
  kanoTypeColor,
  MATRIX_BUBBLE_SIZE,
  resolveProjectedFunctionality,
  resolveProjectedSatisfaction,
  resolveSttnsScore,
  sttnsScorePointSize,
} from "@/lib/sttns/riceVisual";
import type { MatrixFeature, MatrixView } from "@/components/features/matrix/types";

export function isKanoPlottable(feature: MatrixFeature): boolean {
  return Boolean(feature.kano_type || feature.projected_satisfaction_level);
}

export function isRicePlottable(feature: MatrixFeature): boolean {
  return feature.rice_impact != null && feature.rice_effort != null && feature.rice_effort > 0;
}

export function resolveGovernanceBucket(feature: MatrixFeature): GovernanceBucket {
  if (!feature.workflow_status && !feature.status && !feature.review_status) {
    return "draft";
  }
  return deriveGovernanceBucket(feature as Pick<
    SttnsInitiative,
    | "review_status"
    | "phase1_status"
    | "final_decision"
    | "decision"
    | "ceo_final_phase2"
    | "status"
    | "workflow_status"
  >);
}

export function groupKanoFeatures(features: MatrixFeature[]): Map<string, MatrixFeature[]> {
  const map = new Map<string, MatrixFeature[]>();
  for (const feature of features) {
    if (!isKanoPlottable(feature)) continue;
    const key = kanoCellKey(
      resolveProjectedSatisfaction(feature),
      resolveProjectedFunctionality(feature)
    );
    const list = map.get(key) ?? [];
    list.push(feature);
    map.set(key, list);
  }
  return map;
}

export type BubbleLayout = {
  x: number;
  y: number;
  size: number;
  color: string;
  visible: boolean;
};

export function computeBubbleLayout(
  feature: MatrixFeature,
  view: MatrixView,
  kanoGroups: Map<string, MatrixFeature[]>
): BubbleLayout | null {
  if (view === "kano") {
    if (!isKanoPlottable(feature)) return null;
    const satisfaction = resolveProjectedSatisfaction(feature);
    const functionality = resolveProjectedFunctionality(feature);
    const key = kanoCellKey(satisfaction, functionality);
    const cell = kanoGroups.get(key) ?? [feature];
    const index = cell.findIndex((f) => f.id === feature.id);
    const pos = kanoPositionPercent(satisfaction, functionality, Math.max(0, index), cell.length);
    return {
      x: pos.x,
      y: pos.y,
      size: MATRIX_BUBBLE_SIZE,
      color: kanoTypeColor(feature.kano_type),
      visible: true,
    };
  }

  if (!isRicePlottable(feature)) return null;

  const x = effortToScatterXPercent(feature.rice_effort);
  const y = impactToScatterYPercent(feature.rice_impact);

  if (view === "rice") {
    return {
      x,
      y,
      size: MATRIX_BUBBLE_SIZE,
      color: governanceBubbleColor(resolveGovernanceBucket(feature)),
      visible: true,
    };
  }

  const score = resolveSttnsScore(feature);
  return {
    x,
    y,
    size: sttnsScorePointSize(score),
    color: kanoTypeColor(feature.kano_type),
    visible: true,
  };
}

export function countPlottedFeatures(features: MatrixFeature[], view: MatrixView): number {
  if (view === "kano") return features.filter(isKanoPlottable).length;
  return features.filter(isRicePlottable).length;
}
