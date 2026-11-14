"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Sparkles, RefreshCw, Eye, EyeOff, ExternalLink } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { TaskAssigneeBadge } from "@/components/execution/TaskAssigneeBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  EffortBadge,
  EpicImpactSumBadge,
  ImpactBadge,
  RatioBadge,
  RiskBadge,
  RiskyCountBadge,
} from "@/components/ui/ValueEffortBadges";
import type {
  SpineTreeHierarchy,
  SpineTreeMember,
  SpineTreeNode,
  SpineTreeNodeKind,
} from "@/lib/sttns/spineTree";
import { collectDefaultExpandedNodeIds } from "@/lib/sttns/spineTree";
import { formatCyclePeriod } from "@/lib/sttns/cycles";
import { cn } from "@/lib/utils";

interface Props {
  projectSlug: string;
  rootNodes: SpineTreeNode[];
  hierarchy: SpineTreeHierarchy;
  onNodeClick: (node: SpineTreeNode) => void;
  activeNodeId?: string | null;
  emptyMessage?: string;
  members?: SpineTreeMember[];
}

function mapStoryStatus(status: string): string {
  if (status === "done") return "done";
  if (status === "review") return "review";
  if (status === "in_progress" || status === "doing") return "in_progress";
  return "todo";
}

function mapCycleStatus(status: string): string {
  if (status === "active") return "in_progress";
  if (status === "done") return "done";
  return "todo";
}

/** Mappe la sévérité Pain Point vers le badge Risque clinique (1–3). */
function severityToRisk(severity: string): 1 | 2 | 3 {
  switch (severity) {
    case "critical":
      return 3;
    case "high":
      return 2;
    default:
      return 1;
  }
}

function findPath(nodes: SpineTreeNode[], targetId: string, path: SpineTreeNode[] = []): SpineTreeNode[] | null {
  for (const node of nodes) {
    const next = [...path, node];
    if (node.id === targetId) return next;
    const found = findPath(node.children, targetId, next);
    if (found) return found;
  }
  return null;
}

function collectDescendantIds(node: SpineTreeNode): string[] {
  const ids = [node.id];
  for (const child of node.children) {
    ids.push(...collectDescendantIds(child));
  }
  return ids;
}

function buildFocusLineage(rootNodes: SpineTreeNode[], focusId: string): Set<string> {
  const path = findPath(rootNodes, focusId);
  if (!path) return new Set();
  const ids = new Set(path.map((n) => n.id));
  const focusNode = path[path.length - 1];
  collectDescendantIds(focusNode).forEach((id) => ids.add(id));
  return ids;
}

function collectAllIds(nodes: SpineTreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    ids.push(...collectAllIds(node.children));
  }
  return ids;
}

function isClickableKind(kind: SpineTreeNodeKind): boolean {
  return kind !== "why_group" && kind !== "task";
}

function storyFeatureCaption(
  node: SpineTreeNode,
  hierarchy: SpineTreeHierarchy
): string | null {
  if (node.kind !== "story" || hierarchy.rootKind !== "cycle") return null;
  return node.meta?.featureTitle?.trim() || "Sans feature";
}

function NodeTitleContent({
  title,
  node,
  hierarchy,
  className,
}: {
  title: string;
  node: SpineTreeNode;
  hierarchy: SpineTreeHierarchy;
  className?: string;
}) {
  const featureCaption = storyFeatureCaption(node, hierarchy);

  return (
    <span className={cn("min-w-0 truncate", className)}>
      <span>{title}</span>
      {featureCaption && (
        <span className="font-normal text-zinc-400"> ({featureCaption})</span>
      )}
    </span>
  );
}

function ClickableNodeTitle({
  label,
  node,
  hierarchy,
  onNodeClick,
  isActive,
  className,
}: {
  label: string;
  node: SpineTreeNode;
  hierarchy: SpineTreeHierarchy;
  onNodeClick: (node: SpineTreeNode) => void;
  isActive?: boolean;
  className?: string;
}) {
  const featureCaption = storyFeatureCaption(node, hierarchy);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onNodeClick(node);
      }}
      className={cn(
        "font-medium truncate text-left rounded px-1 -mx-1 transition-colors",
        "hover:text-emerald-700 hover:bg-emerald-50/80 hover:underline underline-offset-2",
        isActive ? "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200" : "text-zinc-800",
        className
      )}
      title={featureCaption ? `${label} (${featureCaption})` : `Inspecter : ${label}`}
    >
      <NodeTitleContent title={label} node={node} hierarchy={hierarchy} />
    </button>
  );
}

