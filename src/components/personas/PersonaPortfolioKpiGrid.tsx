"use client";

/**
 * @deprecated KPI portfolio catalogue Personas — Étape B (UI → `/why`).
 */
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckSquare, GitBranch, Link2, Users } from "lucide-react";
import { SttnsContextHelp } from "@/components/ui/SttnsContextHelp";
import type { SttnsContextHelpContent } from "@/components/ui/SttnsContextHelp";
import { AlignmentTensionMeter } from "@/components/personas/AlignmentTensionMeter";
import type { PersonaPortfolioMetrics } from "@/lib/personas/personaPortfolioMetrics";
import {
  ecosystemCoverageLevel,
  ghostLevel,
  type PersonaAlignmentLevel,
} from "@/lib/personas/personaCoverage";
import {
  computeAlignmentTension,
  formatTensionRatio,
} from "@/lib/personas/alignmentTension";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { cn } from "@/lib/utils";

const ICON_STROKE = 1.2;

const LEVEL_BORDER: Record<PersonaAlignmentLevel, string> = {
  healthy: "border-emerald-100/80",
  caution: "border-amber-100/80",
  critical: "border-red-100/80",
  neutral: "border-slate-100/80",
};

const LEVEL_STROKE: Record<PersonaAlignmentLevel, string> = {
  healthy: "#10b981",
  caution: "#f59e0b",
  critical: "#ef4444",
  neutral: "#cbd5e1",
};

const LEVEL_ACCENT: Record<PersonaAlignmentLevel, string> = {
  healthy: "text-emerald-600",
  caution: "text-amber-600",
  critical: "text-red-600",
  neutral: "text-slate-800",
};

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

