"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import dagre from "dagre";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type NodeTypes,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import {
  DiscoveryMindNode,
  type DiscoveryMindFlowNode,
  type DiscoveryMindNodeData,
} from "@/components/discovery/DiscoveryMindNode";
import type { DiscoveryDraft } from "@/lib/sttns/discoveryMatrix";
import {
  buildDiscoveryFlatNodes,
  canReparentDiscoveryDraft,
  discoveryExpandableIds,
  isDiscoveryOrphanRoot,
  reparentTargetId,
  type DiscoveryFlatNode,
  type DiscoverySpineEpicRef,
  type DiscoverySpineFeatureRef,
  type DiscoverySpineStoryRef,
} from "@/lib/sttns/discoveryMindMap";
import { cn } from "@/lib/utils";

const NODE_W = 240;
const NODE_H = 110;

const nodeTypes = {
  discovery: DiscoveryMindNode,
} as NodeTypes;

function isNodeVisible(
  node: DiscoveryFlatNode,
  expandedIds: Set<string>,
  byId: Map<string, DiscoveryFlatNode>
): boolean {
  let current: DiscoveryFlatNode | undefined = node;
  while (current?.parentId) {
    if (!expandedIds.has(current.parentId)) return false;
    current = byId.get(current.parentId);
  }
  return true;
}

function layoutDiscoveryGraph(
  flatNodes: DiscoveryFlatNode[],
  expandedIds: Set<string>,
  activeNodeId: string | null,
  onToggle: (id: string) => void,
  showAttached: boolean
): { nodes: DiscoveryMindFlowNode[]; edges: Edge[] } {
  const byId = new Map(flatNodes.map((n) => [n.id, n]));
  const visible = flatNodes.filter((n) => isNodeVisible(n, expandedIds, byId));
  const visibleIds = new Set(visible.map((n) => n.id));

  const edges: Edge[] = visible
    .filter((n) => n.parentId && visibleIds.has(n.parentId))
    .map((n) => ({
      id: `e-${n.parentId}-${n.id}`,
      source: n.parentId!,
      target: n.id,
      type: "smoothstep",
      style: {
        stroke: n.origin === "draft" ? "#d97706" : "#a1a1aa",
        strokeWidth: 1.5,
        strokeDasharray: n.origin === "draft" ? "5 4" : undefined,
      },
    }));

  let nodes: DiscoveryMindFlowNode[] = visible.map((n) => ({
    id: n.id,
    type: "discovery",
    position: { x: 0, y: 0 },
    draggable: n.origin === "draft",
    data: {
      flat: n,
      isActive: activeNodeId === n.id || activeNodeId === n.draftId,
      isExpanded: expandedIds.has(n.id),
      showAttached,
      onToggle,
    } satisfies DiscoveryMindNodeData,
  }));

  if (nodes.length === 0) return { nodes, edges };

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 48, ranksep: 90, marginx: 32, marginy: 32 });
  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_W, height: NODE_H });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }
  dagre.layout(g);

  nodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_W / 2,
        y: pos.y - NODE_H / 2,
      },
    };
  });

  return { nodes, edges };
}

function FitViewOnLayout({ layoutKey }: { layoutKey: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const t = window.setTimeout(() => {
      void fitView({ padding: 0.18, duration: 240 });
    }, 50);
    return () => window.clearTimeout(t);
  }, [layoutKey, fitView]);
  return null;
}

type Props = {
  drafts: DiscoveryDraft[];
  spineEpics: DiscoverySpineEpicRef[];
  spineFeatures: DiscoverySpineFeatureRef[];
  spineStories?: DiscoverySpineStoryRef[];
  activeDraftId?: string | null;
  onSelectDraft?: (draftId: string | null) => void;
  onReparentDraft?: (draftId: string, parentId: string | null) => void;
  className?: string;
  /** Affiche le résumé des rattachés (hover / accordéon) */
  showAttached?: boolean;
  compact?: boolean;
};

