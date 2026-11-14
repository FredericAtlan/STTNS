"use client";

import { CheckSquare, Link2, Target, ShieldAlert } from "lucide-react";
import { KpiCard, DynamicBadge, HealthDonut } from "@/components/ui/KpiCard";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

const ICON_STROKE = 1.2;

export type FeaturePortfolioMetrics = {
  total: number;
  withSpecs: number;
  specsPct: number;
  linkedToEpic: number;
  alignmentPct: number;
  build: number;
  killed: number;
  killRate: number;
  inReview: number;
};

export function FeatureSummaryKpis({ metrics }: { metrics: FeaturePortfolioMetrics }) {
  const specsHealthy = metrics.specsPct >= 80;
  const alignmentHealthy = metrics.alignmentPct >= 90;
  const hasReview = metrics.inReview > 0;

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <KpiCard
        icon={<CheckSquare className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Santé Specs"
        title="Specs Complétion"
        help={PAGE_CONTEXT_HELP.featureKpiSpecs}
        footer={
          <div className="text-center">
            <DynamicBadge tone={specsHealthy ? "emerald" : "amber"}>
              {specsHealthy
                ? "🟢 BONNE DÉFINITION"
                : `🟠 ${metrics.total - metrics.withSpecs} SANS SPECS`}
            </DynamicBadge>
          </div>
        }
      >
        <HealthDonut pct={metrics.specsPct} />
        <p className="mt-1 text-center text-[11px] text-slate-500">
          {metrics.withSpecs}/{metrics.total} avec specs
        </p>
      </KpiCard>

      <KpiCard
        icon={<Link2 className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Alignement"
        title="Lien Stratégique"
        help={PAGE_CONTEXT_HELP.featureKpiAlignment}
        footer={
          <div className="text-center">
            <DynamicBadge tone={alignmentHealthy ? "emerald" : "rose"}>
              {alignmentHealthy
                ? "🟢 ALIGNEMENT FORT"
                : `🚨 ${metrics.total - metrics.linkedToEpic} HORS CADRE`}
            </DynamicBadge>
          </div>
        }
      >
        <HealthDonut pct={metrics.alignmentPct} />
        <p className="mt-1 text-center text-[11px] text-slate-500">
          {metrics.linkedToEpic}/{metrics.total} liées à une epic
        </p>
      </KpiCard>

      <KpiCard
        icon={<Target className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Gouvernance"
        title="Décisions BUILD"
        help={PAGE_CONTEXT_HELP.featureKpiBuild}
        footer={
          <div className="text-center">
            <DynamicBadge tone={hasReview ? "amber" : metrics.build > 0 ? "emerald" : "slate"}>
              {hasReview
                ? `⏳ ${metrics.inReview} EN REVUE`
                : metrics.build > 0
                  ? `🟢 ${metrics.build} BUILD ACTÉ${metrics.build > 1 ? "S" : ""}`
                  : "AUCUN BUILD"}
            </DynamicBadge>
          </div>
        }
      >
        <p className="text-center text-6xl font-light tabular-nums tracking-tight text-slate-800">
          {metrics.build}
        </p>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          sur {metrics.total} features actives
        </p>
      </KpiCard>

      <KpiCard
        icon={<ShieldAlert className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Discipline"
        title="Kill Rate"
        help={PAGE_CONTEXT_HELP.featureKpiKillRate}
        helpPlacement="bottom-end"
        helpOffsetClass="mt-24"
        footer={
          <div className="text-center">
            <DynamicBadge tone={metrics.killRate > 0 ? "emerald" : "slate"}>
              {metrics.killRate > 0 ? "🟢 FILTRE ACTIF" : "⚪ AUCUN REJET"}
            </DynamicBadge>
          </div>
        }
      >
        <p className="text-center text-6xl font-light tabular-nums tracking-tight text-slate-800">
          {metrics.killRate}%
        </p>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          {metrics.killed} features tuées
        </p>
      </KpiCard>
    </section>
  );
}
