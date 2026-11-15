"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Skull,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Ban,
  DollarSign,
  HelpCircle,
  ArrowLeft,
  BarChart3,
} from "lucide-react";
import type { ArchiveReason } from "@/lib/sttns/postMortem";

interface PostMortemLog {
  id: string;
  title: string;
  type: string;
  archivedAt: string;
  reason: ArchiveReason;
  reasonDetails: string | null;
  archivedBy: string;
  riceScore: number;
}

interface Props {
  projectSlug: string;
  logs: PostMortemLog[];
}

const REASON_CONFIG: Record<
  ArchiveReason,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  out_of_scope: {
    label: "Hors scope stratégique",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  duplicate: {
    label: "Doublon",
    icon: <Ban className="h-4 w-4" />,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  invalidated_by_strategy: {
    label: "Vision caduque",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  resource_constraint: {
    label: "Contrainte technique/budget",
    icon: <DollarSign className="h-4 w-4" />,
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  other: {
    label: "Autre",
    icon: <HelpCircle className="h-4 w-4" />,
    color: "text-zinc-700",
    bgColor: "bg-zinc-100",
  },
};

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    epic: "Epic",
    feature: "Feature",
    story: "Story",
    task: "Task",
    persona: "Persona",
    job: "JTBD",
  };
  return labels[type] || type;
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    epic: "bg-indigo-100 text-indigo-700",
    feature: "bg-emerald-100 text-emerald-700",
    story: "bg-blue-100 text-blue-700",
    task: "bg-zinc-100 text-zinc-700",
    persona: "bg-amber-100 text-amber-700",
    job: "bg-purple-100 text-purple-700",
  };
  return colors[type] || "bg-zinc-100 text-zinc-700";
}

