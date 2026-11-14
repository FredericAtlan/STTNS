"use client";

import { cn } from "@/lib/utils";

export type PainPointSeverity = "low" | "medium" | "high" | "critical";

const BASE =
  "inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold leading-none";

const STYLE: Record<PainPointSeverity, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-muted text-foreground",
  high: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

export const PAIN_POINT_SEVERITY_LABELS: Record<PainPointSeverity, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
};

function normalizeSeverity(value: string): PainPointSeverity {
  if (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  ) {
    return value;
  }
  return "medium";
}

/**
 * Badge sévérité Pain Point — tokens sémantiques uniquement
 * (critical → destructive · high → warning · reste → muted).
 */
export function SeverityBadge({
  severity,
  size = "sm",
  showLabel = true,
  className,
}: {
  severity: string;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  const normalized = normalizeSeverity(severity);
  const sizeClass = size === "md" ? "h-6 px-2 text-xs" : "h-5 px-1.5 text-[11px]";

  return (
    <span
      className={cn(BASE, sizeClass, STYLE[normalized], className)}
      title={PAIN_POINT_SEVERITY_LABELS[normalized]}
    >
      {showLabel ? PAIN_POINT_SEVERITY_LABELS[normalized] : normalized}
    </span>
  );
}
