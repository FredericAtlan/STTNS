"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  fetchSpineNodeEditAction,
  type SpineEpicEditData,
  type SpineFeatureEditData,
} from "@/app/projects/[slug]/spine/actions";
import {
  fetchProjectMembersForTasksAction,
  fetchStoryTasksAction,
  type StoryTaskProjectMember,
} from "@/app/projects/[slug]/user-stories/actions";
import { EpicForm } from "@/components/epics/EpicForm";
import { FeatureForm } from "@/components/features/FeatureForm";
import { UserStoryForm } from "@/components/execution/UserStoryForm";
import { StoryTasksPanel } from "@/components/execution/StoryTasksPanel";
import type { StoryEditData } from "@/components/execution/StoryEditSlideOver";
import { SpineBreadcrumb, type SpineBreadcrumbItem } from "@/components/spine/SpineBreadcrumb";
import { SpineChildrenTree } from "@/components/spine/SpineChildrenTree";
import { WorkItemHistory } from "@/components/spine/WorkItemHistory";
import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  EffortBadge,
  EpicImpactSumBadge,
  ImpactBadge,
  RatioBadge,
  RiskBadge,
  RiskyCountBadge,
} from "@/components/ui/ValueEffortBadges";
import type { SpineEditContext } from "@/lib/sttns/spineEditContext";
import type { StoryTaskRow } from "@/lib/sttns/storiesSpine";
import { cn } from "@/lib/utils";

export type SpineInspectorFrame =
  | { kind: "epic"; data: SpineEpicEditData }
  | { kind: "feature"; data: SpineFeatureEditData }
  | { kind: "story"; data: StoryEditData };

type InspectorTab = "edit" | "structure" | "health";

interface Props {
  open: boolean;
  /** Frame d'entrée — reset la pile à chaque ouverture / changement d'id. */
  initial: SpineInspectorFrame | null;
  projectId: string;
  projectSlug: string;
  editContext: Pick<
    SpineEditContext,
    "epics" | "jtbdOptions" | "features" | "cycles"
  >;
  featureExecutionMode?: boolean;
  epicEqualsCycle?: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** page = contenu sans shell slide-over (fiche /epics/[id]). */
  variant?: "slide-over" | "page";
  /** Onglet initial (défaut Structure pour epic/feature, Édition pour story). */
  defaultTab?: InspectorTab;
}

const TAB_LABELS: Record<InspectorTab, string> = {
  edit: "Édition",
  structure: "Structure",
  health: "Santé",
};

function frameTitle(frame: SpineInspectorFrame): string {
  return frame.data.title;
}

function frameId(frame: SpineInspectorFrame): string {
  return frame.data.id;
}

