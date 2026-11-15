"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { TaskAssigneeBadge } from "@/components/execution/TaskAssigneeBadge";
import { EffortBadge, RiskBadge } from "@/components/ui/ValueEffortBadges";
import type { MindMapNodeData, MindMapNodeKind } from "./types";
import { cn } from "@/lib/utils";
import type { ComplexityLevel } from "@/lib/sttns/valueEffort";
import { safeHref } from "@/lib/security/urls";

const KIND_STYLES: Record<
  MindMapNodeKind,
  { border: string; bg: string; badge: string; ring: string }
> = {
  persona: {
    border: "border-indigo-200",
    bg: "bg-indigo-50/90",
    badge: "bg-indigo-100 text-indigo-800",
    ring: "ring-indigo-200",
  },
  pain_point: {
    border: "border-fuchsia-200",
    bg: "bg-fuchsia-50/90",
    badge: "bg-fuchsia-100 text-fuchsia-800",
    ring: "ring-fuchsia-200",
  },
  jtbd: {
    border: "border-sky-200",
    bg: "bg-sky-50/90",
    badge: "bg-sky-100 text-sky-800",
    ring: "ring-sky-200",
  },
  epic: {
    border: "border-violet-200",
    bg: "bg-violet-50/90",
    badge: "bg-violet-100 text-violet-800",
    ring: "ring-violet-200",
  },
  feature: {
    border: "border-teal-200",
    bg: "bg-teal-50/90",
    badge: "bg-teal-100 text-teal-800",
    ring: "ring-teal-200",
  },
  story: {
    border: "border-cyan-200",
    bg: "bg-cyan-50/90",
    badge: "bg-cyan-100 text-cyan-800",
    ring: "ring-cyan-200",
  },
  task: {
    border: "border-border",
    bg: "bg-muted/90",
    badge: "bg-muted text-muted-foreground",
    ring: "ring-border",
  },
  cycle: {
    border: "border-blue-200",
    bg: "bg-blue-50/90",
    badge: "bg-blue-100 text-blue-800",
    ring: "ring-blue-200",
  },
};

function severityToRisk(severity: string): ComplexityLevel {
  switch (severity) {
    case "critical":
      return 3;
    case "high":
      return 2;
    default:
      return 1;
  }
}

type ShellProps = NodeProps;

function MindMapNodeShellComponent({ id, data }: ShellProps) {
  const nodeData = data as MindMapNodeData;
  const styles = KIND_STYLES[nodeData.kind];
  const showAssignee = nodeData.kind === "story" || nodeData.kind === "task";
  const docLabel = nodeData.kind === "task" ? "Notion" : "Documentation";
  const isCompact = nodeData.isTraceRef === true;
  const traceRoleLabel =
    nodeData.traceRole === "feature" ? "Feature" : nodeData.traceRole === "epic" ? "Epic" : null;

  if (isCompact && traceRoleLabel) {
    const styles = KIND_STYLES[nodeData.kind];
    return (
      <div
        className={cn(
          "relative rounded-lg border border-dashed shadow-sm backdrop-blur-sm transition-all",
          "cursor-pointer hover:shadow-md",
          nodeData.traceWide ? "w-[220px]" : "w-[100px]",
          styles.border,
          styles.bg,
          nodeData.isActive && `ring-2 ${styles.ring} shadow-md`,
          nodeData.isLoading && "opacity-60"
        )}
      >
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="!h-1.5 !w-1.5 !border-zinc-300 !bg-white"
        />
        <div className="px-2 py-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{traceRoleLabel}</p>
          <div className="mt-0.5 flex items-start gap-1">
            <SpineObjectIcon type={nodeData.kind} size="xs" className="mt-0.5 shrink-0" />
            <p
              className="line-clamp-3 font-semibold leading-snug text-foreground"
              style={{ fontSize: "var(--sttns-text-body)" }}
            >
              {nodeData.title}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border shadow-sm backdrop-blur-sm transition-all",
        isCompact ? "w-[180px]" : "w-[220px]",
        styles.border,
        styles.bg,
        "cursor-pointer hover:shadow-md hover:border-zinc-300",
        nodeData.isActive && `ring-2 ${styles.ring} shadow-md`,
        nodeData.isLoading && "opacity-60"
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-zinc-300 !bg-white" />
      {(nodeData.kind === "story" || nodeData.kind === "cycle") && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!h-1.5 !w-1.5 !border-zinc-300 !bg-white"
        />
      )}

      <div className={cn("flex items-start gap-2", isCompact ? "p-2" : "p-3")}>
        <SpineObjectIcon type={nodeData.kind} size="xs" className="mt-0.5 shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p
              className="line-clamp-2 font-semibold leading-snug text-foreground"
              style={{ fontSize: "var(--sttns-text-body)" }}
            >
              {nodeData.title}
            </p>
            {showAssignee && (
              <TaskAssigneeBadge
                assigneeId={nodeData.assigneeId}
                members={nodeData.members}
                size="xs"
                className="mt-0.5"
              />
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {nodeData.severity && nodeData.kind === "pain_point" && (
              <RiskBadge
                risk={severityToRisk(nodeData.severity)}
                showIcon={severityToRisk(nodeData.severity) === 3}
              />
            )}
            {nodeData.solvedPainPointCount != null && nodeData.kind === "jtbd" && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", styles.badge)}>
                {nodeData.solvedPainPointCount} PP résolu
                {nodeData.solvedPainPointCount !== 1 ? "s" : ""}
              </span>
            )}
            {nodeData.effortPoints != null && nodeData.effortPoints > 0 ? (
              <EffortBadge days={nodeData.effortPoints} />
            ) : nodeData.kind === "story" ? (
              <EffortBadge days={null} />
            ) : null}
            {nodeData.cycleName && nodeData.kind === "story" && (
              <span className="inline-flex max-w-[88px] items-center gap-0.5 truncate rounded-md bg-info/10 px-1.5 py-0.5 text-[10px] font-medium text-info">
                <SpineObjectIcon type="cycle" size="xs" className="shrink-0" />
                <span className="truncate">{nodeData.cycleName}</span>
              </span>
            )}
            {safeHref(nodeData.docUrl) && (
              <a
                href={safeHref(nodeData.docUrl)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Ouvrir ${docLabel}`}
                aria-label={`Ouvrir ${docLabel}`}
                onClick={(e) => e.stopPropagation()}
                className="sttns-btn-ghost sttns-btn-sm h-5 px-1.5 text-[10px] text-primary"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                Doc
              </a>
            )}
            {nodeData.hasChildren && !isCompact && (
              <span className="text-[10px] text-muted-foreground">
                {nodeData.childCount} enfant{nodeData.childCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {nodeData.hasChildren && !isCompact && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onToggle(id);
            }}
            title={nodeData.isExpanded ? "Replier les enfants" : "Déplier les enfants"}
            aria-label={nodeData.isExpanded ? "Replier" : "Déplier"}
            className={cn(
              "sttns-btn-icon sttns-btn-sm",
              !nodeData.isExpanded && "border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {nodeData.isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-zinc-300 !bg-white" />
    </div>
  );
}

export const MindMapNodeShell = memo(MindMapNodeShellComponent);
