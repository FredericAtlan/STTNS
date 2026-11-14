import Link from "next/link";
import { AlertTriangle, Clock, TrendingDown, Unlink } from "lucide-react";
import type { GlobalHygieneSummary } from "@/lib/sttns/adminData";

export function AdminGlobalHygieneSummary({ summary }: { summary: GlobalHygieneSummary }) {
  const items = [
    {
      label: "Features orphelines",
      value: summary.orphanFeatures,
      icon: Unlink,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Stories stagnantes (>5j)",
      value: summary.stagnantStories,
      icon: Clock,
      tone: "text-orange-700 bg-orange-50",
    },
    {
      label: "Features Impact 0",
      value: summary.lowRiceEpics,
      icon: TrendingDown,
      tone: "text-violet-700 bg-violet-50",
    },
  ];

  return (
    <section className="sttns-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Hygiène Spine — vue instance
          </h3>
          <p className="mt-1 text-sm text-sttns-muted">
            Agrégat sur {summary.activeProjects} projet
            {summary.activeProjects > 1 ? "s" : ""} actif
            {summary.activeProjects > 1 ? "s" : ""}. Détail par projet dans chaque Radar
            d&apos;Hygiène.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-lg border border-slate-100 p-4 ${tone}`}
          >
            <Icon className="h-5 w-5 shrink-0 opacity-80" />
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-semibold opacity-90">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-sttns-muted">
        Ouvrez le{" "}
        <Link href="/admin/projects" className="font-semibold text-sttns-accent hover:underline">
          catalogue projets
        </Link>{" "}
        puis le Radar d&apos;Hygiène de chaque projet pour agir sur les alertes.
      </p>
    </section>
  );
}
