import type { CSSProperties } from "react";
import { SPINE_ORPHAN_STORIES_GROUP_ID, type SpineTreeNode } from "@/lib/sttns/spineTree";
import type {
  FlatMindMapNode,
  MindMapFlowEdge,
  MindMapFlowNode,
  MindMapMember,
  MindMapNodeData,
  MindMapNodeKind,
  MindMapViewMode,
} from "./types";
import {
  MINDMAP_CYCLE_COL_GAP,
  MINDMAP_CYCLE_ROW_GAP,
  MINDMAP_NODE_HEIGHT,
  MINDMAP_NODE_WIDTH,
  MINDMAP_TASK_INDENT,
  MINDMAP_TRACE_PAIR_GAP,
  MINDMAP_TRACE_PILL_HEIGHT,
  MINDMAP_TRACE_PILL_WIDTH,
  MINDMAP_TRACE_STACK_GAP,
} from "./types";
import dagre from "dagre";

const PRODUCT_KINDS = new Set<MindMapNodeKind>(["epic", "feature", "story", "task"]);
const EXECUTION_KINDS = new Set<MindMapNodeKind>(["cycle", "story", "task", "feature"]);

function isProductKind(kind: string): kind is MindMapNodeKind {
  return PRODUCT_KINDS.has(kind as MindMapNodeKind);
}

function isExecutionKind(kind: string): kind is MindMapNodeKind {
  return EXECUTION_KINDS.has(kind as MindMapNodeKind);
}

function directProductChildren(node: SpineTreeNode): SpineTreeNode[] {
  return node.children.flatMap((child) => {
    if (child.kind === "why_group") {
      return child.children.filter((gc) => isProductKind(gc.kind));
    }
    return isProductKind(child.kind) ? [child] : [];
  });
}

function directExecutionChildren(node: SpineTreeNode): SpineTreeNode[] {
  return node.children.filter((child) => isExecutionKind(child.kind));
}

function mapSpineNodeToFlat(
  node: SpineTreeNode,
  parentId: string | null,
  getChildren: (n: SpineTreeNode) => SpineTreeNode[]
): FlatMindMapNode {
  const children = getChildren(node);
  return {
    id: node.id,
    kind: node.kind as MindMapNodeKind,
    title: node.title,
    effortPoints: node.meta?.effortDays ?? node.meta?.effortPoints ?? null,
    assigneeId: node.meta?.assigneeId ?? null,
    docUrl: node.meta?.docUrl ?? node.meta?.notionUrl ?? null,
    cycleName: node.meta?.cycleName ?? null,
    severity: node.meta?.severity ?? null,
    solvedPainPointCount: node.meta?.solvedPainPointCount ?? null,
    childCount: children.length,
    parentId,
    childrenIds: children.map((c) => c.id),
    linkedFeatureId: node.meta?.featureId ?? null,
    linkedEpicId: node.meta?.epicId ?? null,
    linkedFeatureTitle: node.meta?.featureTitle ?? null,
    linkedEpicTitle: node.meta?.epicTitle ?? null,
  };
}

function flattenWithChildren(
  roots: SpineTreeNode[],
  kindFilter: (kind: string) => kind is MindMapNodeKind,
  getChildren: (node: SpineTreeNode) => SpineTreeNode[]
): FlatMindMapNode[] {
  const out: FlatMindMapNode[] = [];

  function walk(node: SpineTreeNode, parentId: string | null) {
    if (node.kind === "why_group") {
      for (const child of node.children) {
        walk(child, parentId);
      }
      return;
    }

    if (!kindFilter(node.kind)) return;

    const children = getChildren(node);
    out.push(mapSpineNodeToFlat(node, parentId, getChildren));

    for (const child of children) {
      walk(child, node.id);
    }
  }

  for (const root of roots) {
    if (root.kind === "why_group") {
      for (const child of root.children) {
        walk(child, null);
      }
    } else {
      walk(root, null);
    }
  }

  return out;
}

