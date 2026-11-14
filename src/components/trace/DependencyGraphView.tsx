"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Ghost, AlertTriangle, Link2, RefreshCcw } from "lucide-react";
import dagre from "dagre";
import {
  buildDependencyGraph,
  type DependencyGraph,
  type DependencyGraphInput,
  type DependencyNode,
} from "@/lib/sttns/dependencyGraph";
import { EmptyStateCoach } from "@/components/ui/EmptyStateCoach";
import {
  FeatureDependencyNode,
  JtbdDependencyNode,
  type DependencyFlowNodeData,
} from "@/components/trace/DependencyGraphNodes";
import { cn } from "@/lib/utils";

const NODE_TYPES: NodeTypes = {
  jtbd: JtbdDependencyNode,
  feature: FeatureDependencyNode,
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 96;

type Filter = "all" | "linked" | "ghost" | "orphan";

interface Props {
  projectSlug: string;
  input: DependencyGraphInput;
}

function toFlowNode(node: DependencyNode): Node<DependencyFlowNodeData> {
  return {
    id: node.id,
    type: node.kind,
    position: { x: 0, y: 0 },
    data: {
      title: node.title,
      kind: node.kind,
      personaTitle: node.personaTitle ?? null,
      epicTitle: node.epicTitle ?? null,
      degree: node.degree,
      impact: node.impact ?? null,
      health: node.health,
    },
  };
}

function layoutGraph(nodes: Node<DependencyFlowNodeData>[], edges: Edge[]): Node<DependencyFlowNodeData>[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 48, ranksep: 120, marginx: 40, marginy: 40 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  const jtbdIds = nodes.filter((n) => n.type === "jtbd").map((n) => n.id);
  const featureIds = nodes.filter((n) => n.type === "feature").map((n) => n.id);
  for (let i = 1; i < jtbdIds.length; i++) {
    g.setEdge(jtbdIds[i - 1], jtbdIds[i], { weight: 0.01 });
  }
  for (let i = 1; i < featureIds.length; i++) {
    g.setEdge(featureIds[i - 1], featureIds[i], { weight: 0.01 });
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const positioned = g.node(node.id);
    return {
      ...node,
      position: {
        x: positioned.x - NODE_WIDTH / 2,
        y: positioned.y - NODE_HEIGHT / 2,
      },
    };
  });
}

function FitViewOnUpdate({ layoutKey }: { layoutKey: string }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.2, duration: 260 });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [layoutKey, fitView]);
  return null;
}

