"use client";

import { AlertTriangle, CircleCheck } from "lucide-react";
import { PersonaHealthPill } from "@/components/personas/personaUi";
import { SttnsContextHelp } from "@/components/ui/SttnsContextHelp";
import type { PersonaCatalogHealth } from "@/lib/personas/personaCatalogHealth";
import type { PersonaCoverageReport } from "@/lib/personas/personaCoverage";
import { cn } from "@/lib/utils";

function healthFromReport(
  report: PersonaCoverageReport,
  painCount: number,
  jobCount: number
): PersonaCatalogHealth {
  if (painCount === 0 && jobCount === 0) {
    return {
      level: "empty",
      criticalCount: 0,
      warningCount: 0,
      matrixReady: false,
      label: "Vide",
      tip: "Aucune friction ni job renseigné.",
    };
  }
  if (painCount === 0 || jobCount === 0) {
    return {
      level: "incomplete",
      criticalCount: 0,
      warningCount: 0,
      matrixReady: false,
      label: "À compléter",
      tip: "Il manque des frictions ou des jobs to be done.",
    };
  }
  if (report.criticals.length > 0) {
    return {
      level: "critical",
      criticalCount: report.criticals.length,
      warningCount: report.warnings.length,
      matrixReady: false,
      label: "Friction ignorée",
      tip: "Au moins une friction n'est résolue par aucun job.",
    };
  }
  if (report.warnings.length > 0) {
    return {
      level: "warning",
      criticalCount: 0,
      warningCount: report.warnings.length,
      matrixReady: false,
      label: "Job fantôme",
      tip: "Au moins un job n'adresse aucune friction.",
    };
  }
  return {
    level: "healthy",
    criticalCount: 0,
    warningCount: 0,
    matrixReady: true,
    label: "Matrice OK",
    tip: "Frictions couvertes — prêt pour le statut READY.",
  };
}

export function PersonaMatrixHealthPanel({
  report,
  className,
}: {
  report: PersonaCoverageReport;
  className?: string;
}) {
  const { metrics } = report;
  const painCount = metrics.totalPainCount;
  const jobCount = metrics.totalJobCount;
  const health = healthFromReport(report, painCount, jobCount);
  const hasIssues = report.criticals.length > 0 || report.warnings.length > 0;

  return (
    <aside
      className={cn(
        "sttns-card flex flex-col p-5 backdrop-blur-sm",
        health.level === "healthy" && "border-emerald-100/90 bg-emerald-50/20",
        health.level === "critical" && "border-red-100/90 bg-red-50/15",
        (health.level === "warning" || health.level === "incomplete") &&
          "border-amber-100/90 bg-amber-50/15",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            État de santé
          </p>
          <h3 className="mt-1 font-display text-sm font-semibold text-slate-800">
            Matrice PP ↔ JTBD
          </h3>
        </div>
        <SttnsContextHelp
          kind="definition"
          title="Matrice saine"
          body="Chaque friction doit être couverte par au moins un JTBD. Les jobs sans friction sont signalés comme fantômes."
          placement="top"
          size="sm"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PersonaHealthPill health={health} />
        {painCount > 0 && (
          <span className="text-[10px] font-medium text-slate-500">
            {metrics.coveredPainCount}/{painCount} PP · {jobCount} JTBD
          </span>
        )}
      </div>

      {health.level === "healthy" ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2.5 text-sm text-emerald-900">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Toutes les frictions sont couvertes. Vous pouvez publier en{" "}
            <span className="font-semibold">READY</span>.
          </p>
        </div>
      ) : hasIssues ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            Problèmes détectés
          </div>
          <ul className="space-y-2">
            {report.criticals.map((item) => (
              <li
                key={item.painId}
                className="rounded-lg border border-red-100 bg-red-50/70 px-3 py-2 text-sm text-red-900"
              >
                <span className="font-semibold">{item.painLabel}</span>
                <p className="mt-0.5 text-xs">{item.message}</p>
              </li>
            ))}
            {report.warnings.map((item) => (
              <li
                key={item.jobId}
                className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-sm text-amber-950"
              >
                <span className="font-semibold">{item.jobLabel || "Job sans libellé"}</span>
                <p className="mt-0.5 text-xs">{item.message}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">{health.tip}</p>
      )}

      <div className="mt-4 border-t border-slate-100/80 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Definition of Ready
        </p>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          <li>· Réf. automatique + nom + segment + résumé profil</li>
          <li>· Frictions courtes et observables</li>
          <li>· Jobs liés à au moins une friction</li>
          <li>· Couverture 100 % avant READY</li>
        </ul>
      </div>
    </aside>
  );
}