/** Persona → Pain Point → JTBD (JTBD rattachés aux pain points qu’ils résolvent). */
export function flattenStrategyTree(roots: SpineTreeNode[]): FlatMindMapNode[] {
  const out: FlatMindMapNode[] = [];

  for (const persona of roots) {
    if (persona.kind !== "persona") continue;

    const whyGroup = persona.children.find((c) => c.kind === "why_group");
    const painPoints = whyGroup?.children.filter((c) => c.kind === "pain_point") ?? [];
    const jtbds = whyGroup?.children.filter((c) => c.kind === "jtbd") ?? [];

    const jtbdsByPainPoint = new Map<string, SpineTreeNode[]>();
    const linkedJtbdIds = new Set<string>();

    for (const jtbd of jtbds) {
      const solvedIds = jtbd.meta?.solvedPainPointIds ?? [];
      for (const ppId of solvedIds) {
        linkedJtbdIds.add(jtbd.id);
        const list = jtbdsByPainPoint.get(ppId) ?? [];
        if (!list.some((n) => n.id === jtbd.id)) list.push(jtbd);
        jtbdsByPainPoint.set(ppId, list);
      }
    }

    const orphanJtbds = jtbds.filter((j) => !linkedJtbdIds.has(j.id));

    const painPointNodes: FlatMindMapNode[] = painPoints.map((pp) => {
      const ppJtbds = jtbdsByPainPoint.get(pp.id) ?? [];
      return {
        id: pp.id,
        kind: "pain_point",
        title: pp.title,
        effortPoints: null,
        assigneeId: null,
        docUrl: null,
        cycleName: null,
        severity: pp.meta?.severity ?? null,
        solvedPainPointCount: null,
        childCount: ppJtbds.length,
        parentId: persona.id,
        childrenIds: ppJtbds.map((j) => `${j.id}__pp__${pp.id}`),
      };
    });

    const jtbdNodes: FlatMindMapNode[] = [];

    for (const pp of painPoints) {
      for (const jtbd of jtbdsByPainPoint.get(pp.id) ?? []) {
        jtbdNodes.push({
          id: `${jtbd.id}__pp__${pp.id}`,
          kind: "jtbd",
          title: jtbd.title,
          effortPoints: null,
          assigneeId: null,
          docUrl: null,
          cycleName: null,
          severity: null,
          solvedPainPointCount: jtbd.meta?.solvedPainPointCount ?? null,
          childCount: 0,
          parentId: pp.id,
          childrenIds: [],
        });
      }
    }

    for (const jtbd of orphanJtbds) {
      jtbdNodes.push({
        id: jtbd.id,
        kind: "jtbd",
        title: jtbd.title,
        effortPoints: null,
        assigneeId: null,
        docUrl: null,
        cycleName: null,
        severity: null,
        solvedPainPointCount: jtbd.meta?.solvedPainPointCount ?? null,
        childCount: 0,
        parentId: persona.id,
        childrenIds: [],
      });
    }

    const personaChildIds = [
      ...painPointNodes.map((p) => p.id),
      ...orphanJtbds.map((j) => j.id),
    ];

    out.push({
      id: persona.id,
      kind: "persona",
      title: persona.title,
      effortPoints: null,
      assigneeId: null,
      docUrl: null,
      cycleName: null,
      severity: null,
      solvedPainPointCount: null,
      childCount: personaChildIds.length,
      parentId: null,
      childrenIds: personaChildIds,
    });

    out.push(...painPointNodes, ...jtbdNodes);
  }

  return out;
}

/** Epic → Feature → Story → Task.
 * Ignore le groupe virtuel SPINE_ORPHAN_STORIES_GROUP_ID pour éviter que
 * les stories sans feature parente n'apparaissent en racines nues du graphe
 * (elles restent visibles dans l'Arbre de Traçabilité).
 */
export function flattenProductTree(roots: SpineTreeNode[]): FlatMindMapNode[] {
  const filteredRoots = roots.filter((r) => r.id !== SPINE_ORPHAN_STORIES_GROUP_ID);
  return flattenWithChildren(filteredRoots, isProductKind, directProductChildren);
}

/** Cycle → Story → Task (colonnes par cycle) */
export function flattenExecutionTree(roots: SpineTreeNode[]): FlatMindMapNode[] {
  return flattenWithChildren(roots, isExecutionKind, directExecutionChildren);
}

function isNodeVisible(flat: FlatMindMapNode, expandedIds: Set<string>, byId: Map<string, FlatMindMapNode>): boolean {
  if (!flat.parentId) return true;
  let current: FlatMindMapNode | undefined = flat;
  while (current?.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent || !expandedIds.has(parent.id)) return false;
    current = parent;
  }
  return true;
}