function PersonaKpiCard({
  icon,
  keyword,
  title,
  help,
  level = "neutral",
  children,
  footer,
  helpPlacement = "bottom-start",
  helpOffsetClass,
}: {
  icon: ReactNode;
  keyword: string;
  title: string;
  help: SttnsContextHelpContent;
  level?: PersonaAlignmentLevel;
  children: ReactNode;
  footer?: ReactNode;
  helpPlacement?: "bottom-start" | "bottom-end";
  helpOffsetClass?: string;
}) {
  return (
    <article
      className={cn(
        "relative z-10 flex flex-col rounded-2xl border bg-white/40 p-5 backdrop-blur-md transition-all duration-500 ease-out hover:z-50 focus-within:z-50",
        LEVEL_BORDER[level]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{keyword}</p>
            <h3 className="mt-0.5 font-display text-sm font-light tracking-tight text-slate-800">{title}</h3>
          </div>
        </div>
        <SttnsContextHelp {...help} placement={helpPlacement} offsetClass={helpOffsetClass} size="sm" />
      </div>
      <div className="mt-4 flex-1">{children}</div>
      {footer && <div className="mt-auto">{footer}</div>}
    </article>
  );
}

function CoverageDonut({ pct, level }: { pct: number; level: PersonaAlignmentLevel }) {
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
          stroke={LEVEL_STROKE[level]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduceMotion ? { strokeDashoffset: targetOffset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-3xl font-light tabular-nums tracking-tight", LEVEL_ACCENT[level])}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

export function PersonaPortfolioKpiGrid({ metrics }: { metrics: PersonaPortfolioMetrics }) {
  const { active, all } = metrics;

  const coverageLevel = ecosystemCoverageLevel(
    active.ecosystemCoveragePct,
    active.totalPainCount
  );
  const ghostLvl = ghostLevel(active.ghostJobCount);

  const activeTension = computeAlignmentTension(active.totalPainCount, active.totalJobCount);
  const allTension = computeAlignmentTension(all.totalPainCount, all.totalJobCount);
  const tensionLevel: PersonaAlignmentLevel =
    activeTension.status === "CHIRURGICAL"
      ? "healthy"
      : activeTension.status === "SOUS-SPÉCIFIÉ"
        ? "caution"
        : active.totalPainCount === 0
          ? "neutral"
          : "critical";

  const inactiveCount = metrics.personaCount - metrics.activePersonaCount;
  const matrixAlertCount = metrics.activePersonaCount - metrics.healthyMatrixCountActive;
  const matrixHealthy =
    metrics.activePersonaCount > 0 && matrixAlertCount === 0;
  const coverageComplete =
    active.totalPainCount > 0 && active.ecosystemCoveragePct === 100;

  const tensionBadgeLabel =
    active.totalPainCount === 0
      ? "AUCUN PP"
      : activeTension.status === "CHIRURGICAL"
        ? "🟢 ZONE CHIRURGICALE"
        : activeTension.status === "SOUS-SPÉCIFIÉ"
          ? "⚠ SOUS-SPÉCIFIÉ"
          : "🚨 SURCHARGE";

  const tensionBadgeTone: "emerald" | "amber" | "rose" | "slate" =
    active.totalPainCount === 0
      ? "slate"
      : activeTension.status === "CHIRURGICAL"
        ? "emerald"
        : activeTension.status === "SOUS-SPÉCIFIÉ"
          ? "amber"
          : "rose";

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        <span className="font-semibold tabular-nums text-slate-800">{metrics.activePersonaCount}</span>{" "}
        actif{metrics.activePersonaCount > 1 ? "s" : ""}
        <span className="mx-2 text-slate-300" aria-hidden>
          ·
        </span>
        <span className="tabular-nums">{inactiveCount}</span> inactif{inactiveCount > 1 ? "s" : ""}
        <span className="mx-2 text-slate-300" aria-hidden>
          ·
        </span>
        <span className="tabular-nums">{metrics.tierCountActive}</span> segment
        {metrics.tierCountActive > 1 ? "s" : ""} couverts
      </p>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-4 md:items-stretch">
        <PersonaKpiCard
          icon={<Link2 className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
          keyword="Couverture"
          title="PP ↔ JTBD"
          level={coverageLevel}
          help={PAGE_CONTEXT_HELP.personaKpiPpJtbd}
          footer={
            <div className="text-center">
              <DynamicBadge tone={coverageComplete ? "emerald" : coverageLevel === "critical" ? "rose" : "amber"}>
                {coverageComplete
                  ? "🟢 COUVERTURE COMPLÈTE"
                  : active.totalPainCount === 0
                    ? "AUCUN PP SAISI"
                    : `🟠 ${active.ignoredPainCount} PP IGNORÉ${active.ignoredPainCount > 1 ? "S" : ""}`}
              </DynamicBadge>
            </div>
          }
        >
          <CoverageDonut pct={active.ecosystemCoveragePct} level={coverageLevel} />
          <p className="mt-1 text-center text-[11px] text-slate-500">
            {active.coveredPainCount}/{active.totalPainCount} PP couverts · global {all.ecosystemCoveragePct}%
          </p>
        </PersonaKpiCard>

        <PersonaKpiCard
          icon={<GitBranch className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
          keyword="Densité"
          title="Indice PP / JTBD"
          level={tensionLevel}
          help={PAGE_CONTEXT_HELP.personaKpiDensity}
          footer={
            <div className="text-center">
              <DynamicBadge tone={tensionBadgeTone}>{tensionBadgeLabel}</DynamicBadge>
            </div>
          }
        >
          <AlignmentTensionMeter
            totalPP={active.totalPainCount}
            totalJTBD={active.totalJobCount}
            showHelp={false}
            compact
          />
          <p className="mt-3 text-center text-3xl font-light tabular-nums tracking-tight text-slate-800">
            {active.totalPainCount === 0 ? "—" : formatTensionRatio(activeTension.ratio)}
          </p>
          <p className="mt-1 text-center text-[11px] text-slate-500">
            {all.totalPainCount === 0
              ? "—"
              : `${formatTensionRatio(allTension.ratio)} global · ${all.totalJobCount} JTBD / ${all.totalPainCount} PP`}
          </p>
        </PersonaKpiCard>

        <PersonaKpiCard
          icon={<CheckSquare className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
          keyword="Matrice"
          title="Matrice OK"
          level={matrixHealthy ? "healthy" : matrixAlertCount > 0 ? "caution" : "neutral"}
          help={PAGE_CONTEXT_HELP.personaKpiMatrix}
          footer={
            <div className="text-center">
              <DynamicBadge tone={matrixHealthy ? "emerald" : matrixAlertCount > 0 ? "amber" : "slate"}>
                {matrixHealthy
                  ? "🟢 MATRICE OK"
                  : metrics.activePersonaCount === 0
                    ? "AUCUN ACTIF"
                    : `🟠 ${matrixAlertCount} ALERTE${matrixAlertCount > 1 ? "S" : ""}`}
              </DynamicBadge>
            </div>
          }
        >
          <p className="text-center text-5xl font-light tabular-nums tracking-tight text-slate-800">
            {metrics.healthyMatrixCountActive}
            <span className="text-2xl text-slate-400">/{metrics.activePersonaCount}</span>
          </p>
          <p className="mt-1 text-center text-[11px] text-slate-500">
            actifs conformes · {metrics.healthyMatrixCountAll}/{metrics.personaCount} toutes fiches
          </p>
        </PersonaKpiCard>

        <PersonaKpiCard
          icon={<Users className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
          keyword="Alerte"
          title="Fantômes"
          level={ghostLvl}
          help={PAGE_CONTEXT_HELP.personaKpiGhosts}
          helpPlacement="bottom-end"
          helpOffsetClass="mt-24"
          footer={
            <div className="text-center">
              <DynamicBadge tone={ghostLvl === "healthy" ? "emerald" : ghostLvl === "caution" ? "amber" : "rose"}>
                {active.ghostJobCount === 0
                  ? "🟢 0 FANTÔME"
                  : `🚨 ${active.ghostJobCount} JOB${active.ghostJobCount > 1 ? "S" : ""} FANTÔME${active.ghostJobCount > 1 ? "S" : ""}`}
              </DynamicBadge>
            </div>
          }
        >
          <p
            className={cn(
              "text-center text-6xl font-light tabular-nums tracking-tight",
              ghostLvl === "healthy" ? "text-slate-200" : "font-medium text-amber-600"
            )}
          >
            {String(active.ghostJobCount).padStart(2, "0")}
          </p>
          <p className="mt-1 text-center text-[11px] text-slate-500">
            jobs sans friction · {all.ghostJobCount} au total
          </p>
        </PersonaKpiCard>
      </section>
    </div>
  );
}