function TreeNodeShell({
  title,
  node,
  count,
  isOpen,
  onToggle,
  health,
  children,
  depth,
  hierarchy,
  onNodeClick,
  activeNodeId,
  isDimmed,
}: {
  title: string;
  node: SpineTreeNode;
  count?: number;
  isOpen: boolean;
  onToggle?: () => void;
  health?: "healthy" | "incomplete";
  children?: ReactNode;
  depth: number;
  hierarchy: SpineTreeHierarchy;
  onNodeClick: (node: SpineTreeNode) => void;
  activeNodeId?: string | null;
  isDimmed?: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const isStrategic = hierarchy.strategicKinds.includes(node.kind) || depth <= 1;
  const clickable = isClickableKind(node.kind);
  const showStatusPill =
    !!node.status && (node.kind === "story" || node.kind === "cycle");

  return (
    <div className={cn("pl-3 transition-all duration-300 relative", isDimmed ? "opacity-25" : "opacity-100")}>
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 border-l transition-colors duration-300",
          isStrategic ? "border-border border-l-2" : "border-border/70 border-l"
        )}
      />

      <div
        className={cn(
          "flex w-full items-center gap-1.5 min-w-0 transition-all group/row",
          isStrategic ? "py-1.5" : "py-0.5"
        )}
        style={{ fontSize: "var(--sttns-text-body)" }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.();
            }}
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm shrink-0 h-6 w-6"
            aria-label={isOpen ? "Replier" : "Déplier"}
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}

        {health && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0 mr-0.5 ring-1 ring-card",
              health === "healthy" ? "bg-success" : "bg-warning animate-pulse"
            )}
            title={health === "healthy" ? "Branche saine (Ready)" : "Branche incomplète"}
          />
        )}

        {node.kind !== "why_group" && (
          <SpineObjectIcon
            type={node.kind}
            size={isStrategic ? "sm" : "xs"}
            className={cn("shrink-0", isStrategic && "drop-shadow-sm")}
          />
        )}

        {clickable ? (
          <ClickableNodeTitle
            label={title}
            node={node}
            hierarchy={hierarchy}
            onNodeClick={onNodeClick}
            isActive={activeNodeId === node.id}
            className={cn(
              "flex-1 min-w-0 transition-all",
              isStrategic
                ? "font-semibold tracking-tight text-foreground"
                : "text-xs text-muted-foreground"
            )}
          />
        ) : (
          <NodeTitleContent
            title={title}
            node={node}
            hierarchy={hierarchy}
            className={cn(
              "font-medium truncate flex-1",
              isStrategic ? "text-foreground" : "text-xs text-muted-foreground"
            )}
          />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 text-muted-foreground opacity-70 transition-opacity group-hover/row:opacity-100">
          {node.kind === "cycle" &&
            node.meta?.cycleStartDate &&
            node.meta?.cycleEndDate && (
              <span className="text-xs tabular-nums whitespace-nowrap">
                {formatCyclePeriod(node.meta.cycleStartDate, node.meta.cycleEndDate)}
              </span>
            )}

          {node.kind === "epic" && (
            <>
              {node.meta?.totalImpact != null && (
                <EpicImpactSumBadge total={node.meta.totalImpact} />
              )}
              {node.meta?.effortDays != null && (
                <EffortBadge days={node.meta.effortDays} />
              )}
              <RatioBadge ratio={node.meta?.valueEffortRatio ?? null} />
            </>
          )}

          {node.kind === "feature" && (
            <>
              {node.meta?.impact != null && (
                <ImpactBadge impact={node.meta.impact} />
              )}
              <EffortBadge days={node.meta?.effortDays} />
              <RiskyCountBadge count={node.meta?.riskyCount ?? 0} />
            </>
          )}

          {node.kind === "story" && (
            <>
              {node.meta?.effortDays != null && (
                <EffortBadge days={node.meta.effortDays} />
              )}
              {node.meta?.complexity === 3 && (
                <RiskBadge risk={3} showLabel showIcon />
              )}
            </>
          )}

          {showStatusPill && (
            <StatusBadge
              status={
                node.kind === "cycle"
                  ? mapCycleStatus(node.status!)
                  : mapStoryStatus(node.status!)
              }
              size="sm"
            />
          )}

          {count !== undefined && count > 0 && (
            <span className="text-[11px] font-semibold tabular-nums bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
              {count}
            </span>
          )}
        </div>
      </div>

      {hasChildren && isOpen && <div className="pb-2">{children}</div>}
    </div>
  );
}

