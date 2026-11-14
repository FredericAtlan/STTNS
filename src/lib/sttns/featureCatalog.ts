import { EXECUTION_STATUS_LABELS, KANO_LABELS_SHORT } from "@/lib/sttns/constants";
import { initiativeEpicLabel } from "@/lib/sttns/epics";
import {
  deriveGovernanceBucket,
  GOVERNANCE_BUCKET_LABELS,
} from "@/lib/sttns/governanceAxes";
import { formatInitiativeSttnsScore, resolveSttnsScore } from "@/lib/sttns/riceVisual";
import type { FeatureCatalogRow } from "@/components/features/FeaturesCatalog";
import type {
  SttnsEpic,
  SttnsInitiative,
  SttnsInitiativeExecutionStatus,
  SttnsKanoType,
} from "@/types/sttns";

function kanoLabel(kano: SttnsKanoType | null | undefined): string {
  if (!kano) return "—";
  return KANO_LABELS_SHORT[kano] ?? kano;
}

export function toFeatureCatalogRow(
  initiative: SttnsInitiative,
  epics: SttnsEpic[]
): FeatureCatalogRow {
  const bucket = deriveGovernanceBucket(initiative);
  return {
    id: initiative.id,
    featureCode: initiative.feature_code,
    featureName: initiative.feature_name,
    epicLabel: initiativeEpicLabel(initiative, epics),
    epicId: initiative.epic_id,
    personaLabel: initiative.persona?.trim() || "—",
    personaId: initiative.persona_id,
    scoreLabel: formatInitiativeSttnsScore(initiative),
    scoreValue: resolveSttnsScore(initiative),
    kanoLabel: kanoLabel(initiative.kano_type),
    specsFilled: Boolean(initiative.technical_solution?.trim()),
    governanceLabel: GOVERNANCE_BUCKET_LABELS[bucket],
    governanceBucket: bucket,
    workflowStatus: initiative.workflow_status,
    executionStatus: (initiative.execution_status ?? "pending") as SttnsInitiativeExecutionStatus,
    executionStatusLabel:
      EXECUTION_STATUS_LABELS[initiative.execution_status ?? "pending"],
    executionSortOrder: initiative.execution_sort_order ?? 0,
  };
}

export function featureCatalogStats(rows: FeatureCatalogRow[]) {
  const activeRows = rows.filter((r) => r.governanceBucket !== "killed");
  const killedCount = rows.length - activeRows.length;
  
  const total = activeRows.length;
  const build = activeRows.filter((r) => r.governanceBucket === "build").length;
  const inReview = activeRows.filter((r) => r.governanceBucket === "in_review").length;
  const withSpecs = activeRows.filter((r) => r.specsFilled).length;
  const linkedToEpic = activeRows.filter((r) => r.epicId).length;

  return {
    total,
    build,
    inReview,
    noSpecs: total - withSpecs,
    withSpecs,
    specsPct: total === 0 ? 0 : Math.round((withSpecs / total) * 100),
    linkedToEpic,
    alignmentPct: total === 0 ? 0 : Math.round((linkedToEpic / total) * 100),
    killed: killedCount,
    killRate: (total + killedCount) === 0 ? 0 : Math.round((killedCount / (total + killedCount)) * 100),
  };
}
