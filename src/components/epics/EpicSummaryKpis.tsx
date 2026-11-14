"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckSquare, GalleryVertical, Ghost, Rocket } from "lucide-react";
import type { EpicPortfolioMetrics } from "@/lib/epics/epicPortfolioMetrics";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { cn } from "@/lib/utils";
import { KpiCard, DynamicBadge } from "@/components/ui/KpiCard";

const ICON_STROKE = 1.2;

function formatCount(count: number): string {
  return count.toString().padStart(2, "0");
}

function DorDonut({ pct }: { pct: number }) {
  const reduceMotion = useReducedMotion();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative mx-auto h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={radius} fill="none" className="stroke-slate-100" strokeWidth="3" />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className="stroke-emerald-500"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduceMotion ? { strokeDashoffset: targetOffset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-light tabular-nums tracking-tight text-slate-800">{pct}%</span>
      </div>
    </div>
  );
}

function LifecycleBar({ metrics }: { metrics: EpicPortfolioMetrics }) {
  const segments = [
    { key: "ready", count: metrics.readyCount, className: "bg-blue-500" },
    { key: "progress", count: metrics.inProgressCount, className: "bg-emerald-500" },
    { key: "done", count: metrics.doneCount, className: "bg-slate-400" },
  ].filter((s) => s.count > 0);

  const activeTotal = segments.reduce((sum, s) => sum + s.count, 0);
  const draftCount = metrics.epicCount - activeTotal;

  if (metrics.epicCount === 0) {
    return (
      <p className="py-6 text-center text-sm font-light text-slate-400">Aucune epic</p>
    );
  }

  const allSegments = [
    ...(draftCount > 0 ? [{ key: "draft", count: draftCount, className: "bg-zinc-300" }] : []),
    ...segments,
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
        {allSegments.map((segment) => (
          <motion.div
            key={segment.key}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", segment.className)}
            initial={{ width: 0 }}
            animate={{ width: `${(segment.count / metrics.epicCount) * 100}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            title={`${segment.count} epic${segment.count > 1 ? "s" : ""}`}
          />
        ))}
      </div>
      <p className="text-center text-3xl font-light tabular-nums tracking-tight text-slate-800">
        {metrics.readyCount + metrics.inProgressCount}
        <span className="text-lg text-slate-400"> actives</span>
      </p>
      <p className="text-center text-[11px] text-slate-500">
        {metrics.readyCount} prête{metrics.readyCount > 1 ? "s" : ""} · {metrics.inProgressCount} en
        cours · {metrics.doneCount} terminée{metrics.doneCount > 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function EpicSummaryKpis({ metrics }: { metrics: EpicPortfolioMetrics }) {
  const dorComplete = metrics.epicCount > 0 && metrics.dorCompliancePct === 100;
  const noGhosts = metrics.ghostCount === 0;
  const noCascadeIssues = metrics.cascadeInconsistencyCount === 0;
  const storyValidationPct =
    metrics.totalLinkedStories > 0
      ? Math.round((metrics.validatedStoryCount / metrics.totalLinkedStories) * 100)
      : 0;

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <KpiCard
        icon={<CheckSquare className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Santé DoR"
        title="Epic Health Score"
        help={PAGE_CONTEXT_HELP.epicKpiDor}
        footer={
          <div className="text-center">
            <DynamicBadge tone={dorComplete ? "emerald" : "amber"}>
              {dorComplete
                ? "🟢 DOR RESPECTÉE"
                : `🟠 ${metrics.incompleteDorCount} EPIC${metrics.incompleteDorCount > 1 ? "S" : ""} INCOMPLÈTE${metrics.incompleteDorCount > 1 ? "S" : ""}`}
            </DynamicBadge>
          </div>
        }
      >
        <DorDonut pct={metrics.dorCompliancePct} />
        <p className="mt-1 text-center text-[11px] text-slate-500">
          Nom + définition + ≥ 1 story
        </p>
      </KpiCard>

      <KpiCard
        icon={<Ghost className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Fantômes"
        title="Ghost Epics"
        help={PAGE_CONTEXT_HELP.epicKpiGhost}
        footer={
          <div className="text-center">
            <DynamicBadge tone={noGhosts ? "emerald" : "rose"}>
              {noGhosts
                ? "🟢 0 FANTÔME"
                : `🚨 ${metrics.ghostCount} SANS STORY`}
            </DynamicBadge>
          </div>
        }
        className={noGhosts ? "border-slate-100/60" : undefined}
      >
        <p
          className={cn(
            "text-center text-6xl font-light tabular-nums tracking-tight transition-all duration-500 ease-out",
            noGhosts ? "text-slate-200" : "animate-pulse font-medium text-rose-500"
          )}
        >
          {formatCount(metrics.ghostCount)}
        </p>
        {!noGhosts && (
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Coquilles sans moisson bottom-up
          </p>
        )}
      </KpiCard>

      <KpiCard
        icon={<Rocket className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Cycle de vie"
        title="Portefeuille actif"
        help={PAGE_CONTEXT_HELP.epicKpiLifecycle}
        footer={
          <div className="text-center">
            <DynamicBadge tone={metrics.readyCount > 0 ? "emerald" : "slate"}>
              {metrics.readyCount > 0
                ? `🟢 ${metrics.readyCount} PRÊTE${metrics.readyCount > 1 ? "S" : ""}`
                : "AUCUNE READY"}
            </DynamicBadge>
          </div>
        }
      >
        <LifecycleBar metrics={metrics} />
      </KpiCard>

      <KpiCard
        icon={<GalleryVertical className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Stories"
        title="Couverture backlog"
        help={PAGE_CONTEXT_HELP.epicKpiStoriesCoverage}
        helpPlacement="bottom-end"
        helpOffsetClass="mt-24"
        footer={
          <div className="text-center">
            <DynamicBadge tone={noCascadeIssues ? "emerald" : "amber"}>
              {noCascadeIssues
                ? "🟢 CASCADE OK"
                : `⚠ ${metrics.cascadeInconsistencyCount} CASCADE`}
            </DynamicBadge>
          </div>
        }
      >
        <p className="text-center text-5xl font-light tabular-nums tracking-tight text-slate-800">
          {metrics.validatedStoryCount}
          <span className="text-2xl text-slate-400">/{metrics.totalLinkedStories}</span>
        </p>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          Stories validées · {storyValidationPct}% du lien epic
        </p>
      </KpiCard>
    </section>
  );
}
