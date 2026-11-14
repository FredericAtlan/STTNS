"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  IMPACT_LABELS,
  RISK_LABELS,
  formatEffortDays,
  formatImpactBadge,
  formatRiskBadge,
  formatValueEffortRatio,
  type ComplexityLevel,
  type ImpactLevel,
} from "@/lib/sttns/valueEffort";

const BASE =
  "inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold leading-none";

type SizeProps = { className?: string; size?: "sm" | "md" };

function sizeClass(size: "sm" | "md" = "sm") {
  return size === "md" ? "h-6 px-2 text-xs" : "h-5 px-1.5 text-[11px]";
}

/** Impact Feature — I:n · Impact 0 = destructive. */
export function ImpactBadge({
  impact,
  showLabel = false,
  size = "sm",
  className,
}: {
  impact: ImpactLevel | null | undefined;
  showLabel?: boolean;
} & SizeProps) {
  if (impact == null) {
    return (
      <span className={cn(BASE, sizeClass(size), "bg-muted text-muted-foreground", className)}>
        —
      </span>
    );
  }

  const waste = impact === 0;
  return (
    <span
      className={cn(
        BASE,
        sizeClass(size),
        waste
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
        className
      )}
      title={IMPACT_LABELS[impact]}
    >
      {formatImpactBadge(impact, showLabel)}
    </span>
  );
}

/** ∑ Impact Epic (lecture seule). */
export function EpicImpactSumBadge({
  total,
  size = "sm",
  className,
}: {
  total: number | null | undefined;
} & SizeProps) {
  return (
    <span
      className={cn(BASE, sizeClass(size), "bg-muted text-muted-foreground", className)}
      title="Somme des Impacts Features"
    >
      ∑I:{total ?? 0}
    </span>
  );
}

/** Risque Story/Feature — R:n · R:3 = warning (+ icône Lucide optionnelle). */
export function RiskBadge({
  risk,
  showLabel = false,
  showIcon = false,
  size = "sm",
  className,
}: {
  risk: ComplexityLevel | null | undefined;
  showLabel?: boolean;
  showIcon?: boolean;
} & SizeProps) {
  if (risk == null) {
    return (
      <span className={cn(BASE, sizeClass(size), "bg-muted text-muted-foreground", className)}>
        —
      </span>
    );
  }

  const critical = risk === 3;
  const text = showLabel ? `R:${risk} ${RISK_LABELS[risk]}` : formatRiskBadge(risk);

  return (
    <span
      className={cn(
        BASE,
        sizeClass(size),
        critical
          ? "bg-warning/10 text-warning"
          : "bg-muted text-muted-foreground",
        className
      )}
      title={RISK_LABELS[risk]}
    >
      {showIcon && critical && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
      {text}
    </span>
  );
}

/** Compteur d'US en R:3 sous une Feature. */
export function RiskyCountBadge({
  count,
  size = "sm",
  className,
}: {
  count: number;
} & SizeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(BASE, sizeClass(size), "bg-warning/10 text-warning", className)}
      title={`${count} User Stor${count > 1 ? "ies" : "y"} en Risque Inconnu`}
    >
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
      {count} US R:3
    </span>
  );
}

/** Budget jours (Effort). */
export function EffortBadge({
  days,
  size = "sm",
  className,
}: {
  days: number | null | undefined;
} & SizeProps) {
  return (
    <span
      className={cn(BASE, sizeClass(size), "bg-muted text-muted-foreground tabular-nums", className)}
      title="Budget (J)"
    >
      {formatEffortDays(days)}
    </span>
  );
}

/** Ratio V/E Epic (ou Feature dérivé). */
export function RatioBadge({
  ratio,
  size = "sm",
  className,
}: {
  ratio: number | null | undefined;
} & SizeProps) {
  const tone =
    ratio == null
      ? "bg-muted text-muted-foreground"
      : ratio >= 1
        ? "bg-success/10 text-success"
        : ratio >= 0.5
          ? "bg-muted text-foreground"
          : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(BASE, sizeClass(size), "tabular-nums", tone, className)}
      title="Ratio Valeur / Effort"
    >
      V/E {formatValueEffortRatio(ratio ?? null)}
    </span>
  );
}
