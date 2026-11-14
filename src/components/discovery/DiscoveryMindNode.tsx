"use client";

import { memo, useMemo, useState } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import {
  formatDiscoverySpineBadge,
  type DiscoveryFlatNode,
  type DiscoveryMindOrigin,
} from "@/lib/sttns/discoveryMindMap";
import { cn } from "@/lib/utils";

export type DiscoveryMindNodeData = {
  flat: DiscoveryFlatNode;
  isActive: boolean;
  isExpanded: boolean;
  showAttached: boolean;
  onToggle: (id: string) => void;
};

export type DiscoveryMindFlowNode = Node<DiscoveryMindNodeData, "discovery">;

const ORIGIN_STYLES: Record<
  DiscoveryMindOrigin,
  { border: string; bg: string; badge: string }
> = {
  spine: {
    border: "border-solid border-violet-300",
    bg: "bg-violet-50",
    badge: "bg-violet-100 text-violet-800",
  },
  poured: {
    border: "border-solid border-teal-300",
    bg: "bg-teal-50",
    badge: "bg-teal-100 text-teal-800",
  },
  draft: {
    border: "border-dashed border-amber-400/80",
    bg: "bg-amber-50/70",
    badge: "bg-amber-100 text-amber-900",
  },
};

function DiscoveryMindNodeComponent({ id, data }: NodeProps) {
  const nodeData = data as DiscoveryMindNodeData;
  const flat = nodeData.flat;
  const styles = ORIGIN_STYLES[flat.origin];
  const [openAttached, setOpenAttached] = useState(false);

  const badgeLabel = useMemo(() => {
    if (flat.origin === "draft") return "Brouillon";
    if (flat.spineId) {
      return `Spine ${formatDiscoverySpineBadge(flat.kind, flat.spineId)}`;
    }
    if (flat.origin === "spine") return "Spine";
    return "Nouveau";
  }, [flat]);

  return (
    <div
      className={cn(
        "relative w-[240px] rounded-xl border-2 shadow-sm transition-all",
        styles.border,
        styles.bg,
        "cursor-pointer hover:shadow-md",
        nodeData.isActive && "ring-2 ring-primary/40 shadow-md",
        flat.collision && "ring-2 ring-warning border-warning bg-warning/10"
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-zinc-300 !bg-white" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-zinc-300 !bg-white" />

      <div className="flex items-start gap-2 p-3">
        {flat.childrenIds.length > 0 ? (
          <button
            type="button"
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm mt-0.5"
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onToggle(id);
            }}
            aria-label={nodeData.isExpanded ? "Replier" : "Déplier"}
          >
            {nodeData.isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </button>
        ) : (
          <span className="mt-0.5 w-7" aria-hidden />
        )}

        <SpineObjectIcon type={flat.kind} size="sm" className="mt-0.5 shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                styles.badge
              )}
            >
              {badgeLabel}
            </span>
            {flat.collision ? (
              <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning">
                Collision
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {flat.title}
          </p>
          {flat.attachedSummary && nodeData.showAttached ? (
            <button
              type="button"
              className="mt-1.5 block w-full text-left text-[11px] leading-snug text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setOpenAttached((v) => !v);
              }}
            >
              {openAttached ? "▾ " : "▸ "}
              {flat.attachedSummary}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const DiscoveryMindNode = memo(DiscoveryMindNodeComponent);
