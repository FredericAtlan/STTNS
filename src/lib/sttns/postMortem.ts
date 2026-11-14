export const ARCHIVE_REASONS = [
  { value: "out_of_scope", label: "Hors scope stratégique" },
  { value: "duplicate", label: "Doublon" },
  { value: "invalidated_by_strategy", label: "Vision caduque" },
  { value: "resource_constraint", label: "Contrainte technique/budget" },
  { value: "other", label: "Autre" },
] as const;

export type ArchiveReason = (typeof ARCHIVE_REASONS)[number]["value"];

export function getArchiveReasonLabel(reason: ArchiveReason): string {
  return ARCHIVE_REASONS.find((r) => r.value === reason)?.label || "Inconnu";
}

export function aggregatePostMortemReasons(
  logs: Array<{ reason: ArchiveReason }>
): Record<ArchiveReason, number> {
  const counts: Record<string, number> = {};

  for (const log of logs) {
    counts[log.reason] = (counts[log.reason] || 0) + 1;
  }

  for (const reason of ARCHIVE_REASONS) {
    if (!counts[reason.value]) {
      counts[reason.value] = 0;
    }
  }

  return counts as Record<ArchiveReason, number>;
}
