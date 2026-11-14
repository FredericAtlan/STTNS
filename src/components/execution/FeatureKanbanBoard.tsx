"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { FeatureEditSlideOver } from "@/components/spine/FeatureEditSlideOver";
import { ExecutionNoticeModal } from "@/components/execution/ExecutionNoticeModal";
import { updateWorkItemStatusAction } from "@/app/projects/[slug]/kanban/actions";
import { assignFeatureToCycleAction } from "@/app/projects/[slug]/cycles/actions";
import { fetchSpineNodeEditAction } from "@/app/projects/[slug]/spine/actions";
import type { StoryCycleOption } from "@/lib/sttns/storiesSpine";
import type { SpineFeatureEditData } from "@/app/projects/[slug]/spine/actions";
import type { SpineEditEpic, SpineEditJtbdOption } from "@/lib/sttns/spineEditContext";
import type { StoryFeatureOption } from "@/lib/sttns/storiesSpine";
import { formatCyclePeriod } from "@/lib/sttns/cycles";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ImpactBadge } from "@/components/ui/ValueEffortBadges";
import type { ImpactLevel } from "@/lib/sttns/valueEffort";

type WorkItemStatus = "todo" | "in_progress" | "review" | "done";

export type KanbanFeatureCard = {
  id: string;
  title: string;
  status: WorkItemStatus;
  cycle_id: string | null;
  cycle_name?: string | null;
  epic_title: string;
  assignee_id: string | null;
  impact?: ImpactLevel | null;
};

interface Props {
  projectId: string;
  projectSlug: string;
  features: KanbanFeatureCard[];
  wipLimit: number;
  cycles: StoryCycleOption[];
  selectedCycleId: string | null;
  epics: SpineEditEpic[];
  jtbdOptions: SpineEditJtbdOption[];
  featureOptions?: StoryFeatureOption[];
  featureExecutionMode?: boolean;
  epicEqualsCycle?: boolean;
}

const COLUMNS: { id: WorkItemStatus; label: string; color: string }[] = [
  { id: "todo", label: "À faire", color: "bg-muted/40" },
  { id: "in_progress", label: "En cours", color: "bg-info/5" },
  { id: "review", label: "En revue", color: "bg-violet-50/50" },
  { id: "done", label: "Terminé", color: "bg-success/5" },
];

