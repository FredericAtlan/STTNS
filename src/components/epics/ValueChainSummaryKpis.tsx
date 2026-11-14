"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckSquare, GitCompare, Target } from "lucide-react";
import { SttnsContextHelp } from "@/components/ui/SttnsContextHelp";
import type { SttnsContextHelpContent } from "@/components/ui/SttnsContextHelp";
import type { ValueChainMap, ValueChainMapSummary } from "@/lib/epics/valueChainMapping";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { cn } from "@/lib/utils";
import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import Link from "next/link";
import { useState } from "react";

const ICON_STROKE = 1.2;

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

function HealthDonut({ pct }: { pct: number }) {
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

function CoverageGauge({ pct, secondaryPct = 0 }: { pct: number; secondaryPct?: number }) {
  const isHealthy = pct >= 70;
  const isLow = pct < 40;

  // secondaryPct is the "Delivered" portion (dark green), pct is the total covered (light green + dark green)
  // We'll render the total bar first, then the secondary bar on top of it, or side-by-side.
  // Actually, let's render them side-by-side or stacked.
  // The total width is `pct`. The dark part is `secondaryPct`. The light part is `pct - secondaryPct`.
  const primaryWidth = Math.max(0, pct - secondaryPct);

  return (
    <div>
      <div className="relative flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        {secondaryPct > 0 && (
          <motion.div
            className="h-full bg-emerald-600"
            initial={{ width: 0 }}
            animate={{ width: `${secondaryPct}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
        {primaryWidth > 0 && (
          <motion.div
            className={cn(
              "h-full",
              isLow ? "bg-rose-400" : isHealthy ? "bg-emerald-400" : "bg-amber-400"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${primaryWidth}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </div>
      <p className="mt-4 text-center text-3xl font-light tabular-nums tracking-tight text-slate-800">
        {pct}%
      </p>
    </div>
  );
}

export function ValueChainSummaryKpis({
  map,
  projectSlug,
}: {
  map: ValueChainMap;
  projectSlug: string;
}) {
  const summary = map.summary;
  const [orphansOpen, setOrphansOpen] = useState(false);

  const chainHealthy = summary.totalStoryCount > 0 && summary.chainHealthPct === 100;
  const noOrphans = summary.totalOrphanSignals === 0;
  const jtbdHealthy = summary.jtbdTotalCount > 0 && summary.jtbdCoveragePct >= 70;
  const metricHealthy = summary.metricTotalCount > 0 && summary.metricCoveragePct >= 70;

  const density = summary.jtbdTotalCount > 0 ? summary.totalStoryCount / summary.jtbdTotalCount : 0;
  const isDensityLow = density < 1;
  const isDensityHigh = density > 4;

  const orphanPains = map.rows.filter((r) => r.painPoint?.isOrphan).map((r) => r.painPoint!);
  const orphanJtbds = map.rows.filter((r) => r.jtbd?.isOrphan).map((r) => r.jtbd!);
  const orphanStories = [
    ...map.rows.map((r) => r.story).filter((s) => s?.isOrphan),
    ...map.unassignedStories.filter((s) => s.isOrphan),
  ];
  const ghostEpics = map.ghostEpics;
  const orphanMetrics = map.orphanMetrics;

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <KpiCard
        icon={<CheckSquare className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Santé chaîne"
        title="Value Chain Health"
        help={PAGE_CONTEXT_HELP.summaryValueChainHealth}
        footer={
          <div className="text-center">
            <DynamicBadge tone={chainHealthy ? "emerald" : "amber"}>
              {chainHealthy
                ? "🟢 CHAÎNE COMPLÈTE"
                : `🟠 ${summary.totalStoryCount - summary.alignedStoryCount} STOR${summary.totalStoryCount - summary.alignedStoryCount > 1 ? "IES" : "Y"} INCOMPLÈTE${summary.totalStoryCount - summary.alignedStoryCount > 1 ? "S" : ""}`}
            </DynamicBadge>
          </div>
        }
      >
        <HealthDonut pct={summary.chainHealthPct} />
        <p className="mt-1 text-center text-[11px] text-slate-500">
          {summary.alignedStoryCount}/{summary.totalStoryCount} stories alignées
        </p>
      </KpiCard>

      <KpiCard
        icon={<AlertTriangle className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="Orphelins"
        title="Orphan Alert"
        help={PAGE_CONTEXT_HELP.summaryValueChainOrphans}
        footer={
          !noOrphans && (
            <div className="text-center">
              <DynamicBadge tone="rose">
                🚨 {summary.orphanPersonaCount} Pers · {summary.orphanPainCount} PP · {summary.orphanJtbdCount} JTBD · {summary.orphanStoryCount} US · {summary.ghostEpicCount} E · {summary.orphanMetricCount} NSM
              </DynamicBadge>
            </div>
          )
        }
        className={cn(
          noOrphans ? "border-slate-100/60" : "cursor-pointer hover:border-rose-200 hover:bg-rose-50/50"
        )}
      >
        <button
          type="button"
          onClick={() => !noOrphans && setOrphansOpen(true)}
          className="w-full text-left focus:outline-none"
          disabled={noOrphans}
        >
          <p
            className={cn(
              "text-center text-6xl font-light tabular-nums tracking-tight transition-all duration-500 ease-out",
              noOrphans ? "text-slate-200" : "animate-pulse font-medium text-rose-500 hover:text-rose-600"
            )}
          >
            {summary.totalOrphanSignals.toString().padStart(2, "0")}
          </p>
          {noOrphans ? (
            <div className="mt-2 text-center">
              <DynamicBadge tone="emerald">🟢 0 SIGNAL</DynamicBadge>
            </div>
          ) : (
            <p className="mt-2 text-center text-[11px] font-medium text-rose-600 hover:underline">
              Voir le détail →
            </p>
          )}
        </button>
      </KpiCard>

      <KpiCard
        icon={<GitCompare className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="JTBD"
        title="Job Coverage"
        help={PAGE_CONTEXT_HELP.summaryValueChainJtbd}
        footer={
          summary.jtbdTotalCount > 0 && (
            <div className="text-center">
              <DynamicBadge tone={jtbdHealthy ? "emerald" : "amber"}>
                {jtbdHealthy ? "🟢 JOBS ADRESSÉS" : "⚠ JOBS SANS STORY"}
              </DynamicBadge>
            </div>
          )
        }
      >
        {summary.jtbdTotalCount > 0 ? (
          <>
            <CoverageGauge pct={summary.jtbdCoveragePct} />
            <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <span>{summary.jtbdCoveredCount}/{summary.jtbdTotalCount} JTBD avec story</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-600">
                {(summary.totalStoryCount / summary.jtbdTotalCount).toFixed(1)} stories/JTBD
              </span>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-sm font-light text-slate-400">Aucun JTBD défini</p>
        )}
      </KpiCard>

      <KpiCard
        icon={<Target className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />}
        keyword="NSM"
        title="Metric Coverage"
        help={PAGE_CONTEXT_HELP.summaryValueChainMetrics}
        helpPlacement="bottom-end"
        helpOffsetClass="mt-24"
        footer={
          summary.metricTotalCount > 0 && (
            <div className="text-center">
              <DynamicBadge tone={metricHealthy ? "emerald" : "slate"}>
                {metricHealthy
                  ? `🟢 ${summary.metricTotalCount - summary.orphanMetricCount} MÉTRIQUES COUVERTES`
                  : `⚡ ${summary.orphanMetricCount} TROU${summary.orphanMetricCount > 1 ? "S" : ""}`}
              </DynamicBadge>
            </div>
          )
        }
      >
        {summary.metricTotalCount > 0 ? (
          <>
            <CoverageGauge pct={summary.metricCoveragePct} secondaryPct={summary.metricDeliveredPct} />
            <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                {summary.metricDeliveredCount} livrées
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                {summary.metricTotalCount - summary.orphanMetricCount - summary.metricDeliveredCount} backlog
              </span>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-sm font-light text-slate-400">Arbre NSM vide</p>
        )}
      </KpiCard>

      <SttnsSlideOver
        open={orphansOpen}
        onClose={() => setOrphansOpen(false)}
        title="Détail des Orphelins"
        eyebrow="Grooming Backlog"
      >
        <div className="space-y-8">
          {orphanPains.length > 0 && (
            <section>
              <h3 className="font-display text-sm font-bold text-rose-800">
                Frictions ignorées ({orphanPains.length})
              </h3>
              <p className="mb-3 text-xs text-slate-500">
                Pain points identifiés mais non adressés par un JTBD.
              </p>
              <ul className="space-y-2">
                {orphanPains.map((p) => (
                  <li key={p.id} className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-sm">
                    <span className="font-medium text-slate-800">{p.label}</span>
                    <div className="mt-2 text-xs">
                      <Link
                        href={`/projects/${projectSlug}/why`}
                        className="font-medium text-rose-600 hover:underline"
                        onClick={() => setOrphansOpen(false)}
                      >
                        Aller à la Matrice Besoins →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {orphanJtbds.length > 0 && (
            <section>
              <h3 className="font-display text-sm font-bold text-rose-800">
                JTBD sans story ({orphanJtbds.length})
              </h3>
              <p className="mb-3 text-xs text-slate-500">
                Objectifs utilisateurs sans aucune solution prévue dans le backlog.
              </p>
              <ul className="space-y-2">
                {orphanJtbds.map((j) => (
                  <li key={j.id} className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-sm">
                    <span className="font-medium text-slate-800">{j.label}</span>
                    <div className="mt-2 text-xs">
                      <Link
                        href={`/projects/${projectSlug}/user-stories/new`}
                        className="font-medium text-rose-600 hover:underline"
                        onClick={() => setOrphansOpen(false)}
                      >
                        Créer une story →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {orphanStories.length > 0 && (
            <section>
              <h3 className="font-display text-sm font-bold text-rose-800">
                Stories incomplètes ({orphanStories.length})
              </h3>
              <p className="mb-3 text-xs text-slate-500">
                Stories sans Persona, sans JTBD, sans Epic ou sans Métrique.
              </p>
              <ul className="space-y-2">
                {orphanStories.map((s) => (
                  <li key={s!.id} className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-sm">
                    <span className="font-medium text-slate-800">{s!.title}</span>
                    <div className="mt-2 text-xs">
                      <Link
                        href={`/projects/${projectSlug}/user-stories/${s!.id}`}
                        className="font-medium text-rose-600 hover:underline"
                        onClick={() => setOrphansOpen(false)}
                      >
                        Compléter la story →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {ghostEpics.length > 0 && (
            <section>
              <h3 className="font-display text-sm font-bold text-rose-800">
                Epics fantômes ({ghostEpics.length})
              </h3>
              <p className="mb-3 text-xs text-slate-500">
                Epics créées mais sans aucune story rattachée.
              </p>
              <ul className="space-y-2">
                {ghostEpics.map((e) => (
                  <li key={e.id} className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-sm">
                    <span className="font-medium text-slate-800">{e.title}</span>
                    <div className="mt-2 text-xs">
                      <Link
                        href={`/projects/${projectSlug}/epics/${e.id}`}
                        className="font-medium text-rose-600 hover:underline"
                        onClick={() => setOrphansOpen(false)}
                      >
                        Gérer l&apos;epic →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {orphanMetrics.length > 0 && (
            <section>
              <h3 className="font-display text-sm font-bold text-rose-800">
                Métriques non couvertes ({orphanMetrics.length})
              </h3>
              <p className="mb-3 text-xs text-slate-500">
                Leviers de croissance ignorés par la roadmap actuelle.
              </p>
              <ul className="space-y-2">
                {orphanMetrics.map((m) => (
                  <li key={m.key} className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-sm">
                    <span className="font-medium text-slate-800">{m.label}</span>
                    <div className="mt-2 text-xs">
                      <Link
                        href={`/projects/${projectSlug}/nsm`}
                        className="font-medium text-rose-600 hover:underline"
                        onClick={() => setOrphansOpen(false)}
                      >
                        Voir l&apos;arbre NSM →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </SttnsSlideOver>
    </section>
  );
}
