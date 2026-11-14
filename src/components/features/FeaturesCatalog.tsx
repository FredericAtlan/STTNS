"use client";

import Link from "next/link";
import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleDashed,
  Code2,
  Gavel,
  ListChecks,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  deleteInitiativeAction,
  renameInitiativeAction,
  reorderFeatureRegistryAction,
} from "@/app/projects/[slug]/features/actions";
import {
  SttnsDataTable,
  SttnsTableColumnHeader,
  SttnsTableTextHeader,
} from "@/components/ui/SttnsDataTable";
import { SttnsDataToolbar } from "@/components/ui/SttnsDataToolbar";
import { FeatureExecutionStatusBadge } from "@/components/features/FeatureExecutionStatusBadge";
import { TABLE_COLUMN_VOCAB } from "@/lib/sttns/iconVocabulary";
import { GOVERNANCE_BUCKET_LABELS, type GovernanceBucket } from "@/lib/sttns/governanceAxes";
import { WORKFLOW_LABELS } from "@/lib/sttns/workflow";
import { featuresPath } from "@/lib/sttns/paths";
import type { SttnsEpic, SttnsInitiativeExecutionStatus, SttnsWorkflowStatus } from "@/types/sttns";
import { cn } from "@/lib/utils";

export type FeatureCatalogRow = {
  id: string;
  featureCode: string | null;
  featureName: string;
  epicLabel: string;
  epicId: string | null;
  personaLabel: string;
  personaId: string | null;
  scoreLabel: string;
  scoreValue: number | null;
  kanoLabel: string;
  specsFilled: boolean;
  governanceLabel: string;
  governanceBucket: GovernanceBucket;
  workflowStatus: SttnsWorkflowStatus;
  executionStatus: SttnsInitiativeExecutionStatus;
  executionStatusLabel: string;
  executionSortOrder: number;
};

type RegistrySortMode = "order" | "score";

function compareRegistryRows(a: FeatureCatalogRow, b: FeatureCatalogRow, mode: RegistrySortMode) {
  if (mode === "score") {
    return (b.scoreValue ?? -1) - (a.scoreValue ?? -1);
  }
  return (
    a.executionSortOrder - b.executionSortOrder ||
    (a.featureCode ?? "").localeCompare(b.featureCode ?? "", undefined, { numeric: true }) ||
    a.featureName.localeCompare(b.featureName, "fr")
  );
}

type FilterToggle = "specs" | "ceo" | "build";