function buildNodeData(
  n: FlatMindMapNode,
  expandedIds: Set<string>,
  members: MindMapMember[],
  onToggle: (nodeId: string) => void,
  activeNodeId: string | null,
  loadingNodeId: string | null,
  options?: { isTraceRef?: boolean; traceRole?: "feature" | "epic"; traceWide?: boolean }
): MindMapNodeData {
  const isTraceRef = options?.isTraceRef ?? false;
  return {
    title: n.title,
    effortPoints: n.effortPoints,
    assigneeId: n.assigneeId,
    docUrl: n.docUrl,
    cycleName: n.cycleName,
    severity: n.severity,
    solvedPainPointCount: n.solvedPainPointCount,
    childCount: n.childCount,
    hasChildren: n.childCount > 0 && !isTraceRef,
    isExpanded: expandedIds.has(n.id),
    kind: n.kind,
    members,
    isActive: activeNodeId === n.id,
    isLoading: loadingNodeId === n.id,
    isTraceRef,
    traceRole: options?.traceRole,
    traceWide: options?.traceWide,
    onToggle,
  };
}

function traceNodeId(storyId: string, role: "feature" | "epic"): string {
  return `trace-${storyId}-${role}`;
}

function dottedEdgeStyle(color: string): CSSProperties {
  return {
    stroke: color,
    strokeWidth: 1.5,
    strokeDasharray: "5 4",
  };
}

function pushTracePill(
  positioned: MindMapFlowNode[],
  traceEdges: MindMapFlowEdge[],
  opts: {
    storyId: string;
    role: "feature" | "epic";
    title: string;
    x: number;
    y: number;
    sourceId: string;
    edgeColor: string;
    traceWide?: boolean;
    expandedIds: Set<string>;
    members: MindMapMember[];
    onToggle: (nodeId: string) => void;
    activeNodeId: string | null;
    loadingNodeId: string | null;
  }
): string {
  const id = traceNodeId(opts.storyId, opts.role);
  const traceFlat: FlatMindMapNode = {
    id,
    kind: opts.role,
    title: opts.title,
    effortPoints: null,
    assigneeId: null,
    docUrl: null,
    cycleName: null,
    severity: null,
    solvedPainPointCount: null,
    childCount: 0,
    parentId: null,
    childrenIds: [],
  };

  positioned.push({
    id,
    type: opts.role,
    position: { x: opts.x, y: opts.y },
    hidden: false,
    data: buildNodeData(
      traceFlat,
      opts.expandedIds,
      opts.members,
      opts.onToggle,
      opts.activeNodeId,
      opts.loadingNodeId,
      { isTraceRef: true, traceRole: opts.role, traceWide: opts.traceWide }
    ),
  });

  traceEdges.push({
    id: `trace-e-${opts.sourceId}-${id}`,
    source: opts.sourceId,
    target: id,
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "smoothstep",
    hidden: false,
    style: dottedEdgeStyle(opts.edgeColor),
  });

  return id;
}

function layoutWithDagre(nodes: MindMapFlowNode[], edges: MindMapFlowEdge[]): MindMapFlowNode[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 56, ranksep: 100, marginx: 40, marginy: 40 });

  for (const node of nodes) {
    g.setNode(node.id, { width: MINDMAP_NODE_WIDTH, height: MINDMAP_NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - MINDMAP_NODE_WIDTH / 2,
        y: pos.y - MINDMAP_NODE_HEIGHT / 2,
      },
    };
  });
}