export function SpineInspector({
  open,
  initial,
  projectId,
  projectSlug,
  editContext,
  featureExecutionMode = false,
  epicEqualsCycle = false,
  onClose,
  onSaved,
  variant = "slide-over",
  defaultTab,
}: Props) {
  const [stack, setStack] = useState<SpineInspectorFrame[]>([]);
  const [tab, setTab] = useState<InspectorTab>("structure");
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<StoryTaskRow[]>([]);
  const [projectMembers, setProjectMembers] = useState<StoryTaskProjectMember[]>([]);
  const [tasksReadOnly, setTasksReadOnly] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const entryKey = initial ? `${initial.kind}:${initial.data.id}` : "";

  useEffect(() => {
    if (!open || !initial) {
      setStack([]);
      setDrillError(null);
      return;
    }
    setStack([initial]);
    setTab(
      defaultTab ??
        (initial.kind === "story" ? "edit" : "structure")
    );
    setDrillError(null);
  }, [open, entryKey, defaultTab, initial]);

  const current = stack[stack.length - 1] ?? null;

  useEffect(() => {
    if (!open || !current || current.kind !== "story") {
      setTasks([]);
      return;
    }
    let cancelled = false;
    setLoadingTasks(true);
    Promise.all([
      fetchStoryTasksAction(current.data.id),
      fetchProjectMembersForTasksAction(projectId),
    ]).then(([tasksResult, membersResult]) => {
      if (cancelled) return;
      setLoadingTasks(false);
      if (tasksResult.ok) setTasks(tasksResult.tasks);
      if (membersResult.ok) {
        setProjectMembers(membersResult.members);
        setTasksReadOnly(membersResult.readOnly);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, current?.kind, current?.data.id, projectId]);

  const pushFrame = useCallback(async (id: string) => {
    setDrillLoading(true);
    setDrillError(null);
    const result = await fetchSpineNodeEditAction(id);
    setDrillLoading(false);
    if (!result.ok) {
      setDrillError(result.error);
      return;
    }
    const payload = result.payload;
    if (payload.kind === "epic") {
      setStack((s) => [...s, { kind: "epic", data: payload.data }]);
      setTab("structure");
    } else if (payload.kind === "feature") {
      setStack((s) => [...s, { kind: "feature", data: payload.data }]);
      setTab("structure");
    } else if (payload.kind === "story") {
      setStack((s) => [...s, { kind: "story", data: payload.data }]);
      setTab("edit");
    } else {
      setDrillError("Ce nœud n'est pas inspectable ici.");
    }
  }, []);

  const popToIndex = useCallback((index: number) => {
    setStack((s) => s.slice(0, index + 1));
    setTab("structure");
  }, []);

  const breadcrumbItems: SpineBreadcrumbItem[] = useMemo(() => {
    return stack.map((frame) => ({
      id: frame.data.id,
      label: frame.data.title,
      kind: frame.kind,
    }));
  }, [stack]);

  const handleSavedLocal = useCallback(() => {
    onSaved();
  }, [onSaved]);

  if (!open || !current) {
    if (variant === "page") return null;
    return null;
  }

  const headerBadges = (
    <div className="flex flex-wrap items-center gap-1.5">
      {current.kind === "epic" && (
        <>
          <button
            type="button"
            onClick={() => setTab("structure")}
            className="inline-flex"
            title="Voir les Features sources"
          >
            <EpicImpactSumBadge total={current.data.totalImpact ?? 0} />
          </button>
          <button
            type="button"
            onClick={() => setTab("structure")}
            className="inline-flex"
          >
            <EffortBadge days={current.data.totalDays} />
          </button>
          <button
            type="button"
            onClick={() => setTab("structure")}
            className="inline-flex"
          >
            <RatioBadge ratio={current.data.valueEffortRatio ?? null} />
          </button>
          <span className="text-[11px] text-zinc-400">
            {current.data.featureCount} feat · {current.data.storyCount} stories
          </span>
        </>
      )}
      {current.kind === "feature" && (
        <>
          <button
            type="button"
            onClick={() => setTab("structure")}
            className="inline-flex"
          >
            <ImpactBadge impact={current.data.impact} showLabel />
          </button>
          <button
            type="button"
            onClick={() => setTab("structure")}
            className="inline-flex"
          >
            <EffortBadge days={current.data.rollupDays} />
          </button>
          <RiskyCountBadge count={current.data.riskyCount} />
        </>
      )}
      {current.kind === "story" && (
        <>
          <EffortBadge days={current.data.effort_days} />
          {current.data.complexity != null && (
            <RiskBadge risk={current.data.complexity} showIcon />
          )}
        </>
      )}
    </div>
  );

  const body = (
    <div className="space-y-4">
      {stack.length > 1 && (
        <button
          type="button"
          onClick={() => popToIndex(stack.length - 2)}
          className="sttns-btn-ghost sttns-btn-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour · {stack[stack.length - 2]?.data.title}
        </button>
      )}

      <div className="space-y-2 border-b border-border pb-3">
        <SpineBreadcrumb
          items={breadcrumbItems}
          onNavigate={(_, index) => popToIndex(index)}
        />
        <div className="flex flex-wrap items-start gap-2">
          <SpineObjectIcon type={current.kind} className="mt-0.5 h-5 w-5" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="font-semibold text-foreground truncate"
                style={{ fontSize: "var(--sttns-text-page-title)" }}
              >
                {frameTitle(current)}
              </h2>
              {"status" in current.data && current.data.status && (
                <StatusBadge status={current.data.status} size="sm" />
              )}
            </div>
            {headerBadges}
          </div>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {(Object.keys(TAB_LABELS) as InspectorTab[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              tab === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {TAB_LABELS[id]}
          </button>
        ))}
      </div>

      {drillError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {drillError}
        </div>
      )}
      {drillLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ouverture…
        </div>
      )}

      {tab === "edit" && current.kind === "epic" && (
        <EpicForm
          key={`epic:${current.data.id}`}
          projectId={projectId}
          projectSlug={projectSlug}
          hideTitle
          hideHistory
          initial={{
            id: current.data.id,
            title: current.data.title,
            description: current.data.description,
            doc_url: current.data.doc_url ?? "",
            totalImpact: current.data.totalImpact,
            totalDays: current.data.totalDays,
            valueEffortRatio: current.data.valueEffortRatio,
          }}
          onFocusStructure={() => setTab("structure")}
          onSuccess={handleSavedLocal}
        />
      )}

      {tab === "edit" && current.kind === "feature" && (
        <FeatureForm
          key={`feature:${current.data.id}`}
          projectId={projectId}
          projectSlug={projectSlug}
          epics={editContext.epics}
          jtbdOptions={editContext.jtbdOptions}
          cycleOptions={editContext.cycles}
          featureExecutionMode={featureExecutionMode}
          epicEqualsCycle={epicEqualsCycle}
          hideTitle
          hideHistory
          initial={{
            id: current.data.id,
            title: current.data.title,
            description: current.data.description,
            doc_url: current.data.doc_url ?? "",
            epic_id: current.data.epic_id,
            cycle_id: current.data.cycle_id ?? "",
            linked_jtbd_id: current.data.linked_jtbd_id,
            impact: current.data.impact,
            effort_days: current.data.effort_days,
            complexity: current.data.complexity,
          }}
          childStoryCount={current.data.childStoryCount}
          rollupDays={current.data.rollupDays}
          riskyCount={current.data.riskyCount}
          onFocusStructure={() => setTab("structure")}
          onSuccess={handleSavedLocal}
        />
      )}

      {tab === "edit" && current.kind === "story" && (
        <div className="space-y-6">
          <UserStoryForm
            key={`story:${current.data.id}`}
            projectId={projectId}
            projectSlug={projectSlug}
            features={editContext.features}
            cycles={editContext.cycles}
            projectMembers={projectMembers}
            hideTitle
            readOnly={tasksReadOnly}
            initial={{
              id: current.data.id,
              title: current.data.title,
              description: current.data.description ?? "",
              doc_url: current.data.doc_url ?? "",
              feature_id: current.data.feature_id,
              cycle_id: current.data.cycle_id,
              effort_days: current.data.effort_days,
              complexity: current.data.complexity,
              metadata: current.data.metadata,
              status: current.data.status,
              assignee_id: current.data.assignee_id ?? null,
            }}
            onSuccess={handleSavedLocal}
          />
          {loadingTasks ? (
            <div className="flex items-center gap-2 py-4 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des tasks…
            </div>
          ) : (
            <StoryTasksPanel
              storyId={current.data.id}
              projectId={projectId}
              projectSlug={projectSlug}
              initialTasks={tasks}
              projectMembers={projectMembers}
              readOnly={tasksReadOnly}
            />
          )}
        </div>
      )}

      {tab === "structure" && current.kind === "epic" && (
        <SpineChildrenTree
          mode="epic"
          features={current.data.features}
          epicId={current.data.id}
          projectSlug={projectSlug}
          onOpenFeature={(id) => void pushFrame(id)}
          onOpenStory={(id) => void pushFrame(id)}
        />
      )}

      {tab === "structure" && current.kind === "feature" && (
        <SpineChildrenTree
          mode="feature"
          stories={current.data.stories}
          featureId={current.data.id}
          projectSlug={projectSlug}
          onOpenStory={(id) => void pushFrame(id)}
          shapeUpHint
        />
      )}

      {tab === "structure" && current.kind === "story" && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            Les enfants d&apos;une Story sont les Tasks — visibles aussi dans l&apos;onglet
            Édition.
          </p>
          {loadingTasks ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : (
            <StoryTasksPanel
              storyId={current.data.id}
              projectId={projectId}
              projectSlug={projectSlug}
              initialTasks={tasks}
              projectMembers={projectMembers}
              readOnly={tasksReadOnly}
            />
          )}
        </div>
      )}

      {tab === "health" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Historique d&apos;audit et signaux locaux pour{" "}
            <span className="font-medium text-foreground">{frameTitle(current)}</span>.
          </p>
          <WorkItemHistory workItemId={frameId(current)} defaultOpen />
        </div>
      )}
    </div>
  );

  if (variant === "page") {
    return <div className="max-w-3xl space-y-4">{body}</div>;
  }

  return (
    <SttnsSlideOver
      open={open}
      onClose={onClose}
      title={frameTitle(current)}
      eyebrow="Inspecteur Spine"
      size="xl"
    >
      {body}
    </SttnsSlideOver>
  );
}