export function FeatureKanbanBoard({
  projectId,
  projectSlug,
  features,
  wipLimit,
  cycles,
  selectedCycleId,
  epics,
  jtbdOptions,
  featureOptions = [],
  featureExecutionMode = false,
  epicEqualsCycle = false,
}: Props) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [loadingFeatureId, setLoadingFeatureId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<SpineFeatureEditData | null>(null);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    tone?: "warning" | "error";
    eyebrow?: string;
  } | null>(null);
  const draggedRef = useRef(false);

  const selectedCycle = cycles.find((c) => c.id === selectedCycleId) ?? null;
  const showCycleDropZones = !selectedCycleId && cycles.length > 0;

  const featuresByColumn = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = features.filter((f) => f.status === col.id);
      return acc;
    },
    {} as Record<WorkItemStatus, KanbanFeatureCard[]>
  );

  const inProgressCount = featuresByColumn.in_progress.length;
  const wipLimitReached = inProgressCount >= wipLimit;

  function handleCycleChange(cycleId: string) {
    const href =
      cycleId === "all"
        ? `/projects/${projectSlug}/kanban`
        : `/projects/${projectSlug}/kanban?cycle_id=${cycleId}`;
    router.push(href);
  }

  async function handleDrop(featureId: string, newStatus: WorkItemStatus) {
    setDraggingId(null);

    const feature = features.find((f) => f.id === featureId);
    if (!feature || feature.status === newStatus) return;

    if (newStatus === "in_progress" && wipLimitReached && feature.status !== "in_progress") {
      setNotice({
        eyebrow: "Limite WIP",
        title: "Limite WIP atteinte",
        message: `Terminez d'abord une feature en cours (${inProgressCount}/${wipLimit}) avant d'en démarrer une nouvelle.`,
        tone: "warning",
      });
      return;
    }

    setUpdatingId(featureId);
    const result = await updateWorkItemStatusAction(featureId, projectSlug, newStatus);
    setUpdatingId(null);

    if (result.ok) {
      router.refresh();
    } else {
      const isImpactBlock = /Impact\s*Gaspillage/i.test(result.error);
      setNotice({
        eyebrow: isImpactBlock ? "Gouvernance" : "Changement de statut",
        title: isImpactBlock ? "Impact 0 — hard block" : "Statut refusé",
        message: result.error,
        tone: "error",
      });
    }
  }

  async function handleAssignCycle(featureId: string, nextCycleId: string | null) {
    setAssigningId(featureId);
    const result = await assignFeatureToCycleAction(
      featureId,
      nextCycleId,
      projectId,
      projectSlug
    );
    setAssigningId(null);

    if (result.ok) {
      router.refresh();
    } else {
      setNotice({
        eyebrow: "Assignation cycle",
        title: "Assignation refusée",
        message: result.error,
        tone: "error",
      });
    }
  }

  async function handleCycleDrop(featureId: string, cycleId: string | null) {
    setDraggingId(null);
    const feature = features.find((f) => f.id === featureId);
    if (!feature || feature.cycle_id === cycleId) return;
    await handleAssignCycle(featureId, cycleId);
  }

  async function openFeature(featureId: string) {
    setLoadingFeatureId(featureId);
    const result = await fetchSpineNodeEditAction(featureId);
    setLoadingFeatureId(null);

    if (!result.ok || result.payload.kind !== "feature") {
      setNotice({
        eyebrow: "Chargement",
        title: "Feature indisponible",
        message: result.ok ? "Feature introuvable." : result.error,
        tone: "error",
      });
      return;
    }

    setActiveFeature(result.payload.data);
    setEditOpen(true);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="sttns-card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between !p-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <SpineObjectIcon type="cycle" size="xs" />
            <span className="sttns-label mb-0">Cycle</span>
            <select
              value={selectedCycleId ?? "all"}
              onChange={(e) => handleCycleChange(e.target.value)}
              className="sttns-input w-auto min-w-[10rem]"
            >
              <option value="all">Tous les cycles</option>
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
          </label>
          {selectedCycle && (
            <p className="text-xs text-muted-foreground">
              Période :{" "}
              <span className="font-medium text-foreground">
                {formatCyclePeriod(selectedCycle.start_date, selectedCycle.end_date)}
              </span>
            </p>
          )}
        </div>

        {showCycleDropZones && (
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 space-y-2">
            <p className="text-xs font-medium text-primary">
              Glissez une feature sur un cycle pour l&apos;assigner
            </p>
            <div className="flex flex-wrap gap-2">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingId) void handleCycleDrop(draggingId, null);
                }}
                className="sttns-btn-secondary sttns-btn-sm"
              >
                Sans cycle
              </div>
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingId) void handleCycleDrop(draggingId, cycle.id);
                  }}
                  className="sttns-btn-secondary sttns-btn-sm inline-flex items-center gap-1.5"
                >
                  <SpineObjectIcon type="cycle" size="xs" />
                  {cycle.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sttns-card flex items-center justify-between !p-3">
          <div>
            <p className="text-xs text-muted-foreground">Features en exécution</p>
            <p className="font-semibold text-foreground" style={{ fontSize: "var(--sttns-text-kpi)" }}>
              {features.length}
            </p>
          </div>
          {wipLimitReached && (
            <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-2 text-sm text-warning">
              <span className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Limite WIP atteinte ({inProgressCount}/{wipLimit})
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-muted/30 p-3 md:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnFeatures = featuresByColumn[column.id];
            const isInProgressColumn = column.id === "in_progress";
            const showWipWarning = isInProgressColumn && wipLimitReached;

            return (
              <div
                key={column.id}
                className={`flex flex-col rounded-xl ${column.color} min-h-[400px]`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingId) void handleDrop(draggingId, column.id);
                }}
              >
                <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
                  <h3 className="font-medium text-sm text-foreground">{column.label}</h3>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      showWipWarning ? "bg-destructive/10 text-destructive" : "bg-card text-muted-foreground"
                    }`}
                  >
                    {columnFeatures.length}
                    {isInProgressColumn && (
                      <span className="ml-1 text-destructive">/{wipLimit}</span>
                    )}
                  </span>
                </div>

                <div className="flex-1 space-y-2 p-2.5">
                  {columnFeatures.map((feature) => (
                    <div
                      key={feature.id}
                      draggable
                      onDragStart={() => {
                        draggedRef.current = true;
                        setDraggingId(feature.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        window.setTimeout(() => {
                          draggedRef.current = false;
                        }, 0);
                      }}
                      onClick={() => {
                        if (draggedRef.current) return;
                        void openFeature(feature.id);
                      }}
                      className={`sttns-card cursor-pointer !p-3 transition hover:border-primary/40 ${
                        updatingId === feature.id || assigningId === feature.id
                          ? "opacity-60"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <SpineObjectIcon type="feature" size="xs" />
                            <p className="text-sm font-medium text-foreground line-clamp-2">
                              {feature.title}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-violet-700 truncate">
                            {feature.epic_title}
                          </p>
                          {feature.cycle_name && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{feature.cycle_name}</p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={feature.status} size="sm" />
                            <ImpactBadge impact={feature.impact} />
                          </div>
                        </div>
                        {updatingId === feature.id ||
                        assigningId === feature.id ||
                        loadingFeatureId === feature.id ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                        ) : null}
                      </div>
                      {!selectedCycleId && (
                        <label
                          className="mt-2 block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">Assigner au cycle</span>
                          <select
                            value={feature.cycle_id ?? ""}
                            disabled={assigningId === feature.id}
                            onChange={(e) =>
                              void handleAssignCycle(
                                feature.id,
                                e.target.value ? e.target.value : null
                              )
                            }
                            className="sttns-input text-[11px]"
                          >
                            <option value="">Sans cycle</option>
                            {cycles.map((cycle) => (
                              <option key={cycle.id} value={cycle.id}>
                                {cycle.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      <FeatureEditSlideOver
        open={editOpen}
        feature={activeFeature}
        projectId={projectId}
        projectSlug={projectSlug}
        editContext={{
          epics,
          jtbdOptions,
          features: featureOptions,
          cycles,
        }}
        featureExecutionMode={featureExecutionMode}
        epicEqualsCycle={epicEqualsCycle}
        onClose={() => {
          setEditOpen(false);
          setActiveFeature(null);
        }}
        onSaved={() => {
          setEditOpen(false);
          setActiveFeature(null);
          router.refresh();
        }}
      />

      <ExecutionNoticeModal
        open={!!notice}
        onClose={() => setNotice(null)}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        tone={notice?.tone}
        eyebrow={notice?.eyebrow}
      />
    </>
  );
}
