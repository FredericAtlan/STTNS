import type { SttnsPlacementReasonType } from "@/types/sttns";

/** Libellés formulaires / modale réordonnancement. */
export const PLACEMENT_REASON_LABELS: Record<SttnsPlacementReasonType, string> = {
  tech_dependency: "Dépendance technique",
  resource_availability: "Disponibilité ressource",
  strategic_priority: "Priorité stratégique",
  other: "Autre",
};

/** Libellés audit trail (drawer historique). */
export const PLACEMENT_REASON_AUDIT_LABELS: Record<SttnsPlacementReasonType, string> = {
  tech_dependency: "Dépendance technique",
  resource_availability: "Disponibilité ressource",
  strategic_priority: "Priorité CEO",
  other: "Autre",
};

export const PLACEMENT_REASON_OPTIONS: SttnsPlacementReasonType[] = [
  "tech_dependency",
  "resource_availability",
  "strategic_priority",
  "other",
];

export const PLACEMENT_REASON_BADGES: Record<
  SttnsPlacementReasonType,
  { label: string; className: string }
> = {
  tech_dependency: {
    label: PLACEMENT_REASON_AUDIT_LABELS.tech_dependency,
    className: "border-orange-200 bg-orange-50 text-orange-800",
  },
  resource_availability: {
    label: PLACEMENT_REASON_AUDIT_LABELS.resource_availability,
    className: "border-blue-200 bg-blue-50 text-blue-800",
  },
  strategic_priority: {
    label: PLACEMENT_REASON_AUDIT_LABELS.strategic_priority,
    className: "border-violet-200 bg-violet-50 text-violet-800",
  },
  other: {
    label: PLACEMENT_REASON_AUDIT_LABELS.other,
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

/** Convertit execution_sort_order (10, 20, 30…) en rang lisible (#1, #2…). */
export function sortOrderToRank(sortOrder: number): number {
  if (sortOrder <= 0) return 0;
  return Math.round(sortOrder / 10);
}

export function formatRankChange(oldOrder: number, newOrder: number): string {
  const oldRank = sortOrderToRank(oldOrder);
  const newRank = sortOrderToRank(newOrder);
  if (oldRank === 0 && newRank > 0) {
    return `Entrée backlog · Rang #${newRank}`;
  }
  return `Rang #${oldRank || "?"} ➔ Rang #${newRank || "?"}`;
}

/** Ex. « le 08 juin à 14:32 » */
export function formatHistoryDate(iso: string): string {
  try {
    const date = new Date(iso);
    const dayMonth = new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
    }).format(date);
    const time = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    return `le ${dayMonth} à ${time}`;
  } catch {
    return iso;
  }
}

export function buildInitialBacklogHistoryComment(
  _legacyScore: number | null | undefined
): string {
  return "Entrée backlog post-décision BUILD. Priorisation Spine : Impact Feature et ratio V/E Epic (RICE déprécié).";
}
