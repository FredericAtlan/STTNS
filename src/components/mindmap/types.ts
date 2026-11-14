import type { Node, Edge } from "@xyflow/react";

export type MindMapViewMode = "strategy" | "product" | "execution";

export type MindMapNodeKind =
  | "persona"
  | "pain_point"
  | "jtbd"
  | "epic"
  | "feature"
  | "story"
  | "task"
  | "cycle";

export type MindMapMember = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

export type MindMapNodeData = {
  title: string;
  effortPoints: number | null;
  assigneeId: string | null;
  docUrl: string | null;
  cycleName: string | null;
  severity: string | null;
  solvedPainPointCount: number | null;
  childCount: number;
  hasChildren: boolean;
  isExpanded: boolean;
  kind: MindMapNodeKind;
  members: MindMapMember[];
  isActive: boolean;
  isLoading: boolean;
  /** Nœud de traçabilité produit (vue Exécution) — pill compact sous la story */
  isTraceRef?: boolean;
  traceRole?: "feature" | "epic";
  /** Pill pleine largeur quand seule trace sous la story */
  traceWide?: boolean;
  onToggle: (nodeId: string) => void;
};

export type MindMapFlowNode = Node<MindMapNodeData, MindMapNodeKind>;
export type MindMapFlowEdge = Edge;

export type FlatMindMapNode = {
  id: string;
  kind: MindMapNodeKind;
  title: string;
  effortPoints: number | null;
  assigneeId: string | null;
  docUrl: string | null;
  cycleName: string | null;
  severity: string | null;
  solvedPainPointCount: number | null;
  childCount: number;
  parentId: string | null;
  childrenIds: string[];
  /** Traçabilité produit (stories en vue Cycles) */
  linkedFeatureId?: string | null;
  linkedEpicId?: string | null;
  linkedFeatureTitle?: string | null;
  linkedEpicTitle?: string | null;
};

export const MINDMAP_NODE_WIDTH = 220;
export const MINDMAP_NODE_HEIGHT = 96;
export const MINDMAP_CYCLE_COL_GAP = 72;
export const MINDMAP_CYCLE_ROW_GAP = 28;
export const MINDMAP_TASK_INDENT = 20;
/** Pills Feature/Epic empilés sous chaque story (vue Exécution) */
export const MINDMAP_TRACE_PILL_HEIGHT = 56;
export const MINDMAP_TRACE_PILL_WIDTH = 100;
export const MINDMAP_TRACE_STACK_GAP = 10;
export const MINDMAP_TRACE_PAIR_GAP = 8;

/** Identifiants des nœuds parents dépliables (ont au moins un enfant). */
export function collectExpandableNodeIds(flatNodes: FlatMindMapNode[]): Set<string> {
  return new Set(flatNodes.filter((n) => n.childCount > 0).map((n) => n.id));
}
