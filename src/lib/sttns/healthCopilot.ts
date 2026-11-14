/**
 * KF4 — Health Copilot temps réel.
 *
 * Barre sticky Radar-lite : compteurs orphelin / fantôme / WIP / impact 0.
 * Aucune API LLM V1 : règles 100% déterministes calculées côté client à partir
 * des mêmes lignes déjà chargées pour la sidebar (`radarAnomalies`) et la
 * matrice Why (`whyHealth`).
 *
 * Ce module est **pur** — pas de React, pas de DOM. La barre visuelle vit dans
 * `src/components/copilot/HealthCopilotBar.tsx`.
 */

import {
  computeGhostJtbdIds,
  computeOrphanFeatureIds,
  computeStagnantStoryIds,
  computeWasteFeatureIds,
  type AnomalyContextLinkRow,
  type AnomalyWorkItemLinkRow,
  type AnomalyWorkItemRow,
} from "@/lib/sttns/radarAnomalies";

export type HealthCopilotSeverity = "critical" | "warning" | "info" | "ok";

export type HealthCopilotIndicatorKind =
  | "orphan_feature"
  | "ghost_jtbd"
  | "wip"
  | "impact_zero";

export interface HealthCopilotIndicator {
  kind: HealthCopilotIndicatorKind;
  /** Libellé court FR (barre compacte). */
  label: string;
  /** Libellé long descriptif (tooltip / accordion). */
  longLabel: string;
  count: number;
  severity: HealthCopilotSeverity;
  /** Deep-link relatif à `/projects/{slug}` (ex. `/radar#waste-features`). */
  href: string;
  /** CTA texte pour le lien. */
  ctaLabel: string;
}

export interface HealthCopilotSnapshot {
  indicators: HealthCopilotIndicator[];
  total: number;
  /** Sévérité maximale rencontrée — pilote la couleur globale de la barre. */
  worstSeverity: HealthCopilotSeverity;
}

export interface HealthCopilotInput {
  workItems: AnomalyWorkItemRow[];
  contextLinks: AnomalyContextLinkRow[];
  workItemLinks: AnomalyWorkItemLinkRow[];
  /** Jours de stagnation configurés au projet (utilisés en info secondaire). */
  stagnationDays: number;
  /** Plafond WIP paramétré au projet (settings.wipLimit). */
  wipLimit: number;
  now?: Date;
}

/** Nombre de stories effectivement en cours (`in_progress`). */
export function countWipStories(workItems: AnomalyWorkItemRow[]): number {
  let n = 0;
  for (const item of workItems) {
    if (item.type !== "story") continue;
    if (item.status === "in_progress") n += 1;
  }
  return n;
}

/**
 * Sévérité indicateur — règles déterministes :
 * - `orphan_feature` : ≥1 = warning ; ≥3 = critical.
 * - `ghost_jtbd`     : ≥1 = warning ; ≥3 = critical.
 * - `wip`            : au-dessus du plafond = warning ; +50% = critical.
 * - `impact_zero`    : ≥1 = critical (hard-block Constitution Spine).
 */
export function classifySeverity(
  kind: HealthCopilotIndicatorKind,
  count: number,
  ctx: { wipLimit: number } | undefined
): HealthCopilotSeverity {
  if (count <= 0) return "ok";

  switch (kind) {
    case "impact_zero":
      return "critical";
    case "wip": {
      const limit = ctx?.wipLimit ?? 5;
      if (limit <= 0) return "info";
      if (count > limit * 1.5) return "critical";
      if (count > limit) return "warning";
      return "info";
    }
    case "orphan_feature":
    case "ghost_jtbd":
    default:
      return count >= 3 ? "critical" : "warning";
  }
}

const SEVERITY_ORDER: Record<HealthCopilotSeverity, number> = {
  ok: 0,
  info: 1,
  warning: 2,
  critical: 3,
};

function worst(a: HealthCopilotSeverity, b: HealthCopilotSeverity): HealthCopilotSeverity {
  return SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;
}

/**
 * Calcule les 4 indicateurs canoniques Health Copilot.
 * Toujours renvoie 4 entrées (compte 0 possible) pour un affichage stable.
 */
export function computeHealthCopilot(
  input: HealthCopilotInput
): HealthCopilotSnapshot {
  const orphan = computeOrphanFeatureIds({
    workItems: input.workItems,
    contextLinks: input.contextLinks,
  }).size;
  const ghost = computeGhostJtbdIds({
    workItems: input.workItems,
    workItemLinks: input.workItemLinks,
  }).size;
  const waste = computeWasteFeatureIds(input.workItems).size;
  const wip = countWipStories(input.workItems);

  const indicators: HealthCopilotIndicator[] = [
    {
      kind: "impact_zero",
      label: "Impact 0",
      longLabel: "Features en Impact 0 (Gaspillage)",
      count: waste,
      severity: classifySeverity("impact_zero", waste, { wipLimit: input.wipLimit }),
      href: "/radar",
      ctaLabel: "Voir Radar — Gaspillage",
    },
    {
      kind: "orphan_feature",
      label: "Orphelines",
      longLabel: "Features sans JTBD lié",
      count: orphan,
      severity: classifySeverity("orphan_feature", orphan, { wipLimit: input.wipLimit }),
      href: "/portfolio",
      ctaLabel: "Rattacher un JTBD",
    },
    {
      kind: "ghost_jtbd",
      label: "Fantômes",
      longLabel: "JTBD sans Pain Point (solves)",
      count: ghost,
      severity: classifySeverity("ghost_jtbd", ghost, { wipLimit: input.wipLimit }),
      href: "/why",
      ctaLabel: "Ancrer un Pain Point",
    },
    {
      kind: "wip",
      label: `WIP ${wip}/${Math.max(input.wipLimit, 0)}`,
      longLabel: `Stories en cours (plafond ${input.wipLimit})`,
      count: wip,
      severity: classifySeverity("wip", wip, { wipLimit: input.wipLimit }),
      href: "/kanban",
      ctaLabel: "Ouvrir le Kanban",
    },
  ];

  const total = indicators.reduce(
    (sum, ind) => (ind.kind === "wip" ? sum : sum + ind.count),
    0
  );

  const worstSeverity = indicators.reduce<HealthCopilotSeverity>(
    (acc, ind) => worst(acc, ind.severity),
    "ok"
  );

  // Info bonus : stories stagnantes (non affichée par défaut, mais exposée
  // pour futures itérations — garde `stagnationDays` utile côté typé).
  void computeStagnantStoryIds({
    workItems: input.workItems,
    stagnationDays: input.stagnationDays,
    now: input.now,
  });

  return { indicators, total, worstSeverity };
}

/** URL absolue projet pour un indicateur (utilisée par les CTAs). */
export function copilotHrefFor(
  indicator: HealthCopilotIndicator,
  projectSlug: string
): string {
  return `/projects/${projectSlug}${indicator.href}`;
}

/** Sévérité globale visible : ignore les indicateurs à 0. */
export function copilotShouldSurface(snapshot: HealthCopilotSnapshot): boolean {
  return snapshot.indicators.some((ind) => ind.count > 0 && ind.severity !== "info");
}
