"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BarChart3, Compass, Link2Off, Target } from "lucide-react";
import { SttnsContextHelp } from "@/components/ui/SttnsContextHelp";
import type { SttnsContextHelpContent } from "@/components/ui/SttnsContextHelp";
import type { NsmPortfolioKpis } from "@/lib/metrics/nsmCoverage";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { cn } from "@/lib/utils";

const ICON_STROKE = 1.2;

function formatCount(count: number): string {
  return count.toString().padStart(2, "0");
}

function KpiCard({
  icon,
  keyword,
  title,
  help,
  children,
  footer,
  className,
  helpPlacement = "bottom-start",
  helpOffsetClass,
}: {
  icon: ReactNode;
  keyword: string;
  title: string;
  help: SttnsContextHelpContent;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  helpPlacement?: "bottom-start" | "bottom-end";
  helpOffsetClass?: string;
}) {
  return (
    <article
      className={cn(
        "relative z-10 flex flex-col rounded-2xl border border-slate-100/80 bg-white/40 p-5 backdrop-blur-md transition-all duration-500 ease-out hover:z-50 focus-within:z-50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              {keyword}
            </p>
            <h3 className="mt-0.5 font-display text-sm font-light tracking-tight text-slate-800">
              {title}
            </h3>
          </div>
        </div>
        <SttnsContextHelp {...help} placement={helpPlacement} offsetClass={helpOffsetClass} size="sm" />
      </div>
      <div className="mt-4 flex-1">{children}</div>
      {footer && <div className="mt-auto">{footer}</div>}
    </article>
  );
}

function CoverageDonut({ pct, secondaryPct = 0 }: { pct: number; secondaryPct?: number }) {
  const reduceMotion = useReducedMotion();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  
  // Le pct total (ex: 80%)
  const totalOffset = circumference - (pct / 100) * circumference;
  
  // La portion "livrée" (ex: 30%)
  const secondaryOffset = circumference - (secondaryPct / 100) * circumference;

  return (
    <div className="relative mx-auto h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={radius} fill="none" className="stroke-slate-100" strokeWidth="3" />
        
        {/* Cercle Vert Clair (Total Backlog + Livré) */}
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className="stroke-emerald-400"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduceMotion ? { strokeDashoffset: totalOffset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: totalOffset }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Cercle Vert Foncé (Livré uniquement) par dessus */}
        {secondaryPct > 0 && (
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className="stroke-emerald-600"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={reduceMotion ? { strokeDashoffset: secondaryOffset } : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: secondaryOffset }}
            transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-light tabular-nums tracking-tight text-slate-800">{pct}%</span>
      </div>
    </div>
  );
}

function DynamicBadge({
  tone,
  children,
}: {
  tone: "emerald" | "amber" | "rose" | "slate";
  children: ReactNode;
}) {
  const styles = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  };
  return (
    <span
      className={cn(
        "mt-3 inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        styles[tone]
      )}
    >
      {children}
    </span>
  );
}

export function NsmCoverageKpis({ kpis }: { kpis: NsmPortfolioKpis }) {
  const fullCoverage = kpis.coveragePct === 100;
  const noGaps = kpis.orphanMetricNodes === 0;
  const nsmTouched = kpis.nsmStoryCount > 0;
  const allStoriesAligned =
    kpis.eligibleStoryCount > 0 && kpis.storiesWithCoverage === kpis.eligibleStoryCount;

  return (
    <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
      <KpiCard
        icon={<Target className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Couverture"
        title="Arbre métrique"
        help={PAGE_CONTEXT_HELP.nsmKpiTreeCoverage}
        footer={
          <div className="text-center">
            <DynamicBadge tone={fullCoverage ? "emerald" : "amber"}>
              {fullCoverage
                ? "🟢 ARBRE COMPLET"
                : `🟠 ${kpis.orphanMetricNodes} TROU${kpis.orphanMetricNodes > 1 ? "S" : ""}`}
            </DynamicBadge>
          </div>
        }
      >
        <CoverageDonut pct={kpis.coveragePct} secondaryPct={kpis.deliveredPct} />
        <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
            {kpis.deliveredMetricNodes} livrés
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            {kpis.coveredMetricNodes - kpis.deliveredMetricNodes} backlog
          </span>
        </div>
      </KpiCard>

      <KpiCard
        icon={<Compass className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="North Star"
        title="Alignement NSM"
        help={PAGE_CONTEXT_HELP.nsmKpiNsmAlignment}
        footer={
          <div className="text-center">
            <DynamicBadge tone={nsmTouched ? "emerald" : "rose"}>
              {nsmTouched ? "🟢 NSM ADRESSÉE" : "🚨 NSM NON COUVERTE"}
            </DynamicBadge>
          </div>
        }
      >
        <div className="flex items-center justify-center gap-3 py-4">
          <span className="flex h-10 min-w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-2 text-sm font-bold text-emerald-900">
            E{kpis.nsmEpicCount}
          </span>
          <span className="flex h-10 min-w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-2 text-sm font-bold text-emerald-900">
            U{kpis.nsmStoryCount}
          </span>
        </div>
        <p className="text-center text-[11px] text-slate-500">
          Stories validées touchant la North Star
        </p>
      </KpiCard>

      <KpiCard
        icon={<Link2Off className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Trous"
        title="Métriques orphelines"
        help={PAGE_CONTEXT_HELP.nsmKpiOrphanMetrics}
        footer={
          !noGaps && (
            <div className="text-center">
              <DynamicBadge tone="rose">
                🚨 {kpis.orphanMetricNodes} SANS STORY
              </DynamicBadge>
            </div>
          )
        }
        className={noGaps ? "border-slate-100/60" : undefined}
      >
        <p
          className={cn(
            "text-center text-6xl font-light tabular-nums tracking-tight transition-all duration-500 ease-out",
            noGaps ? "text-slate-200" : "animate-pulse font-medium text-rose-500"
          )}
        >
          {formatCount(kpis.orphanMetricNodes)}
        </p>
        {noGaps ? (
          <div className="mt-2 text-center">
            <DynamicBadge tone="emerald">🟢 0 TROU</DynamicBadge>
          </div>
        ) : (
          <p className="mt-2 text-center text-[11px] text-slate-500">
            NSM + sous-métriques sans story validée
          </p>
        )}
      </KpiCard>

      <KpiCard
        icon={<BarChart3 className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Backlog"
        title="Stories alignées"
        help={PAGE_CONTEXT_HELP.nsmKpiAlignedStories}
        helpPlacement="bottom-end"
        helpOffsetClass="mt-24"
        footer={
          <div className="text-center">
            <DynamicBadge tone={allStoriesAligned ? "emerald" : "slate"}>
              {allStoriesAligned
                ? "🟢 TOUTES ALIGNÉES"
                : `E${kpis.distinctEpicsInTree} · ${kpis.storiesWithCoverage}/${kpis.eligibleStoryCount} U`}
            </DynamicBadge>
          </div>
        }
      >
        <p className="text-center text-5xl font-light tabular-nums tracking-tight text-slate-800">
          {kpis.storiesWithCoverage}
          <span className="text-2xl text-slate-400">/{kpis.eligibleStoryCount}</span>
        </p>
        <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <span>{kpis.eligibleStoryCount > 0 ? Math.round((kpis.storiesWithCoverage / kpis.eligibleStoryCount) * 100) : 0}% d&apos;alignement</span>
        </div>
      </KpiCard>
    </section>
  );
}