function DiscoveryMindMapCanvas({
  drafts,
  spineEpics,
  spineFeatures,
  spineStories = [],
  activeDraftId = null,
  onSelectDraft,
  onReparentDraft,
  className,
  showAttached = true,
  compact = false,
}: Props) {
  const flatNodes = useMemo(
    () =>
      buildDiscoveryFlatNodes(drafts, spineEpics, spineFeatures, { spineStories }),
    [drafts, spineEpics, spineFeatures, spineStories]
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // Déplie tout au premier chargement / changement structurel léger
    setExpandedIds(discoveryExpandableIds(flatNodes));
  }, [flatNodes.length]);

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const { nodes, edges } = useMemo(
    () =>
      layoutDiscoveryGraph(
        flatNodes,
        expandedIds,
        activeDraftId,
        toggleExpand,
        showAttached
      ),
    [flatNodes, expandedIds, activeDraftId, toggleExpand, showAttached]
  );

  const layoutKey = `${nodes.length}-${expandedIds.size}-${activeDraftId ?? ""}`;

  const expandAll = useCallback(() => {
    setExpandedIds(discoveryExpandableIds(flatNodes));
  }, [flatNodes]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const onNodeClick = useCallback(
    (_: MouseEvent, node: DiscoveryMindFlowNode) => {
      const draftId = node.data.flat.draftId;
      if (draftId) onSelectDraft?.(draftId);
      else if (!isDiscoveryOrphanRoot(node.id)) onSelectDraft?.(null);
    },
    [onSelectDraft]
  );

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node, _nodes) => {
      if (!onReparentDraft) return;
      const dragged = flatNodes.find((n) => n.id === node.id);
      if (!dragged || dragged.origin !== "draft" || !dragged.draftId) return;
      const draft = drafts.find((d) => d.id === dragged.draftId);
      if (!draft) return;

      const cx = node.position.x + NODE_W / 2;
      const cy = node.position.y + NODE_H / 2;

      let best: DiscoveryFlatNode | null = null;
      let bestDist = Infinity;
      for (const candidate of flatNodes) {
        if (candidate.id === dragged.id) continue;
        if (!canReparentDiscoveryDraft(draft, candidate)) continue;
        const flowNode = nodes.find((n) => n.id === candidate.id);
        if (!flowNode) continue;
        const tx = flowNode.position.x + NODE_W / 2;
        const ty = flowNode.position.y + NODE_H / 2;
        const dist = Math.hypot(cx - tx, cy - ty);
        if (dist < bestDist && dist < 160) {
          bestDist = dist;
          best = candidate;
        }
      }
      if (!best) return;
      onReparentDraft(draft.id, reparentTargetId(best));
    },
    [drafts, flatNodes, nodes, onReparentDraft]
  );

  if (flatNodes.length === 0 || (flatNodes.length === 1 && isDiscoveryOrphanRoot(flatNodes[0]!.id))) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-sm text-muted-foreground",
          compact ? "min-h-[240px]" : "min-h-[420px]",
          className
        )}
      >
        Aucun brouillon à cartographier. Ajoutez une ligne dans le tableau.
      </div>
    );
  }

  return (
    <div className={cn("relative flex w-full flex-col", className)}>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="text-xs text-muted-foreground">
          Epic → Feature → Story ·{" "}
          <span className="text-amber-800">pointillé = brouillon</span>
          {" · "}
          <span className="text-violet-700">plein = Spine</span>
          {onReparentDraft ? " · glisser un brouillon pour changer de parent" : null}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm"
            onClick={expandAll}
            title="Tout déplier"
            aria-label="Tout déplier"
          >
            <ChevronsUpDown className="h-4 w-4 shrink-0" />
          </button>
          <button
            type="button"
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm"
            onClick={collapseAll}
            title="Tout replier"
            aria-label="Tout replier"
          >
            <ChevronsDownUp className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>
      <div className={cn("overflow-hidden rounded-xl border border-border bg-muted/30 shadow-inner", compact ? "h-[320px]" : "h-[min(72vh,720px)] min-h-[480px]")}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.6}
          panOnScroll
          zoomOnScroll
          panOnDrag
          nodesDraggable={Boolean(onReparentDraft)}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <FitViewOnLayout layoutKey={layoutKey} />
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#d4d4d8" />
          <Controls
            showInteractive={false}
            className="!rounded-lg !border-border !bg-card !shadow-sm"
          />
          {!compact ? (
            <MiniMap
              pannable
              zoomable
              className="!rounded-lg !border-border !bg-card !shadow-sm"
              maskColor="rgba(250, 250, 250, 0.75)"
            />
          ) : null}
        </ReactFlow>
      </div>
    </div>
  );
}

export function DiscoveryMindMap(props: Props) {
  return (
    <ReactFlowProvider>
      <DiscoveryMindMapCanvas {...props} />
    </ReactFlowProvider>
  );
}