function renderNode(
  node: SpineTreeNode,
  depth: number,
  ctx: {
    openNodes: Record<string, boolean>;
    toggleNode: (id: string) => void;
    hierarchy: SpineTreeHierarchy;
    onNodeClick: (node: SpineTreeNode) => void;
    activeNodeId?: string | null;
    focusLineageIds: Set<string>;
    focusNodeId: string | null;
    members: SpineTreeMember[];
  }
): ReactNode {
  const isDimmed = ctx.focusNodeId !== null && !ctx.focusLineageIds.has(node.id);
  const isOpen = !!ctx.openNodes[node.id];
  const childCount = node.meta?.childCount ?? node.children.length;

  if (node.kind === "pain_point") {
    return (
      <div
        key={node.id}
        className={cn(
          "flex items-center gap-2 py-0.5 text-xs ml-1 min-w-0 transition-all",
          isDimmed ? "opacity-25" : "opacity-100"
        )}
        style={{ marginLeft: 12 }}
      >
        <SpineObjectIcon type="pain_point" size="xs" />
        <RiskBadge
          risk={severityToRisk(node.meta?.severity ?? "medium")}
          showIcon={severityToRisk(node.meta?.severity ?? "medium") === 3}
        />
        <ClickableNodeTitle
          label={node.title}
          node={node}
          hierarchy={ctx.hierarchy}
          onNodeClick={ctx.onNodeClick}
          isActive={ctx.activeNodeId === node.id}
          className="text-xs text-muted-foreground flex-1"
        />
      </div>
    );
  }

  if (node.kind === "task") {
    const notionUrl =
      node.status === "done" && node.meta?.notionUrl ? node.meta.notionUrl : null;

    return (
      <div
        key={node.id}
        className={cn(
          "group/task flex items-center gap-2 py-0.5 text-xs text-muted-foreground ml-1 min-w-0 transition-all",
          isDimmed ? "opacity-25" : "opacity-100"
        )}
        style={{ marginLeft: 12 }}
      >
        <SpineObjectIcon
          type="task"
          size="xs"
          className={node.meta?.taskDone ? "opacity-60 shrink-0" : "shrink-0"}
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            node.meta?.taskDone ? "line-through text-muted-foreground/70" : ""
          )}
        >
          {node.title}
        </span>
        {node.meta?.taskDone && <StatusBadge status="done" size="sm" />}

        <div className="ml-auto flex shrink-0 items-center gap-2 text-muted-foreground opacity-70 transition-opacity group-hover/task:opacity-100">
          <TaskAssigneeBadge
            assigneeId={node.meta?.assigneeId ?? null}
            members={ctx.members}
            size="xs"
          />
          {notionUrl && (
            <a
              href={notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Ouvrir la documentation Notion"
              onClick={(e) => e.stopPropagation()}
              className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm h-6 w-6 text-violet-600"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <TreeNodeShell
      key={node.id}
      title={node.title}
      node={node}
      count={childCount}
      isOpen={isOpen}
      onToggle={() => ctx.toggleNode(node.id)}
      health={node.health}
      depth={depth}
      hierarchy={ctx.hierarchy}
      onNodeClick={ctx.onNodeClick}
      activeNodeId={ctx.activeNodeId}
      isDimmed={isDimmed}
    >
      {node.children.map((child) => renderNode(child, depth + 1, ctx))}
      {node.children.length === 0 && node.kind === "feature" && isOpen && (
        <p className="text-xs text-zinc-400 italic py-1 ml-1">Aucune user story rattachée.</p>
      )}
      {node.children.length === 0 && node.kind === "persona" && (
        <p className="text-xs text-zinc-400 italic py-2 ml-1">Branche vide</p>
      )}
      {node.kind === "jtbd" && (node.meta?.solvedPainPointCount ?? 0) > 0 && isOpen && (
        <p className="text-[10px] text-zinc-400 ml-1 py-0.5">
          Résout {node.meta?.solvedPainPointCount} PP
        </p>
      )}
    </TreeNodeShell>
  );
}

export function SpineTreeView({
  projectSlug,
  rootNodes,
  hierarchy,
  onNodeClick,
  activeNodeId,
  emptyMessage,
  members = [],
}: Props) {
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>(() =>
    collectDefaultExpandedNodeIds(rootNodes)
  );
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  useEffect(() => {
    setOpenNodes(collectDefaultExpandedNodeIds(rootNodes));
    setFocusNodeId(null);
  }, [rootNodes]);

  const focusLineageIds = useMemo(
    () => (focusNodeId ? buildFocusLineage(rootNodes, focusNodeId) : new Set<string>()),
    [focusNodeId, rootNodes]
  );

  const handleNodeClick = (node: SpineTreeNode) => {
    if (!isClickableKind(node.kind)) return;
    setFocusNodeId(node.id);

    const path = findPath(rootNodes, node.id);
    if (path) {
      setOpenNodes((prev) => {
        const next = { ...prev };
        for (const item of path) {
          if (item.children.length > 0) {
            next[item.id] = true;
          }
        }
        return next;
      });
    }

    onNodeClick(node);
  };

  const toggleNode = (id: string) => {
    setOpenNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    collectAllIds(rootNodes).forEach((id) => {
      next[id] = true;
    });
    setOpenNodes(next);
  };

  const collapseAll = () => {
    setOpenNodes({});
  };

  if (rootNodes.length === 0) {
    const defaultEmpty =
      hierarchy.rootKind === "persona" ? (
        <>
          Aucun persona — commencez par la{" "}
          <Link href={`/projects/${projectSlug}/why`} className="text-emerald-600 hover:underline">
            Matrice Besoins
          </Link>
          .
        </>
      ) : hierarchy.rootKind === "epic" ? (
        "Aucun epic — créez-en depuis Epics/Features."
      ) : (
        "Aucun cycle — créez un sprint depuis la page Cycles."
      );

    return (
      <div className="sttns-card border-dashed text-center text-muted-foreground">
        {emptyMessage ?? defaultEmpty}
      </div>
    );
  }

  const renderCtx = {
    openNodes,
    toggleNode,
    hierarchy,
    onNodeClick: handleNodeClick,
    activeNodeId,
    focusLineageIds,
    focusNodeId,
    members,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Zoom sémantique & focus</span>
        </div>

        <div className="flex items-center gap-1.5">
          {focusNodeId && (
            <button
              type="button"
              onClick={() => setFocusNodeId(null)}
              className="sttns-btn-ghost sttns-btn-sm text-warning"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Focus ({focusLineageIds.size})
            </button>
          )}

          <button type="button" onClick={expandAll} className="sttns-btn-ghost sttns-btn-sm">
            <Eye className="h-3 w-3" />
            Tout déplier
          </button>

          <button type="button" onClick={collapseAll} className="sttns-btn-ghost sttns-btn-sm">
            <EyeOff className="h-3 w-3" />
            Tout replier
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {rootNodes.map((node) => {
          const isDimmed = focusNodeId !== null && !focusLineageIds.has(node.id);
          const isOpen = !!openNodes[node.id];

          return (
            <div
              key={node.id}
              className={cn(
                "sttns-card !p-3 transition-all duration-300",
                isDimmed ? "opacity-30 scale-[0.99]" : "opacity-100 scale-100"
              )}
            >
              <TreeNodeShell
                title={node.title}
                node={node}
                count={node.meta?.childCount ?? node.children.length}
                isOpen={isOpen}
                onToggle={() => toggleNode(node.id)}
                health={node.health}
                depth={0}
                hierarchy={hierarchy}
                onNodeClick={handleNodeClick}
                activeNodeId={activeNodeId}
                isDimmed={isDimmed}
              >
                {node.children.map((child) => renderNode(child, 1, renderCtx))}
                {node.children.length === 0 && (
                  <p className="text-xs text-muted-foreground italic py-1.5 ml-1">Branche vide</p>
                )}
              </TreeNodeShell>
            </div>
          );
        })}
      </div>
    </div>
  );
}