export function PostMortemLogs({ projectSlug, logs }: Props) {
  // Aggregate reasons for analytics
  const reasonStats = useMemo(() => {
    const stats: Record<ArchiveReason, { count: number; totalRiceScore: number }> = {
      out_of_scope: { count: 0, totalRiceScore: 0 },
      duplicate: { count: 0, totalRiceScore: 0 },
      invalidated_by_strategy: { count: 0, totalRiceScore: 0 },
      resource_constraint: { count: 0, totalRiceScore: 0 },
      other: { count: 0, totalRiceScore: 0 },
    };

    for (const log of logs) {
      stats[log.reason].count++;
      stats[log.reason].totalRiceScore += log.riceScore;
    }

    return Object.entries(stats)
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([reason, data]) => ({
        reason: reason as ArchiveReason,
        ...data,
        avgRiceScore: data.count > 0 ? Math.round(data.totalRiceScore / data.count) : 0,
      }));
  }, [logs]);

  const totalKilled = logs.length;
  const totalRiceWasted = logs.reduce((sum, log) => sum + log.riceScore, 0);

  // Find dominant reason (for insights)
  const dominantReason = reasonStats[0]?.reason;
  const dominantConfig = dominantReason ? REASON_CONFIG[dominantReason] : null;

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <Link
          href={`/projects/${projectSlug}/radar`}
          className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au Radar
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-zinc-600" />
            <span className="text-sm font-medium text-zinc-700">Total archivés</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{totalKilled}</p>
          <p className="text-xs text-zinc-500">Items supprimés avec Post-Mortem</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-zinc-600" />
            <span className="text-sm font-medium text-zinc-700">Score legacy perdu</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{totalRiceWasted.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">
            Ancien score RICE (déprécié) — priorisez Impact / V/E Spine
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-zinc-600" />
            <span className="text-sm font-medium text-zinc-700">Raison principale</span>
          </div>
          <p className="mt-2 text-lg font-bold text-zinc-900">
            {dominantConfig ? (
              <span className={`inline-flex items-center gap-1 rounded px-2 py-1 ${dominantConfig.bgColor} ${dominantConfig.color}`}>
                {dominantConfig.icon}
                {dominantConfig.label}
              </span>
            ) : (
              "N/A"
            )}
          </p>
          <p className="text-xs text-zinc-500">
            {reasonStats[0]?.count || 0} occurrences ({totalKilled > 0 ? Math.round((reasonStats[0]?.count || 0) / totalKilled * 100) : 0}%)
          </p>
        </div>
      </div>

      {/* Analytics Chart */}
      {reasonStats.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-900">
            <BarChart3 className="h-4 w-4" />
            Distribution des raisons d&apos;échec
          </h3>

          <div className="space-y-4">
            {reasonStats.map(({ reason, count, avgRiceScore }) => {
              const config = REASON_CONFIG[reason];
              const percentage = totalKilled > 0 ? (count / totalKilled) * 100 : 0;

              return (
                <div key={reason} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${config.bgColor} ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </span>
                    </span>
                    <span className="text-zinc-600">
                      {count} ({Math.round(percentage)}%) · score legacy moy. {avgRiceScore}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-100">
                    <div
                      className={`h-2 rounded-full ${config.bgColor.replace("bg-", "bg-opacity-80 bg-")} ${config.color.replace("text-", "bg-")}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insights */}
          {dominantReason && (
            <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-4">
              <h4 className="mb-2 text-sm font-medium text-amber-800">💡 Insight PO</h4>
              <p className="text-sm text-amber-700">
                {dominantReason === "out_of_scope" && (
                  <>
                    <strong>Erreur de cadrage détectée.</strong> La majorité des suppressions sont
                    &laquo;&nbsp;Hors scope stratégique&nbsp;&raquo;. Envisagez une revue de la phase de discovery (Personas/JTBD)
                    pour mieux aligner les Epics avant leur création.
                  </>
                )}
                {dominantReason === "resource_constraint" && (
                  <>
                    <strong>Erreur d&apos;estimation détectée.</strong> Beaucoup d&apos;items sont
                    supprimés pour &quot;Contrainte technique/budget&quot;. Renforcez Effort (jours) et
                    Risque (R:1–3) sur les Stories, et l&apos;Impact Feature en amont.
                  </>
                )}
                {dominantReason === "duplicate" && (
                  <>
                    <strong>Problème de doublons.</strong> Améliorez la visibilité du backlog
                    existant avant création de nouveaux items. Epics/Features doit être
                    le référent unique.
                  </>
                )}
                {dominantReason === "invalidated_by_strategy" && (
                  <>
                    <strong>Vision changeante.</strong> La stratégie évolue rapidement.
                    Identifiez tôt les Features Impact 0 (Gaspillage) et les Epics à faible ratio
                    V/E pour éviter le gaspillage.
                  </>
                )}
                {dominantReason === "other" && (
                  <>
                    <strong>Raisons diverses.</strong> Les causes de suppression sont variées.
                    Analysez les détails individuels pour identifier des patterns.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Logs Table */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4">
          <h3 className="font-semibold text-zinc-900">Historique des suppressions</h3>
          <span className="text-xs text-zinc-500">{logs.length} entrées</span>
        </div>

        <div className="divide-y divide-zinc-100">
          {logs.length === 0 ? (
            <div className="p-8 text-center">
              <Skull className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
              <p className="text-sm text-zinc-500">Aucun Post-Mortem enregistré.</p>
              <p className="text-xs text-zinc-400 mt-1">
                Les items archivés avec raison apparaîtront ici.
              </p>
            </div>
          ) : (
            logs.map((log) => {
              const config = REASON_CONFIG[log.reason];
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-zinc-50">
                  {/* Type Badge */}
                  <span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${getTypeColor(log.type)}`}>
                    {getTypeLabel(log.type)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-zinc-900">{log.title}</h4>
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${config.bgColor} ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </span>
                    </div>

                    {log.reasonDetails && (
                      <p className="mt-1 text-sm text-zinc-600">{log.reasonDetails}</p>
                    )}

                    <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                      <span>Archivé le {new Date(log.archivedAt).toLocaleDateString("fr-FR")}</span>
                      <span>·</span>
                      <span>Par {log.archivedBy}</span>
                      <span>·</span>
                      <span className="font-medium">Score legacy: {log.riceScore}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
