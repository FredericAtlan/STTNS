"use client";

import type { ReactNode } from "react";
import { SttnsContextHelp } from "@/components/ui/SttnsContextHelp";
import type { SttnsContextHelpContent } from "@/components/ui/SttnsContextHelp";
import { AlignmentTensionMeter } from "@/components/personas/AlignmentTensionMeter";
import type {
  PersonaAlignmentLevel,
  PersonaAlignmentMetrics,
  PersonaCoverageReport,
} from "@/lib/personas/personaCoverage";
import {
  computeAlignmentTension,
} from "@/lib/personas/alignmentTension";
import {
  ecosystemCoverageLevel,
  ghostLevel,
} from "@/lib/personas/personaCoverage";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const LEVEL_STYLES: Record<
  PersonaAlignmentLevel,
  { card: string; badge: string; accent: string; glow?: string }
> = {
  healthy: {
    card: "border-emerald-100/80 bg-white/40",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    accent: "text-emerald-600",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
  },
  caution: {
    card: "border-amber-100/80 bg-white/40",
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    accent: "text-amber-600",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
  },
  critical: {
    card: "border-red-100/80 bg-white/40",
    badge: "border-red-200 bg-red-50 text-red-800",
    accent: "text-red-600",
  },
  neutral: {
    card: "border-slate-100/80 bg-white/40",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    accent: "text-slate-400",
  },
};

function MetricCardShell({
  keyword,
  title,
  help,
  level,
  children,
  footer,
}: {
  keyword: string;
  title: string;
  help: SttnsContextHelpContent;
  level: PersonaAlignmentLevel;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const styles = LEVEL_STYLES[level];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-md p-5 transition-all duration-500 ease-out",
        styles.card
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            {keyword}
          </p>
          <h3 className="mt-1 font-display text-sm font-light tracking-tight text-slate-800">
            {title}
          </h3>
        </div>
        <SttnsContextHelp {...help} placement="top" size="sm" />
      </div>
      <div className="mt-4">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </article>
  );
}

function RadialCoverageRing({ pct, level }: { pct: number; level: PersonaAlignmentLevel }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const stroke =
    level === "healthy"
      ? "#10b981"
      : level === "caution"
        ? "#f59e0b"
        : level === "critical"
          ? "#ef4444"
          : "#cbd5e1";

  return (
    <div className="relative mx-auto h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="3" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-light tabular-nums tracking-tight", LEVEL_STYLES[level].accent)}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

function TensionStatusBadge({ totalPP, totalJTBD }: { totalPP: number; totalJTBD: number }) {
  if (totalPP === 0) {
    return (
      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", LEVEL_STYLES.neutral.badge)}>
        En attente de PP
      </span>
    );
  }
  const { status } = computeAlignmentTension(totalPP, totalJTBD);
  if (status === "CHIRURGICAL") {
    return (
      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", LEVEL_STYLES.healthy.badge)}>
        Chirurgical
      </span>
    );
  }
  if (status === "SOUS-SPÉCIFIÉ") {
    return (
      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", LEVEL_STYLES.caution.badge)}>
        Sous-spécifié
      </span>
    );
  }
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", LEVEL_STYLES.critical.badge)}>
      Surcharge
    </span>
  );
}

function CoverageBadge({ metrics, level }: { metrics: PersonaAlignmentMetrics; level: PersonaAlignmentLevel }) {
  if (metrics.totalPainCount === 0) {
    return (
      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", LEVEL_STYLES.neutral.badge)}>
        Aucune friction
      </span>
    );
  }
  if (level === "healthy") {
    return (
      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", LEVEL_STYLES.healthy.badge)}>
        Alignement parfait
      </span>
    );
  }
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", LEVEL_STYLES[level].badge)}>
      {metrics.ignoredPainCount} PP ignorée{metrics.ignoredPainCount > 1 ? "s" : ""}
    </span>
  );
}

function GhostBadge({ count, level }: { count: number; level: PersonaAlignmentLevel }) {
  if (level === "healthy") {
    return (
      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", LEVEL_STYLES.healthy.badge)}>
        Aucun fantôme
      </span>
    );
  }
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", LEVEL_STYLES[level].badge)}>
      {count} ambition{count > 1 ? "s" : ""} sans sens
    </span>
  );
}

