"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { StoryEditSlideOver } from "@/components/execution/StoryEditSlideOver";
import { StoryAssigneePicker } from "@/components/execution/StoryAssigneePicker";
import { StoryTaskMiniList } from "@/components/execution/StoryTaskMiniList";
import { ExecutionNoticeModal } from "@/components/execution/ExecutionNoticeModal";
import { updateWorkItemStatusAction } from "@/app/projects/[slug]/kanban/actions";
import type { StoryTaskProjectMember } from "@/app/projects/[slug]/user-stories/actions";
import type {
  SpineStoryTaskPreview,
  StoryCycleOption,
  StoryFeatureOption,
} from "@/lib/sttns/storiesSpine";
import { formatCyclePeriod } from "@/lib/sttns/cycles";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  EffortBadge,
  RiskBadge,
} from "@/components/ui/ValueEffortBadges";
import { sumActiveEffortDays, type ComplexityLevel } from "@/lib/sttns/valueEffort";

type WorkItemStatus = "todo" | "in_progress" | "review" | "done";

interface Story {
  id: string;
  title: string;
  status: WorkItemStatus;
  description: string | null;
  effort_days: number;
  complexity: number | null;
  cycle_id: string | null;
  cycle_name?: string | null;
  feature_id: string | null;
  feature_title: string;
  epic_title: string;
  assignee_id: string | null;
  tasks: SpineStoryTaskPreview[];
}

interface Props {
  projectId: string;
  projectSlug: string;
  stories: Story[];
  wipLimit: number;
  cycles: StoryCycleOption[];
  selectedCycleId: string | null;
  features: StoryFeatureOption[];
  projectMembers: StoryTaskProjectMember[];
}

const COLUMNS: { id: WorkItemStatus; label: string; color: string }[] = [
  { id: "todo", label: "À faire", color: "bg-muted/40" },
  { id: "in_progress", label: "En cours", color: "bg-info/5" },
  { id: "review", label: "En revue", color: "bg-violet-50/50" },
  { id: "done", label: "Terminé", color: "bg-success/5" },
];

