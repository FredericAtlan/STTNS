import { AlertTriangle, BarChart3, CheckCircle2, Layers3 } from "lucide-react";
import type { SttnsInitiative, SttnsModule, SttnsUserStory } from "@/types/sttns";
import {
  countCoverageModules,
  countOpenReviewInitiatives,
  countPendingCeoInitiatives,
  countRecentInitiatives,
  countStoriesWithoutImpactMetric,
} from "@/lib/sttns/arbitrage";
import { initiativesForModule } from "@/lib/sttns/modules";
import { cn } from "@/lib/utils";

function ModuleBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const width = total > 0 ? Math.max(6, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="font-mono text-slate-500">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function AlertItem({
  title,
  note,
  tone = "amber",
}: {
  title: string;
  note: string;
  tone?: "amber" | "red" | "emerald" | "slate";
}) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    slate: "border-slate-200 bg-slate-50 text-slate-900",
  } as const;
  return (
    <div className={cn("rounded-xl border p-3", tones[tone])}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-0.5 text-xs opacity-80">{note}</p>
        </div>
      </div>
    </div>
  );
}

export function SummaryAnalyticsPanel({
  initiatives,
  modules,
  stories,
}: {
  initiatives: SttnsInitiative[];
  modules: SttnsModule[];
  stories: Pick<SttnsUserStory, "impact_metric_id" | "impacts_north_star">[];
}) {
  const coverage = countCoverageModules(modules, initiatives);
  const pendingCeo = countPendingCeoInitiatives(initiatives);
  const openReview = countOpenReviewInitiatives(initiatives);
  const recent7d = countRecentInitiatives(initiatives, 7);
  const storiesWithoutImpact = countStoriesWithoutImpactMetric(stories);

  const moduleRows = modules
    .map((mod) => ({
      label: mod.name,
      value: initiativesForModule(initiatives, mod).length,
    }))
    .sort((a, b) => b.value - a.value);

  const alerts = [
    pendingCeo > 0
      ? {
          title: `${pendingCeo} feature(s) pending CEO`,
          note: "Resolve these first to unblock the pipeline.",
          tone: "red" as const,
        }
      : null,
    openReview > 0
      ? {
          title: `${openReview} feature(s) still in review`,
          note: "Review open feedback before restarting phase 2.",
          tone: "amber" as const,
        }
      : null,
    storiesWithoutImpact > 0
      ? {
          title: `${storiesWithoutImpact} user story(s) without impact metric`,
          note: "Connect these stories to a metric or the North Star.",
          tone: "amber" as const,
        }
      : null,
  ].filter(Boolean) as { title: string; note: string; tone: "amber" | "red" | "emerald" | "slate" }[];

  return (
    <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sttns-accent">
            Analytics
          </p>
          <h3 className="mt-1 flex items-center gap-2 font-display text-xl font-extrabold text-slate-900">
            <BarChart3 className="h-5 w-5 text-emerald-700" />
            Lecture opérationnelle
          </h3>
          <p className="mt-1 text-sm text-sttns-muted">
            Module coverage, alerts, and pace of recent changes.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-700">
            Coverage
          </p>
          <p className="font-mono text-lg font-extrabold text-emerald-900">
            {coverage.total ? `${coverage.covered}/${coverage.total}` : "0/0"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-sttns-accent" />
            <h4 className="font-bold text-slate-900">Module breakdown</h4>
          </div>
          <div className="space-y-3">
            {moduleRows.length > 0 ? (
              moduleRows.map((row) => (
                <ModuleBar key={row.label} label={row.label} value={row.value} total={initiatives.length} />
              ))
            ) : (
              <p className="text-sm text-sttns-muted">No module defined.</p>
            )}
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3">
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-800">Features without a module</span>
                <span className="font-mono text-slate-500">{coverage.unassigned}</span>
              </div>
              <p className="text-xs text-sttns-muted">
                Fix this to avoid gray areas in roadmap and reporting.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h4 className="font-bold text-slate-900">Next actions</h4>
          </div>
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => <AlertItem key={alert.title} {...alert} />)
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">No critical alerts</p>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      The flow is healthy. You can keep enriching the product base.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                7-day pace
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900">{recent7d}</p>
              <p className="mt-1 text-xs text-sttns-muted">features touched during the last week</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