const METRIC_HELP = {
  coverage: {
    kind: "definition" as const,
    title: "Couverture écosystème",
    body: "Pourcentage de frictions (Pain Points) reliées à au moins un Job To Be Done. 100 % requis pour publier en READY.",
  },
  density: {
    kind: "definition" as const,
    title: "Indice de densité JTBD/PP",
    body: "Ratio JTBD ÷ frictions. Chirurgical (1,0–1,4), sous-spécifié (<1,0), surcharge (>1,4).",
  },
  ghost: {
    kind: "definition" as const,
    title: "Jobs fantômes",
    body: "Jobs To Be Done sans aucune friction associée — ambitions déconnectées du terrain réel.",
  },
};

export function PersonaAlignmentMetricsGrid({
  metrics,
  report,
  className,
}: {
  metrics: PersonaAlignmentMetrics;
  report?: PersonaCoverageReport;
  className?: string;
}) {
  const coverageLevel = ecosystemCoverageLevel(metrics.ecosystemCoveragePct, metrics.totalPainCount);
  const tension = computeAlignmentTension(metrics.totalPainCount, metrics.totalJobCount);
  const tensionLevel: PersonaAlignmentLevel =
    tension.status === "CHIRURGICAL"
      ? "healthy"
      : tension.status === "SOUS-SPÉCIFIÉ"
        ? "caution"
        : metrics.totalPainCount === 0
          ? "neutral"
          : "critical";
  const ghostLvl = ghostLevel(metrics.ghostJobCount);

  const hasDetailAlerts =
    report && (report.criticals.length > 0 || report.warnings.length > 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCardShell
          keyword="Couverture"
          title="Écosystème PP ↔ JTBD"
          help={METRIC_HELP.coverage}
          level={coverageLevel}
          footer={<CoverageBadge metrics={metrics} level={coverageLevel} />}
        >
          <RadialCoverageRing pct={metrics.ecosystemCoveragePct} level={coverageLevel} />
          <p className="mt-2 text-center text-xs font-light text-slate-500">
            {metrics.coveredPainCount}/{metrics.totalPainCount} frictions couvertes
          </p>
        </MetricCardShell>

        <MetricCardShell
          keyword="Densité"
          title="Indice JTBD/PP"
          help={METRIC_HELP.density}
          level={tensionLevel}
          footer={
            <TensionStatusBadge
              totalPP={metrics.totalPainCount}
              totalJTBD={metrics.totalJobCount}
            />
          }
        >
          <AlignmentTensionMeter
            totalPP={metrics.totalPainCount}
            totalJTBD={metrics.totalJobCount}
            showHelp={false}
          />
        </MetricCardShell>

        <MetricCardShell
          keyword="Fantômes"
          title="Jobs sans friction"
          help={METRIC_HELP.ghost}
          level={ghostLvl}
          footer={<GhostBadge count={metrics.ghostJobCount} level={ghostLvl} />}
        >
          <p
            className={cn(
              "text-center text-6xl font-light tabular-nums tracking-tight transition-all duration-500 ease-out",
              ghostLvl === "healthy" ? "text-slate-300" : "text-amber-500 font-medium"
            )}
          >
            {metrics.ghostJobCount}
          </p>
        </MetricCardShell>
      </div>

      {hasDetailAlerts && report && (
        <aside className="rounded-xl border border-slate-100 bg-white/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />
            Détail des écarts
          </div>
          <ul className="mt-3 space-y-2">
            {report.criticals.map((item) => (
              <li
                key={item.painId}
                className="rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-sm text-red-900"
              >
                <span className="font-semibold">{item.painLabel}</span>
                <p className="mt-0.5 text-xs">{item.message}</p>
              </li>
            ))}
            {report.warnings.map((item) => (
              <li
                key={item.jobId}
                className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm text-amber-950"
              >
                <span className="font-semibold">{item.jobLabel || "Job sans libellé"}</span>
                <p className="mt-0.5 text-xs">{item.message}</p>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