export function KanbanBoard({
  projectId,
  projectSlug,
  stories,
  wipLimit,
  cycles,
  selectedCycleId,
  features,
  projectMembers,
}: Props) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editStory, setEditStory] = useState<Story | null>(null);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    tone?: "warning" | "error";
    eyebrow?: string;
  } | null>(null);
  const draggedRef = useRef(false);

  const activeEffortDays = sumActiveEffortDays(
    stories.map((s) => ({
      status: s.status,
      effortDays: s.effort_days,
      hasValidEffort: (s.effort_days ?? 0) > 0,
    }))
  );

  const selectedCycle = cycles.find((c) => c.id === selectedCycleId) ?? null;

  const storiesByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = stories.filter((s) => s.status === col.id);
    return acc;
  }, {} as Record<WorkItemStatus, Story[]>);

  const inProgressCount = storiesByColumn["in_progress"].length;
  const wipLimitReached = inProgressCount >= wipLimit;

  function handleCycleChange(cycleId: string) {
    const href =
      cycleId === "all"
        ? `/projects/${projectSlug}/kanban`
        : `/projects/${projectSlug}/kanban?cycle_id=${cycleId}`;
    router.push(href);
  }

  async function handleDragStart(storyId: string) {
    draggedRef.current = true;
    setDraggingId(storyId);
  }

  async function handleDrop(storyId: string, newStatus: WorkItemStatus) {
    setDraggingId(null);

    const story = stories.find((s) => s.id === storyId);
    if (!story || story.status === newStatus) return;

    if (newStatus === "in_progress" && wipLimitReached && story.status !== "in_progress") {
      setNotice({
        eyebrow: "Limite WIP",
        title: "Limite WIP atteinte",
        message: `Terminez d'abord une story en cours (${inProgressCount}/${wipLimit}) avant d'en démarrer une nouvelle.`,
        tone: "warning",
      });
      return;
    }

    setUpdatingId(storyId);

    const result = await updateWorkItemStatusAction(storyId, projectSlug, newStatus);

    setUpdatingId(null);

    if (result.ok) {
      router.refresh();
    } else {
      setNotice({
        eyebrow: "Changement de statut",
        title: "Statut refusé",
        message: result.error,
        tone: "error",
      });
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleCardClick(story: Story) {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setEditStory(story);
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

        <div className="sttns-card flex items-center justify-between !p-3">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Stories totales</p>
              <p className="font-semibold text-foreground" style={{ fontSize: "var(--sttns-text-kpi)" }}>
                {stories.length}
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground">Jours d&apos;effort actifs</p>
              <p className="font-semibold text-foreground" style={{ fontSize: "var(--sttns-text-kpi)" }}>
                {activeEffortDays}j
              </p>
            </div>
          </div>

          {wipLimitReached && (
            <div className="animate-pulse rounded-md border border-warning/40 bg-warning/10 px-4 py-2 text-sm text-warning">
              <span className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Limite WIP atteinte ({inProgressCount}/{wipLimit}).
                <br className="sm:hidden" />
                <span className="text-xs font-normal sm:ml-1">
                  Terminez une tâche avant d&apos;en commencer une nouvelle.
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-muted/30 p-3 md:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnStories = storiesByColumn[column.id];
            const isInProgressColumn = column.id === "in_progress";
            const showWipWarning = isInProgressColumn && wipLimitReached;

            return (
              <div
                key={column.id}
                className={`flex flex-col rounded-xl ${column.color} min-h-[400px]`}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingId) {
                    handleDrop(draggingId, column.id);
                  }
                }}
              >
                <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
                  <h3 className="font-medium text-sm text-foreground">{column.label}</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        showWipWarning
                          ? "bg-destructive/10 text-destructive animate-pulse"
                          : "bg-card text-muted-foreground"
                      }`}
                    >
                      {columnStories.length}
                      {isInProgressColumn && (
                        <span className="ml-1 text-destructive">/{wipLimit}</span>
                      )}
                    </span>
                    {showWipWarning && (
                      <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                    )}
                  </div>
                </div>

                {showWipWarning && (
                  <div className="mx-3 mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                    <span className="flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      WIP Limit atteinte
                    </span>
                  </div>
                )}

                <div className="flex-1 space-y-2 p-2.5">
                  {columnStories.map((story) => (
                    <div
                      key={story.id}
                      draggable
                      onDragStart={() => handleDragStart(story.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        window.setTimeout(() => {
                          draggedRef.current = false;
                        }, 0);
                      }}
                      onClick={() => handleCardClick(story)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCardClick(story);
                        }
                      }}
                      className={`sttns-card group cursor-pointer !p-3 transition-all hover:border-primary/40 ${
                        updatingId === story.id ? "opacity-50" : ""
                      } ${draggingId === story.id ? "opacity-25" : ""}`}
                    >
                      {updatingId === story.id && (
                        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Mise à jour...
                        </div>
                      )}

                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-foreground line-clamp-2 flex items-start gap-1.5 min-w-0">
                          <SpineObjectIcon type="story" size="xs" className="mt-0.5 shrink-0" />
                          <span>{story.title}</span>
                        </h4>
                        <StoryAssigneePicker
                          storyId={story.id}
                          assigneeId={story.assignee_id}
                          projectSlug={projectSlug}
                          projectMembers={projectMembers}
                          size="xs"
                          onAssigned={() => router.refresh()}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={story.status} size="sm" />
                        <EffortBadge days={story.effort_days || 0} />
                        {story.complexity != null && (
                          <RiskBadge
                            risk={story.complexity as ComplexityLevel}
                            showIcon={story.complexity === 3}
                          />
                        )}
                        {story.cycle_name && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-info/10 px-1.5 py-0.5 text-[11px] font-medium text-info">
                            <SpineObjectIcon type="cycle" size="xs" />
                            {story.cycle_name}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1 border-t border-border pt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <SpineObjectIcon type="feature" size="xs" colored={false} className="text-muted-foreground" />
                          <span className="truncate" title={story.feature_title}>
                            {story.feature_title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
                          <SpineObjectIcon type="epic" size="xs" colored={false} className="text-muted-foreground" />
                          <span className="truncate" title={story.epic_title}>
                            {story.epic_title}
                          </span>
                        </div>
                      </div>

                      {story.tasks.length > 0 && (
                        <div className="mt-2 border-t border-border pt-2">
                          <StoryTaskMiniList
                            tasks={story.tasks}
                            members={projectMembers}
                            variant="compact"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {columnStories.length === 0 && (
                    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                      Déposez une story ici
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-muted-foreground"></span>
              Glissez-déposez pour changer de statut
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success"></span>
              Cliquez sur une carte pour éditer la story
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">WIP Limit:</span>
            <span className="rounded-md bg-muted px-2 py-1 text-xs">{wipLimit} en cours</span>
          </div>
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
                feature_id: editStory.feature_id,
                cycle_id: editStory.cycle_id,
                effort_days: editStory.effort_days as 0.5 | 1 | 2 | 3 | 5 | null,
                complexity: editStory.complexity as 1 | 2 | 3 | null,
                status: editStory.status,
                assignee_id: editStory.assignee_id,
              }
            : null
        }
        projectId={projectId}
        projectSlug={projectSlug}
        features={features}
        cycles={cycles}
        onClose={() => setEditStory(null)}
        onSaved={() => router.refresh()}
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