/** Colonnes cycles · traçabilité Feature/Epic en pills sous chaque story. */
function layoutCycleColumns(
  visibleNodes: FlatMindMapNode[],
  expandedIds: Set<string>,
  members: MindMapMember[],
  onToggle: (nodeId: string) => void,
  activeNodeId: string | null,
  loadingNodeId: string | null
): { nodes: MindMapFlowNode[]; traceEdges: MindMapFlowEdge[] } {
  const cycleRoots = visibleNodes.filter((n) => n.kind === "cycle" && !n.parentId);
  const positioned: MindMapFlowNode[] = [];
  const traceEdges: MindMapFlowEdge[] = [];

  const columnWidth = MINDMAP_NODE_WIDTH + MINDMAP_CYCLE_COL_GAP;

  cycleRoots.forEach((cycle, colIndex) => {
    const x = colIndex * columnWidth;
    let y = 0;

    const pushNode = (flat: FlatMindMapNode, offsetX = 0) => {
      positioned.push({
        id: flat.id,
        type: flat.kind,
        position: { x: x + offsetX, y },
        hidden: false,
        data: buildNodeData(flat, expandedIds, members, onToggle, activeNodeId, loadingNodeId),
      });
      y += MINDMAP_NODE_HEIGHT + MINDMAP_CYCLE_ROW_GAP;
    };

    pushNode(cycle);

    if (!expandedIds.has(cycle.id)) return;

    const cycleFeatures = visibleNodes.filter(
      (n) => n.parentId === cycle.id && n.kind === "feature"
    );
    if (cycleFeatures.length > 0) {
      for (const feature of cycleFeatures) {
        pushNode(feature);
      }
      return;
    }

    const stories = visibleNodes.filter((n) => n.parentId === cycle.id && n.kind === "story");
    for (const story of stories) {
      const storyTopY = y;
      pushNode(story);

      const hasFeature = Boolean(story.linkedFeatureId && story.linkedFeatureTitle);
      const hasEpic = Boolean(story.linkedEpicId && story.linkedEpicTitle);

      if (hasFeature || hasEpic) {
        const traceY = storyTopY + MINDMAP_NODE_HEIGHT + MINDMAP_TRACE_STACK_GAP;
        const dual = hasFeature && hasEpic;
        const featureX = x;
        const epicX = dual ? x + MINDMAP_TRACE_PILL_WIDTH + MINDMAP_TRACE_PAIR_GAP : x;

        if (hasFeature) {
          pushTracePill(positioned, traceEdges, {
            storyId: story.id,
            role: "feature",
            title: story.linkedFeatureTitle!,
            x: featureX,
            y: traceY,
            sourceId: story.id,
            edgeColor: "#059669",
            traceWide: !dual,
            expandedIds,
            members,
            onToggle,
            activeNodeId,
            loadingNodeId,
          });
        }

        if (hasEpic) {
          pushTracePill(positioned, traceEdges, {
            storyId: story.id,
            role: "epic",
            title: story.linkedEpicTitle!,
            x: epicX,
            y: traceY,
            sourceId: story.id,
            edgeColor: "#7c3aed",
            traceWide: !dual,
            expandedIds,
            members,
            onToggle,
            activeNodeId,
            loadingNodeId,
          });
        }

        y = Math.max(y, traceY + MINDMAP_TRACE_PILL_HEIGHT + MINDMAP_CYCLE_ROW_GAP);
      }

      if (!expandedIds.has(story.id)) continue;
      const tasks = visibleNodes.filter((n) => n.parentId === story.id && n.kind === "task");
      for (const task of tasks) {
        pushNode(task, MINDMAP_TASK_INDENT);
      }
    }
  });

  return { nodes: positioned, traceEdges };
}

export function buildFlowGraph(
  flatNodes: FlatMindMapNode[],
  expandedIds: Set<string>,
  members: MindMapMember[],
  onToggle: (nodeId: string) => void,
  activeNodeId: string | null = null,
  loadingNodeId: string | null = null,
  viewMode: MindMapViewMode = "product"
): { nodes: MindMapFlowNode[]; edges: MindMapFlowEdge[] } {
  const byId = new Map(flatNodes.map((n) => [n.id, n]));
  const visibleNodes = flatNodes.filter((n) => isNodeVisible(n, expandedIds, byId));
  const visibleIds = new Set(visibleNodes.map((n) => n.id));

  const solidEdges: MindMapFlowEdge[] = flatNodes
    .filter((n) => n.parentId && visibleIds.has(n.id) && visibleIds.has(n.parentId))
    .map((n) => ({
      id: `e-${n.parentId}-${n.id}`,
      source: n.parentId!,
      target: n.id,
      type: "smoothstep",
      hidden: false,
      style: { stroke: "#a1a1aa", strokeWidth: 1.5 },
    }));

  let nodes: MindMapFlowNode[] = visibleNodes.map((n) => ({
    id: n.id,
    type: n.kind,
    position: { x: 0, y: 0 },
    hidden: false,
    data: buildNodeData(n, expandedIds, members, onToggle, activeNodeId, loadingNodeId),
  }));

  if (viewMode === "execution") {
    const { nodes: cycleNodes, traceEdges } = layoutCycleColumns(
      visibleNodes,
      expandedIds,
      members,
      onToggle,
      activeNodeId,
      loadingNodeId
    );
    const solidHidden = solidEdges.map((e) => ({ ...e, hidden: true }));
    return { nodes: cycleNodes, edges: [...solidHidden, ...traceEdges] };
  }

  nodes = layoutWithDagre(nodes, solidEdges);
  return { nodes, edges: solidEdges };
}
