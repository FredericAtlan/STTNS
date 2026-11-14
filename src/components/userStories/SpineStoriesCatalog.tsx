"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Archive, CircleCheck, ChevronDown, ChevronRight, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  bulkArchiveUserStoriesAction,
  deleteUserStoryAction,
} from "@/app/projects/[slug]/user-stories/actions";
import { StoryEditSlideOver } from "@/components/execution/StoryEditSlideOver";
import { StoryAssigneePicker } from "@/components/execution/StoryAssigneePicker";
import { StoryTaskMiniList } from "@/components/execution/StoryTaskMiniList";
import { CycleCapacityBar } from "@/components/cycles/CycleCapacityBar";
import type { StoryTaskProjectMember } from "@/app/projects/[slug]/user-stories/actions";
import { formatCyclePeriod, type CycleRow } from "@/lib/sttns/cycles";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";
import {
  SttnsDataTable,
  SttnsTableColumnHeader,
  SttnsTableTextHeader,
} from "@/components/ui/SttnsDataTable";
import { SttnsDataToolbar } from "@/components/ui/SttnsDataToolbar";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { TABLE_COLUMN_VOCAB, SPINE_OBJECT_VOCAB } from "@/lib/sttns/iconVocabulary";
import { EmptyStateCoach } from "@/components/ui/EmptyStateCoach";
import { StatusPill, type StatusType } from "@/components/ui/StatusPill";
import type {
  SpineStoryHealth,
  SpineStoryListItem,
  StoryCycleOption,
  StoryFeatureOption,
} from "@/lib/sttns/storiesSpine";
import type { WorkItemStatus } from "@/lib/sttns/types";
import { sumActiveEffortDays } from "@/lib/sttns/valueEffort";
import { cn } from "@/lib/utils";

type FilterMode = "all" | "orphan" | "noEffort" | "incomplete" | "noEpic";

function HealthCell({ health }: { health: SpineStoryHealth }) {
  const Icon = health.ready ? CircleCheck : AlertTriangle;
  const tone = health.ready ? "text-emerald-600" : "text-red-600";

  return (
    <SttnsIconTip label={`${health.label} — ${health.tip}`} placement="right">
      <div className="flex flex-col items-center gap-0.5">
        <Icon className={cn("h-4 w-4", tone)} aria-hidden />
        <span className={cn("text-[9px] font-bold uppercase tracking-wide", tone)}>
          {health.label}
        </span>
      </div>
    </SttnsIconTip>
  );
}