function DependencyGraphCanvas({ projectSlug, input }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [reloadKey, setReloadKey] = useState(0);

  const graph: DependencyGraph = useMemo(
    () => buildDependencyGraph(input),
    [input]
  );

  const filteredNodes = useMemo(() => {
    if (filter === "all") return graph.nodes;
    if (filter === "linked")
      return graph.nodes.filter((n) => n.health === "linked");
    if (filter === "ghost")
      return graph.nodes.filter((n) => n.kind === "jtbd" && n.health === "ghost");
    return graph.nodes.filter((n) => n.kind === "feature" && n.health === "orphan");
  }, [graph.nodes, filter]);

  const filteredIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes]
  );

  const flowNodes = useMemo(() => {
    const baseNodes: Node<DependencyFlowNodeData>[] = filteredNodes.map(toFlowNode);
    const flowEdges: Edge[] = graph.edges
      .filter((e) => filteredIds.has(e.source) && filteredIds.has(e.target))
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#0ea5e9", strokeWidth: 1.5 },
      }));
    return { nodes: layoutGraph(baseNodes, flowEdges), edges: flowEdges };
  }, [filteredNodes, filteredIds, graph.edges]);

  const layoutKey = `${filter}-${flowNodes.nodes.length}-${flowNodes.edges.length}-${reloadKey}`;

  if (graph.nodes.length === 0) {
    return (
      <EmptyStateCoach
        type="jtbd"
        title="Aucun lien à afficher"
        explanation="Aucun JTBD ni Feature actifs dans ce projet. Créez au moins un besoin dans la Matrice Besoins puis rattachez-lui une Feature (context_type: job) pour matérialiser une dépendance."
        actionLabel="Ouvrir la Matrice Besoins"
        actionHref={`/projects/${projectSlug}/why`}
      />
    );
  }

  if (graph.edges.length === 0 && filter === "all") {
    return (
      <EmptyStateCoach
        type="feature"
        title="Aucune Feature liée à un JTBD"
        explanation="Le graphe se remplit dès qu'une Feature est rattachée à un JTBD via sttns_context_links (obligatoire par la Constitution Spine). Ouvrez le Portfolio pour lier vos Features."
        actionLabel="Ouvrir Epics / Features"
        actionHref={`/projects/${projectSlug}/portfolio`}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="Tous"
            count={graph.counts.jtbds + graph.counts.features}
          />
          <FilterChip
            active={filter === "linked"}
            onClick={() => setFilter("linked")}
            label="Liens actifs"
            count={graph.counts.links}
            icon={<Link2 className="h-3.5 w-3.5" />}
          />
          <FilterChip
            active={filter === "ghost"}
            onClick={() => setFilter("ghost")}
            label="JTBD fantômes"
            count={graph.counts.ghostJtbds}
            tone="warning"
            icon={<Ghost className="h-3.5 w-3.5" />}
          />
          <FilterChip
            active={filter === "orphan"}
            onClick={() => setFilter("orphan")}
            label="Features sans JTBD"
            count={graph.counts.orphanFeatures}
            tone="destructive"
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {graph.counts.jtbds} JTBD · {graph.counts.features} Feature ·{" "}
            {graph.counts.links} lien{graph.counts.links > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            className="sttns-btn-ghost sttns-btn-sm"
            onClick={() => setReloadKey((v) => v + 1)}
            title="Réajuster la vue"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Réajuster
          </button>
        </div>
      </div>

      {filter === "ghost" && graph.counts.ghostJtbds === 0 && (
        <FilterHint>
          Aucun JTBD fantôme — chaque besoin est adressé par au moins une Feature.
        </FilterHint>
      )}
      {filter === "orphan" && graph.counts.orphanFeatures === 0 && (
        <FilterHint>
          Aucune Feature orpheline — chaque Feature est reliée à un JTBD (Constitution Spine).
        </FilterHint>
      )}

      <div className="h-[min(72vh,720px)] min-h-[480px] w-full overflow-hidden rounded-xl border border-border bg-muted/30 shadow-inner">
        <ReactFlow
          nodes={flowNodes.nodes}
          edges={flowNodes.edges}
          nodeTypes={NODE_TYPES}
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
          <FitViewOnUpdate layoutKey={layoutKey} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d4d4d8" />
          <Controls
            showInteractive={false}
            className="!rounded-lg !border-border !bg-card !shadow-sm [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-muted-foreground [&>button]:hover:!bg-muted"
          />
          <MiniMap
            pannable
            zoomable
            nodeStrokeWidth={2}
            className="!rounded-lg !border-border !bg-card !shadow-sm"
            maskColor="rgba(250,250,250,0.75)"
          />
        </ReactFlow>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Source : <code className="rounded bg-muted px-1 py-0.5 text-[10px]">sttns_context_links</code>
        {" "}(<code className="rounded bg-muted px-1 py-0.5 text-[10px]">context_type: job</code>). Clic ganches nœud : ouvrez la fiche depuis{" "}
        <Link
          href={`/projects/${projectSlug}/portfolio`}
          className="text-primary underline underline-offset-2"
        >
          Portfolio
        </Link>{" "}
        ou{" "}
        <Link
          href={`/projects/${projectSlug}/why`}
          className="text-primary underline underline-offset-2"
        >
          Matrice Besoins
        </Link>
        .
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  tone = "default",
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "default" | "warning" | "destructive";
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition",
        active
          ? tone === "warning"
            ? "border-warning/40 bg-warning/10 text-warning"
            : tone === "destructive"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-muted"
      )}
      aria-pressed={active}
    >
      {icon}
      <span>{label}</span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

function FilterHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-success/20 bg-success/10 px-3 py-2 text-xs text-success">
      {children}
    </div>
  );
}

export function DependencyGraphView(props: Props) {
  return (
    <ReactFlowProvider>
      <DependencyGraphCanvas {...props} />
    </ReactFlowProvider>
  );
}