export function FeaturesCatalog({
  projectSlug,
  projectId,
  rows,
  epics,
}: {
  projectSlug: string;
  projectId: string;
  rows: FeatureCatalogRow[];
  epics: Pick<SttnsEpic, "id" | "title">[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const decision = searchParams.get("decision") ?? "";
  const persona = searchParams.get("persona") ?? "";
  const epic = searchParams.get("epic") ?? "";
  const toggleSpecs = searchParams.get("specs") === "0";
  const toggleCeo = searchParams.get("ceo") === "1";
  const toggleBuild = searchParams.get("build") === "1";
  const sortMode: RegistrySortMode = searchParams.get("sort") === "score" ? "score" : "order";
  const [isReordering, startReorder] = useTransition();

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => compareRegistryRows(a, b, "order")),
    [rows]
  );

  const rowOrderIndex = useMemo(() => {
    const map = new Map<string, number>();
    orderedRows.forEach((row, index) => map.set(row.id, index));
    return map;
  }, [orderedRows]);

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const toggleParam = useCallback(
    (key: string, active: boolean, activeValue = "1") => {
      setParams({ [key]: active ? null : activeValue });
    },
    [setParams]
  );

  const personaOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.personaId && row.personaLabel) map.set(row.personaId, row.personaLabel);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [rows]);

  const noSpecsCount = rows.filter((r) => !r.specsFilled).length;
  const ceoPendingCount = rows.filter((r) => r.workflowStatus === "ceo_pending").length;
  const buildCount = rows.filter((r) => r.governanceBucket === "build").length;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (status && row.workflowStatus !== status) return false;
        if (decision && row.governanceBucket !== decision) return false;
        if (persona && row.personaId !== persona) return false;
        if (epic && row.epicId !== epic) return false;
        if (toggleSpecs && row.specsFilled) return false;
        if (toggleCeo && row.workflowStatus !== "ceo_pending") return false;
        if (toggleBuild && row.governanceBucket !== "build") return false;
        if (!query) return true;
        const haystack = [
          row.featureCode,
          row.featureName,
          row.epicLabel,
          row.personaLabel,
          row.governanceLabel,
          row.kanoLabel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => compareRegistryRows(a, b, sortMode));
  }, [rows, q, status, decision, persona, epic, toggleSpecs, toggleCeo, toggleBuild, sortMode]);

  const moveRegistryRow = useCallback(
    (initiativeId: string, direction: "up" | "down") => {
      const currentIndex = rowOrderIndex.get(initiativeId);
      if (currentIndex === undefined) return;
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= orderedRows.length) return;

      startReorder(async () => {
        await reorderFeatureRegistryAction(projectId, projectSlug, initiativeId, targetIndex);
        router.refresh();
      });
    },
    [orderedRows.length, projectId, projectSlug, rowOrderIndex, router]
  );

  const columns = useMemo(
    () => [
      {
        id: "order",
        header: (
          <span className="normal-case tracking-normal text-zinc-500" title="Ordre du registre">
            #
          </span>
        ),
        cell: (row: FeatureCatalogRow) => {
          const index = rowOrderIndex.get(row.id);
          const canReorder = sortMode === "order" && !isReordering;
          const isFirst = index === 0;
          const isLast = index === orderedRows.length - 1;

          return (
            <div
              className="flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="w-5 text-center font-mono text-[10px] font-bold tabular-nums text-zinc-400">
                {(index ?? 0) + 1}
              </span>
              {sortMode === "order" && (
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={!canReorder || isFirst}
                    onClick={() => moveRegistryRow(row.id, "up")}
                    className="rounded p-0.5 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30"
                    title="Monter"
                    aria-label="Monter dans l'ordre"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!canReorder || isLast}
                    onClick={() => moveRegistryRow(row.id, "down")}
                    className="rounded p-0.5 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30"
                    title="Descendre"
                    aria-label="Descendre dans l'ordre"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        },
        className: "w-14",
        headerClassName: "w-14",
      },
      {
        id: "name",
        header: (
          <SttnsTableTextHeader
            icon={TABLE_COLUMN_VOCAB.featureTitle.icon}
            label="Code / Nom"
            description={TABLE_COLUMN_VOCAB.featureTitle.hint}
          />
        ),
        cell: (row: FeatureCatalogRow) => (
          <div className="min-w-0">
            {row.featureCode && (
              <p className="font-mono text-[10px] font-bold text-emerald-700">{row.featureCode}</p>
            )}
            <Link
              href={featuresPath(projectSlug, row.id)}
              className="font-semibold text-zinc-900 hover:text-emerald-800"
              onClick={(e) => e.stopPropagation()}
            >
              {row.featureName}
            </Link>
          </div>
        ),
        className: "max-w-[180px]",
      },
      {
        id: "epic",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.featureEpic} />,
        cell: (row: FeatureCatalogRow) => (
          <span className="text-xs text-zinc-600">{row.epicLabel}</span>
        ),
        className: "max-w-[120px]",
      },
      {
        id: "persona",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.featurePersona} />,
        cell: (row: FeatureCatalogRow) => (
          <span className="text-xs text-zinc-600">{row.personaLabel}</span>
        ),
        className: "max-w-[100px]",
      },
      {
        id: "score",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.featureScore} />,
        cell: (row: FeatureCatalogRow) => (
          <span className="font-mono text-xs font-bold tabular-nums text-zinc-900">{row.scoreLabel}</span>
        ),
        headerClassName: "w-14 text-center",
        className: "w-14 text-center",
      },
      {
        id: "kano",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.featureKano} />,
        cell: (row: FeatureCatalogRow) => (
          <span className="text-xs text-zinc-600">{row.kanoLabel}</span>
        ),
        className: "max-w-[72px]",
      },
      {
        id: "specs",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.featureSpecs} />,
        cell: (row: FeatureCatalogRow) =>
          row.specsFilled ? (
            <CircleCheck className="mx-auto h-4 w-4 text-emerald-600" aria-label="Specs rédigées" />
          ) : (
            <CircleDashed className="mx-auto h-4 w-4 text-amber-500" aria-label="Specs manquantes" />
          ),
        headerClassName: "w-10 text-center",
        className: "w-10 text-center",
      },
      {
        id: "governance",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.featureGovernance} />,
        cell: (row: FeatureCatalogRow) => (
          <span
            className={cn(
              "text-[11px] font-semibold",
              row.governanceBucket === "build" && "text-emerald-700",
              row.governanceBucket === "in_review" && "text-amber-700",
              row.governanceBucket === "killed" && "text-rose-700"
            )}
          >
            {row.governanceLabel}
          </span>
        ),
        className: "max-w-[90px]",
      },
      {
        id: "execution",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.featureExecution} />,
        cell: (row: FeatureCatalogRow) => (
          <FeatureExecutionStatusBadge status={row.executionStatus} compact />
        ),
        className: "max-w-[110px]",
      },
      {
        id: "actions",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.actions} />,
        cell: (row: FeatureCatalogRow) => (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                const newTitle = window.prompt("Renommer la feature :", row.featureName);
                if (newTitle && newTitle.trim() !== row.featureName) {
                  renameInitiativeAction(projectId, projectSlug, row.id, newTitle.trim());
                }
              }}
              className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
              title="Renommer"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Effacer définitivement la feature "${row.featureName}" ?`)) {
                  deleteInitiativeAction(projectId, projectSlug, row.id);
                }
              }}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              title="Effacer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        className: "w-[80px] align-top py-2.5",
      },
    ],
    [
      isReordering,
      moveRegistryRow,
      orderedRows.length,
      projectId,
      projectSlug,
      rowOrderIndex,
      sortMode,
    ]
  );

  const filterButtons: { id: FilterToggle; icon: typeof Code2; tip: string; active: boolean; count: number; param: string }[] = [
    {
      id: "specs",
      icon: Code2,
      tip: "Sans specs",
      active: toggleSpecs,
      count: noSpecsCount,
      param: "specs",
    },
    {
      id: "ceo",
      icon: Gavel,
      tip: "Décision CEO",
      active: toggleCeo,
      count: ceoPendingCount,
      param: "ceo",
    },
    {
      id: "build",
      icon: CircleCheck,
      tip: "BUILD",
      active: toggleBuild,
      count: buildCount,
      param: "build",
    },
  ];

  return (
    <div className="space-y-2">
      <SttnsDataToolbar
        search={q}
        onSearchChange={(value) => setParams({ q: value.trim() || null })}
        searchPlaceholder="Code, titre, epic…"
        resultCount={filtered.length}
        totalCount={rows.length}
        filters={filterButtons.map((f) => ({
          id: f.id,
          icon: f.icon,
          tip: f.tip,
          active: f.active,
          count: f.count,
          onClick: () => toggleParam(f.param, f.active, f.param === "specs" ? "0" : "1"),
        }))}
        trailing={
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              aria-label="Tri du registre"
              value={sortMode}
              onChange={(e) =>
                setParams({ sort: e.target.value === "score" ? "score" : null })
              }
              className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-700"
              title={
                sortMode === "order"
                  ? "Ordre manuel — utilisez les flèches dans le tableau"
                  : "Tri par Score STTNS legacy (RICE déprécié)"
              }
            >
              <option value="order">Ordre manuel</option>
              <option value="score">Score STTNS (legacy)</option>
            </select>
            <select
              aria-label="Filtrer par statut workflow"
              value={status}
              onChange={(e) => setParams({ status: e.target.value || null })}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-[11px] text-zinc-700"
            >
              <option value="">Statut</option>
              {(Object.keys(WORKFLOW_LABELS) as SttnsWorkflowStatus[]).map((s) => (
                <option key={s} value={s}>
                  {WORKFLOW_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrer par gouvernance"
              value={decision}
              onChange={(e) => setParams({ decision: e.target.value || null })}
              className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-[11px] text-zinc-700"
            >
              <option value="">Gouvernance</option>
              {(Object.keys(GOVERNANCE_BUCKET_LABELS) as GovernanceBucket[]).map((b) => (
                <option key={b} value={b}>
                  {GOVERNANCE_BUCKET_LABELS[b]}
                </option>
              ))}
            </select>
            {personaOptions.length > 0 && (
              <select
                aria-label="Filtrer par persona"
                value={persona}
                onChange={(e) => setParams({ persona: e.target.value || null })}
                className="h-8 max-w-[7rem] rounded-md border border-zinc-200 bg-white px-2 text-[11px] text-zinc-700"
              >
                <option value="">Persona</option>
                {personaOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {epics.length > 0 && (
              <select
                aria-label="Filtrer par epic"
                value={epic}
                onChange={(e) => setParams({ epic: e.target.value || null })}
                className="h-8 max-w-[7rem] rounded-md border border-zinc-200 bg-white px-2 text-[11px] text-zinc-700"
              >
                <option value="">Epic</option>
                {epics.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      />

      <SttnsDataTable
        columns={columns}
        rows={filtered}
        getRowHref={(row) => featuresPath(projectSlug, row.id)}
        emptyMessage={
          rows.length === 0 ? (
            <>
              Aucune feature.{" "}
              <Link
                href={featuresPath(projectSlug, "new")}
                className="font-semibold text-emerald-700 hover:underline"
              >
                Créer la première
              </Link>
            </>
          ) : (
            "Aucun résultat pour ce filtre."
          )
        }
      />
    </div>
  );
}