export function SpineStoriesCatalog({
  projectId,
  projectSlug,
  rows,
  features,
  cycles,
  projectMembers = [],
  initialCycleId = null,
  activeCycle = null,
}: {
  projectId: string;
  projectSlug: string;
  rows: SpineStoryListItem[];
  features: StoryFeatureOption[];
  cycles: StoryCycleOption[];
  projectMembers?: StoryTaskProjectMember[];
  initialCycleId?: string | null;
  activeCycle?: CycleRow | null;
}) {
  const base = `/projects/${projectSlug}/user-stories`;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [cycleFilter, setCycleFilter] = useState<string>(initialCycleId ?? "all");
  const [expandedStories, setExpandedStories] = useState<Record<string, boolean>>({});
  const [editStory, setEditStory] = useState<SpineStoryListItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkArchiving, setIsBulkArchiving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCycleFilter(initialCycleId ?? "all");
  }, [initialCycleId]);

  const cycleOptions = useMemo(() => {
    if (!activeCycle || cycles.some((c) => c.id === activeCycle.id)) {
      return cycles;
    }
    return [
      ...cycles,
      {
        id: activeCycle.id,
        name: activeCycle.name,
        start_date: activeCycle.start_date,
        end_date: activeCycle.end_date,
        capacity_points: activeCycle.capacity_points,
      },
    ];
  }, [cycles, activeCycle]);

  const orphanCount = rows.filter((r) => !r.hasFeature).length;
  const noEffortCount = rows.filter((r) => !r.hasValidEffort).length;
  const incompleteCount = rows.filter((r) => !r.health.ready).length;
  const noEpicCount = rows.filter((r) => r.hasFeature && !r.hasEpic).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (cycleFilter !== "all" && row.cycleId !== cycleFilter) return false;
      if (filter === "orphan" && row.hasFeature) return false;
      if (filter === "noEffort" && row.hasValidEffort) return false;
      if (filter === "incomplete" && row.health.ready) return false;
      if (filter === "noEpic" && (row.hasEpic || !row.hasFeature)) return false;
      if (!q) return true;
      return (
        row.title.toLowerCase().includes(q) ||
        row.featureTitle.toLowerCase().includes(q) ||
        row.epicTitle.toLowerCase().includes(q) ||
        (row.cycleName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, search, filter, cycleFilter]);

  const selectedCycle = cycleOptions.find((c) => c.id === cycleFilter) ?? null;

  const filteredEffort = useMemo(
    () => sumActiveEffortDays(filtered),
    [filtered]
  );

  const filteredIds = useMemo(() => filtered.map((row) => row.id), [filtered]);
  const selectedInFilterCount = filteredIds.filter((id) => selectedIds.has(id)).length;
  const allFilteredSelected =
    filteredIds.length > 0 && selectedInFilterCount === filteredIds.length;
  const someFilteredSelected =
    selectedInFilterCount > 0 && selectedInFilterCount < filteredIds.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  function toggleStorySelection(storyId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(storyId);
      else next.delete(storyId);
      return next;
    });
  }

  function toggleSelectAllFiltered(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        filteredIds.forEach((id) => next.add(id));
      } else {
        filteredIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }

  async function handleBulkArchive() {
    const ids = Array.from(selectedIds);
    if (!ids.length || isBulkArchiving) return;

    const preview = rows
      .filter((row) => selectedIds.has(row.id))
      .slice(0, 3)
      .map((row) => row.title)
      .join("\n· ");
    const more = ids.length > 3 ? `\n… et ${ids.length - 3} autre(s)` : "";
    const confirmed = window.confirm(
      `Archiver ${ids.length} user story${ids.length > 1 ? "s" : ""} ?\n\n· ${preview}${more}`
    );
    if (!confirmed) return;

    setIsBulkArchiving(true);
    setBulkError(null);
    setBulkSuccess(null);

    const result = await bulkArchiveUserStoriesAction(projectId, projectSlug, ids);

    setIsBulkArchiving(false);

    if (!result.ok) {
      setBulkError(result.error);
      return;
    }

    const successMsg =
      result.failed > 0
        ? `${result.archived} story(s) archivée(s). ${result.failed} en échec : ${result.errors.slice(0, 2).join(" · ")}`
        : `${result.archived} story(s) archivée(s).`;

    setBulkSuccess(successMsg);
    setSelectedIds(new Set());
    router.refresh();
  }

  function handleCycleFilterChange(next: string) {
    setCycleFilter(next);
    const href =
      next === "all"
        ? base
        : `${base}?cycle_id=${encodeURIComponent(next)}`;
    router.replace(href);
  }

  function toggleStoryTasks(storyId: string) {
    setExpandedStories((prev) => ({ ...prev, [storyId]: !prev[storyId] }));
  }

  function openEdit(row: SpineStoryListItem) {
    setEditStory(row);
  }

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: (
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allFilteredSelected}
            onChange={(e) => toggleSelectAllFiltered(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            aria-label="Tout sélectionner (filtre actif)"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        cell: (row: SpineStoryListItem) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={(e) => toggleStorySelection(row.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            aria-label={`Sélectionner ${row.title}`}
          />
        ),
        headerClassName: "w-10 text-center",
        className: "w-10 align-top py-2.5 text-center",
      },
      {
        id: "health",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.storyHealth} />,
        cell: (row: SpineStoryListItem) => <HealthCell health={row.health} />,
        headerClassName: "w-[88px] text-center",
        className: "w-[88px] align-top py-2.5 text-center",
      },
      {
        id: "title",
        header: (
          <SttnsTableTextHeader
            icon={TABLE_COLUMN_VOCAB.storyTitle.icon}
            label={TABLE_COLUMN_VOCAB.storyTitle.label}
            description={TABLE_COLUMN_VOCAB.storyTitle.hint}
          />
        ),
        cell: (row: SpineStoryListItem) => {
          const expanded = expandedStories[row.id] ?? row.tasks.length > 0;
          return (
            <div className="space-y-1">
              <div className="flex items-start gap-1">
                {row.tasks.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStoryTasks(row.id);
                    }}
                    className="mt-0.5 shrink-0 rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label={expanded ? "Masquer les tâches" : "Afficher les tâches"}
                  >
                    {expanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900">{row.title}</p>
                  {row.code && <p className="text-[11px] text-zinc-500">{row.code}</p>}
                  <p className="text-[11px] font-medium text-emerald-800">
                    {row.featureTitle} ← {row.epicTitle}
                  </p>
                  {expanded && row.tasks.length > 0 && (
                    <StoryTaskMiniList tasks={row.tasks} members={projectMembers} />
                  )}
                  {row.tasks.length > 0 && !expanded && (
                    <p className="mt-1 text-[10px] text-zinc-400">
                      {row.tasks.filter((t) => t.done).length}/{row.tasks.length} tâche
                      {row.tasks.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        },
        className: "min-w-[180px] max-w-[280px] align-top py-2.5",
      },
      {
        id: "effort",
        header: (
          <SttnsTableTextHeader
            icon={TABLE_COLUMN_VOCAB.storyEpic.icon}
            label="Effort"
            description="Jours d'effort"
          />
        ),
        cell: (row: SpineStoryListItem) =>
          row.hasValidEffort ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              {row.effortDays}j
            </span>
          ) : (
            <span className="text-xs font-medium text-red-600">—</span>
          ),
        className: "min-w-[72px] align-top py-2.5",
      },
      {
        id: "cycle",
        header: (
          <SttnsTableTextHeader
            icon={TABLE_COLUMN_VOCAB.storyStatus.icon}
            label="Cycle"
            description="Sprint actif"
          />
        ),
        cell: (row: SpineStoryListItem) =>
          row.cycleName ? (
            <span className="text-xs text-zinc-600">{row.cycleName}</span>
          ) : (
            <span className="text-xs text-zinc-400">Non assigné</span>
          ),
        className: "min-w-[100px] align-top py-2.5",
      },
      {
        id: "assignee",
        header: (
          <SttnsTableTextHeader
            icon={TABLE_COLUMN_VOCAB.actions.icon}
            label="Assigné"
            description="Membre responsable"
          />
        ),
        cell: (row: SpineStoryListItem) => (
          <div onClick={(e) => e.stopPropagation()}>
            <StoryAssigneePicker
              storyId={row.id}
              assigneeId={row.assigneeId}
              projectSlug={projectSlug}
              projectMembers={projectMembers}
              size="xs"
              onAssigned={() => router.refresh()}
            />
          </div>
        ),
        headerClassName: "w-[72px] text-center",
        className: "w-[72px] align-top py-2.5 text-center",
      },
      {
        id: "status",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.storyStatus} />,
        cell: (row: SpineStoryListItem) => (
          <StatusPill status={row.status as StatusType} />
        ),
        className: "min-w-[88px] align-top py-2.5",
      },
      {
        id: "actions",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.actions} />,
        cell: (row: SpineStoryListItem) => (
          <div
            className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
              title="Modifier"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  if (!window.confirm(`Archiver la story « ${row.title} » ?`)) return;
                  const result = await deleteUserStoryAction(row.id, projectId, projectSlug);
                  if (!result.ok) {
                    setBulkError(result.error);
                    return;
                  }
                  setBulkError(null);
                  setBulkSuccess(`Story « ${row.title} » archivée.`);
                  setSelectedIds((prev) => {
                    if (!prev.has(row.id)) return prev;
                    const next = new Set(prev);
                    next.delete(row.id);
                    return next;
                  });
                  router.refresh();
                })();
              }}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              title="Archiver"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        className: "w-[80px] align-top py-2.5",
      },
    ],
    [
      projectId,
      projectSlug,
      router,
      expandedStories,
      projectMembers,
      selectedIds,
      allFilteredSelected,
      someFilteredSelected,
    ]
  );

  if (rows.length === 0) {
    return (
      <EmptyStateCoach
        type="story"
        title="Section vide"
        explanation="Pour construire votre Spine, cette section a besoin de User Stories."
        actionLabel="Créer votre première User Story"
        actionHref={`${base}/new`}
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        <SttnsDataToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Titre, feature, epic, cycle…"
          resultCount={filtered.length}
          totalCount={rows.length}
          filters={[
            {
              id: "incomplete",
              icon: AlertTriangle,
              tip: "Stories incomplètes (DoR Spine)",
              active: filter === "incomplete",
              count: incompleteCount,
              onClick: () => setFilter((f) => (f === "incomplete" ? "all" : "incomplete")),
            },
            {
              id: "orphan",
              icon: AlertTriangle,
              tip: "Sans feature parente",
              active: filter === "orphan",
              count: orphanCount,
              onClick: () => setFilter((f) => (f === "orphan" ? "all" : "orphan")),
            },
            {
              id: "noEffort",
              icon: AlertTriangle,
              tip: "Sans effort (jours)",
              active: filter === "noEffort",
              count: noEffortCount,
              onClick: () => setFilter((f) => (f === "noEffort" ? "all" : "noEffort")),
            },
            {
              id: "noEpic",
              icon: SPINE_OBJECT_VOCAB.epic.icon,
              tip: "Feature sans epic",
              active: filter === "noEpic",
              count: noEpicCount,
              onClick: () => setFilter((f) => (f === "noEpic" ? "all" : "noEpic")),
            },
          ]}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <SpineObjectIcon type="cycle" size="xs" />
            <span className="font-medium">Cycle</span>
            <select
              value={cycleFilter}
              onChange={(e) => handleCycleFilterChange(e.target.value)}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800"
            >
              <option value="all">Tous les cycles</option>
              {cycleOptions.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
          </label>
          {selectedCycle && (
            <p className="text-xs text-zinc-500">
              Période :{" "}
              <span className="font-medium text-zinc-700">
                {formatCyclePeriod(selectedCycle.start_date, selectedCycle.end_date)}
              </span>
            </p>
          )}
        </div>

        {cycleFilter !== "all" && selectedCycle && (
          <CycleCapacityBar
            projectId={projectId}
            projectSlug={projectSlug}
            cycleId={selectedCycle.id}
            cycleName={selectedCycle.name}
            totalEffort={filteredEffort}
            capacity={selectedCycle.capacity_points}
          />
        )}

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
            <p className="text-sm font-medium text-amber-950">
              {selectedIds.size} story{selectedIds.size > 1 ? "s" : ""} sélectionnée
              {selectedIds.size > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                disabled={isBulkArchiving}
                className="rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Tout désélectionner
              </button>
              <button
                type="button"
                onClick={() => void handleBulkArchive()}
                disabled={isBulkArchiving}
                className="inline-flex items-center gap-1.5 rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:bg-zinc-300"
              >
                {isBulkArchiving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Archivage…
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5" />
                    Archiver ({selectedIds.size})
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {bulkError && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {bulkError}
          </div>
        )}

        {bulkSuccess && (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {bulkSuccess}
          </div>
        )}

        <div className="min-w-0 [&_table]:min-w-[900px]">
          <SttnsDataTable
            columns={columns}
            rows={filtered}
            onRowClick={(row) => openEdit(row)}
            emptyMessage={
              rows.length === 0 ? (
                <>
                  Aucune story.{" "}
                  <Link href={`${base}/new`} className="font-semibold text-emerald-700 hover:underline">
                    Créer la première
                  </Link>
                </>
              ) : (
                "Aucun résultat pour ce filtre."
              )
            }
          />
        </div>
      </div>

      <StoryEditSlideOver
        open={!!editStory}
        story={
          editStory
            ? {
                id: editStory.id,
                title: editStory.title,
                description: editStory.description,
                feature_id: editStory.featureId,
                cycle_id: editStory.cycleId,
                effort_days: editStory.effortDays as 0.5 | 1 | 2 | 3 | 5 | null,
                complexity: editStory.complexity,
                metadata: undefined,
                status: editStory.status as WorkItemStatus,
                assignee_id: editStory.assigneeId,
              }
            : null
        }
        projectId={projectId}
        projectSlug={projectSlug}
        features={features}
        cycles={cycles}
        onClose={() => {
          setEditStory(null);
          setBulkError(null);
        }}
        onSaved={() => {
          setBulkError(null);
          router.refresh();
        }}
      />
    </>
  );
}
