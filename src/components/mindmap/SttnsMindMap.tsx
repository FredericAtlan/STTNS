"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Briefcase, Calendar, ChevronsDownUp, ChevronsUpDown, Target } from "lucide-react";

import type { SpineTreeMember, SpineTreeNode } from "@/lib/sttns/spineTree";
import { CycleNode } from "./CycleNode";
import { EpicNode } from "./EpicNode";
import { FeatureNode } from "./FeatureNode";
import { JtbdNode } from "./JtbdNode";
import { PainPointNode } from "./PainPointNode";
import { PersonaNode } from "./PersonaNode";
import { StoryNode } from "./StoryNode";
import { TaskNode } from "./TaskNode";
import {
  buildFlowGraph,
  flattenExecutionTree,
  flattenProductTree,
  flattenStrategyTree,
} from "./mindmapGraph";
import { collectExpandableNodeIds, type MindMapNodeKind, type MindMapViewMode } from "./types";
import { cn } from "@/lib/utils";

const nodeTypes = {
  persona: PersonaNode,
  pain_point: PainPointNode,
  jtbd: JtbdNode,
  epic: EpicNode,
  feature: FeatureNode,
  story: StoryNode,
  task: TaskNode,
  cycle: CycleNode,
} as NodeTypes;

interface Props {
  strategyRoots: SpineTreeNode[];
  productRoots: SpineTreeNode[];
  executionRoots: SpineTreeNode[];
  members: SpineTreeMember[];
  viewMode: MindMapViewMode;
  onViewModeChange: (mode: MindMapViewMode) => void;
  activeNodeId?: string | null;
  loadingNodeId?: string | null;
  onNodeClick?: (nodeId: string, kind: MindMapNodeKind) => void;
}

function FitViewOnLayout({ layoutKey }: { layoutKey: string }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.2, duration: 280 });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [layoutKey, fitView]);

  return null;
}

const EMPTY_MESSAGES: Record<MindMapViewMode, string> = {
  strategy:
    "Aucun Persona, Pain Point ou JTBD. Complétez la matrice Why (Personas) pour alimenter cette vue.",
  product: "Aucun Epic, Feature ou Story à afficher. Créez votre Spine dans Epics/Features.",
  execution:
    "Aucun cycle ou story planifiée. Assignez des stories depuis Stories Backlogs.",
};

const VIEW_HINTS: Record<MindMapViewMode, string> = {
  strategy: "Persona → Pain Point → JTBD · liens solides",
  product: "Epic → Feature → Story · badge cycle sur les stories",
  execution:
    "Cycle → Story · pills Feature + Epic sous chaque story (traits pointillés vert / violet)",
};

function MindMapCanvas({
  strategyRoots,
  productRoots,
  executionRoots,
  members,
  viewMode,
  onViewModeChange,
  activeNodeId = null,
  loadingNodeId = null,
  onNodeClick,
}: Props) {
  const flatNodes = useMemo(() => {
    if (viewMode === "strategy") return flattenStrategyTree(strategyRoots);
    if (viewMode === "product") return flattenProductTree(productRoots);
    return flattenExecutionTree(executionRoots);
  }, [viewMode, strategyRoots, productRoots, executionRoots]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setExpandedIds(new Set());
  }, [viewMode]);

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(collectExpandableNodeIds(flatNodes));
  }, [flatNodes]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const { nodes, edges } = useMemo(
    () =>
      buildFlowGraph(
        flatNodes,
        expandedIds,
        members,
        toggleExpand,
        activeNodeId,
        loadingNodeId,
        viewMode
      ),
    [flatNodes, expandedIds, members, toggleExpand, activeNodeId, loadingNodeId, viewMode]
  );

  const layoutKey = `${viewMode}-${expandedIds.size}-${nodes.length}`;

  const allExpanded =
    flatNodes.filter((n) => n.childCount > 0).length > 0 &&
    flatNodes.filter((n) => n.childCount > 0).every((n) => expandedIds.has(n.id));

  if (flatNodes.length === 0) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
        <p className="max-w-md text-center text-sm text-muted-foreground">{EMPTY_MESSAGES[viewMode]}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <nav
          className="inline-flex flex-wrap rounded-lg border border-border bg-card p-0.5 shadow-sm"
          aria-label="Perspective Arbre de Relations"
        >
          <button
            type="button"
            onClick={() => onViewModeChange("strategy")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              viewMode === "strategy"
                ? "bg-primary text-primary-foreground"
                : "sttns-btn-ghost"
            )}
          >
            <Target className="h-3.5 w-3.5" />
            Stratégie
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("product")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              viewMode === "product"
                ? "bg-primary text-primary-foreground"
                : "sttns-btn-ghost"
            )}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Produit
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("execution")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              viewMode === "execution"
                ? "bg-primary text-primary-foreground"
                : "sttns-btn-ghost"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            Exécution
          </button>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <p className="hidden text-xs text-muted-foreground lg:block">
            {VIEW_HINTS[viewMode]}
            {" · "}
            <span className="text-primary">Doc</span> = lien doc
          </p>
          <button
            type="button"
            onClick={expandAll}
            disabled={allExpanded}
            className="sttns-btn-ghost sttns-btn-sm"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
            Tout déplier
          </button>
          <button
            type="button"
            onClick={collapseAll}
            disabled={expandedIds.size === 0}
            className="sttns-btn-ghost sttns-btn-sm"
          >
            <ChevronsDownUp className="h-3.5 w-3.5" />
            Tout replier
          </button>
        </div>
      </div>

      <div className="h-[min(72vh,720px)] min-h-[480px] w-full overflow-hidden rounded-xl border border-border bg-muted/30 shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => {
            if (onNodeClick && node.type) {
              onNodeClick(node.id, node.type as MindMapNodeKind);
            }
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.15}
          maxZoom={2}
          panOnScroll
          zoomOnScroll
          panOnDrag
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <FitViewOnLayout layoutKey={layoutKey} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d4d4d8" />
          <Controls
            showInteractive={false}
            className="!rounded-lg !border-border !bg-card !shadow-sm [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-muted-foreground [&>button]:hover:!bg-muted"
          />
          <MiniMap
            nodeStrokeWidth={2}
            pannable
            zoomable
            className="!rounded-lg !border-border !bg-card !shadow-sm"
            maskColor="rgba(250, 250, 250, 0.75)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function SttnsMindMap(props: Props) {
  return (
    <ReactFlowProvider>
      <MindMapCanvas {...props} />
    </ReactFlowProvider>
  );
}
