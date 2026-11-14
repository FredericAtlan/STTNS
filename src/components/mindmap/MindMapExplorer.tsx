"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  fetchSpineNodeEditAction,
  refreshSpineTreeAction,
} from "@/app/projects/[slug]/spine/actions";
import {
  SpineInspector,
  type SpineInspectorFrame,
} from "@/components/spine/SpineInspector";
import { WhyEditSlideOver, type WhyEditTarget } from "@/components/why/WhyEditSlideOver";
import { SttnsMindMap } from "@/components/mindmap/SttnsMindMap";
import {
  flattenExecutionTree,
  flattenProductTree,
  flattenStrategyTree,
} from "@/components/mindmap/mindmapGraph";
import type { MindMapNodeKind, MindMapViewMode, FlatMindMapNode } from "@/components/mindmap/types";
import type { SpineEditContext } from "@/lib/sttns/spineEditContext";
import {
  getSpineRootNodes,
  SPINE_UNASSIGNED_CYCLE_ID,
  type SpineTreeMember,
  type SpineTreeNode,
} from "@/lib/sttns/spineTree";

function resolveNodeClickTarget(
  nodeId: string,
  kind: MindMapNodeKind,
  flatNodes: FlatMindMapNode[]
): { id: string; kind: MindMapNodeKind } {
  const storyTrace = nodeId.match(/^trace-(.+)-(feature|epic)$/);
  if (storyTrace) {
    const story = flatNodes.find((n) => n.id === storyTrace[1]);
    if (storyTrace[2] === "feature" && story?.linkedFeatureId) {
      return { id: story.linkedFeatureId, kind: "feature" };
    }
    if (storyTrace[2] === "epic" && story?.linkedEpicId) {
      return { id: story.linkedEpicId, kind: "epic" };
    }
  }
  const jtbdDup = nodeId.match(/^(.+)__pp__.+$/);
  if (jtbdDup && kind === "jtbd") {
    return { id: jtbdDup[1], kind };
  }
  return { id: nodeId, kind };
}

interface Props {
  projectId: string;
  projectSlug: string;
  executionUnit: "story" | "feature";
  epicEqualsCycle: boolean;
  initialStrategyRoots: SpineTreeNode[];
  initialProductRoots: SpineTreeNode[];
  initialExecutionRoots: SpineTreeNode[];
  members: SpineTreeMember[];
  editContext: SpineEditContext;
}

export function MindMapExplorer({
  projectId,
  projectSlug,
  executionUnit,
  epicEqualsCycle,
  initialStrategyRoots,
  initialProductRoots,
  initialExecutionRoots,
  members,
  editContext,
}: Props) {
  const router = useRouter();
  const [strategyRoots, setStrategyRoots] = useState(initialStrategyRoots);
  const [productRoots, setProductRoots] = useState(initialProductRoots);
  const [executionRoots, setExecutionRoots] = useState(initialExecutionRoots);
  const [viewMode, setViewMode] = useState<MindMapViewMode>("strategy");
  const [whyTarget, setWhyTarget] = useState<WhyEditTarget | null>(null);
  const [inspector, setInspector] = useState<SpineInspectorFrame | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const flatNodes = useMemo(() => {
    if (viewMode === "strategy") return flattenStrategyTree(strategyRoots);
    if (viewMode === "product") return flattenProductTree(productRoots);
    return flattenExecutionTree(executionRoots);
  }, [viewMode, strategyRoots, productRoots, executionRoots]);

  const closeAll = useCallback(() => {
    setWhyTarget(null);
    setInspector(null);
    setActiveNodeId(null);
  }, []);

  const refreshMindMap = useCallback(async () => {
    const result = await refreshSpineTreeAction(projectId, projectSlug);
    if (result.ok) {
      setStrategyRoots(getSpineRootNodes(result.dataset, "strategy"));
      setProductRoots(getSpineRootNodes(result.dataset, "product"));
      setExecutionRoots(getSpineRootNodes(result.dataset, "execution"));
    }
  }, [projectId, projectSlug]);

  const handleSaved = useCallback(async () => {
    closeAll();
    await refreshMindMap();
  }, [closeAll, refreshMindMap]);

  const handleNodeClick = useCallback(
    async (nodeId: string, kind: MindMapNodeKind) => {
      if (loadingNodeId) return;

      const resolved = resolveNodeClickTarget(nodeId, kind, flatNodes);

      if (resolved.kind === "cycle") {
        if (resolved.id === SPINE_UNASSIGNED_CYCLE_ID) return;
        const href =
          executionUnit === "feature"
            ? `/projects/${projectSlug}/kanban?cycle_id=${resolved.id}`
            : `/projects/${projectSlug}/user-stories?cycle_id=${resolved.id}`;
        router.push(href);
        return;
      }

      let targetId = resolved.id;
      if (resolved.kind === "task") {
        const parentStoryId = flatNodes.find((n) => n.id === resolved.id)?.parentId;
        if (!parentStoryId) return;
        targetId = parentStoryId;
      }

      setLoadError(null);
      setLoadingNodeId(nodeId);
      setActiveNodeId(nodeId);

      const result = await fetchSpineNodeEditAction(targetId);
      setLoadingNodeId(null);

      if (!result.ok) {
        setLoadError(result.error);
        setActiveNodeId(null);
        return;
      }

      closeAll();

      switch (result.payload.kind) {
        case "why":
          setWhyTarget(result.payload.target);
          break;
        case "epic":
          setInspector({ kind: "epic", data: result.payload.data });
          break;
        case "feature":
          setInspector({ kind: "feature", data: result.payload.data });
          break;
        case "story":
          setInspector({ kind: "story", data: result.payload.data });
          break;
        default:
          setActiveNodeId(null);
          break;
      }
    },
    [flatNodes, loadingNodeId, projectSlug, router, closeAll, executionUnit]
  );

  return (
    <>
      {loadError && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {loadingNodeId && (
        <div className="flex items-center gap-2 px-1 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ouverture…
        </div>
      )}

      <SttnsMindMap
        strategyRoots={strategyRoots}
        productRoots={productRoots}
        executionRoots={executionRoots}
        members={members}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeNodeId={
          activeNodeId ??
          (whyTarget?.kind === "persona"
            ? whyTarget.data?.id
            : whyTarget?.kind === "pp"
              ? whyTarget.data?.id
              : whyTarget?.kind === "jtbd"
                ? whyTarget.data?.id
                : null) ??
          inspector?.data.id ??
          loadingNodeId
        }
        loadingNodeId={loadingNodeId}
        onNodeClick={handleNodeClick}
      />

      <p className="text-xs text-zinc-400">
        Stratégie : Persona → Pain Point → JTBD. Produit : Epic → Feature → Story. Exécution :
        colonnes par cycle · sous chaque story, pills Feature (vert) et Epic (violet) reliées par
        traits pointillés. Clic → Inspecteur Spine (Structure + Édition).
      </p>

      <WhyEditSlideOver
        open={!!whyTarget}
        target={whyTarget}
        projectId={projectId}
        projectSlug={projectSlug}
        personas={editContext.personas}
        painPoints={editContext.painPoints}
        onClose={closeAll}
        onSaved={handleSaved}
      />

      <SpineInspector
        open={!!inspector}
        initial={inspector}
        projectId={projectId}
        projectSlug={projectSlug}
        editContext={editContext}
        featureExecutionMode={executionUnit === "feature"}
        epicEqualsCycle={epicEqualsCycle}
        onClose={closeAll}
        onSaved={handleSaved}
      />
    </>
  );
}
