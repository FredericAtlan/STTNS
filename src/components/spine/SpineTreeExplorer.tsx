"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Calendar, Loader2, Target } from "lucide-react";
import {
  fetchSpineNodeEditAction,
  refreshSpineTreeAction,
} from "@/app/projects/[slug]/spine/actions";
import {
  SpineInspector,
  type SpineInspectorFrame,
} from "@/components/spine/SpineInspector";
import { SpineTreeView } from "@/components/spine/SpineTreeView";
import { WhyEditSlideOver, type WhyEditTarget } from "@/components/why/WhyEditSlideOver";
import type { SpineEditContext } from "@/lib/sttns/spineEditContext";
import {
  getSpineRootNodes,
  SPINE_TREE_HIERARCHIES,
  SPINE_UNASSIGNED_CYCLE_ID,
  type SpineExplorerTab,
  type SpineTreeDataset,
  type SpineTreeNode,
} from "@/lib/sttns/spineTree";
import { cn } from "@/lib/utils";

const TABS: {
  id: SpineExplorerTab;
  label: string;
  subtitle: string;
  icon: typeof Target;
}[] = [
  { id: "strategy", label: "Stratégie", subtitle: "Personas", icon: Target },
  { id: "product", label: "Produit", subtitle: "Epics", icon: Briefcase },
  { id: "execution", label: "Exécution", subtitle: "Cycles", icon: Calendar },
];

interface Props {
  projectId: string;
  projectSlug: string;
  initialDataset: SpineTreeDataset;
  editContext: SpineEditContext;
  featureExecutionMode?: boolean;
  epicEqualsCycle?: boolean;
}

export function SpineTreeExplorer({
  projectId,
  projectSlug,
  initialDataset,
  editContext,
  featureExecutionMode = false,
  epicEqualsCycle = false,
}: Props) {
  const router = useRouter();
  const [dataset, setDataset] = useState(initialDataset);
  const [activeTab, setActiveTab] = useState<SpineExplorerTab>("strategy");
  const [whyTarget, setWhyTarget] = useState<WhyEditTarget | null>(null);
  const [inspector, setInspector] = useState<SpineInspectorFrame | null>(null);
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const rootNodes = useMemo(
    () => getSpineRootNodes(dataset, activeTab),
    [dataset, activeTab]
  );

  const hierarchy = SPINE_TREE_HIERARCHIES[activeTab];

  const closeAll = useCallback(() => {
    setWhyTarget(null);
    setInspector(null);
  }, []);

  const refreshTree = useCallback(async () => {
    const result = await refreshSpineTreeAction(projectId, projectSlug);
    if (result.ok) setDataset(result.dataset);
  }, [projectId, projectSlug]);

  const handleSaved = useCallback(async () => {
    closeAll();
    await refreshTree();
  }, [closeAll, refreshTree]);

  async function handleNodeClick(node: SpineTreeNode) {
    if (loadingNodeId) return;

    if (node.kind === "cycle") {
      if (node.id === SPINE_UNASSIGNED_CYCLE_ID) return;
      router.push(`/projects/${projectSlug}/user-stories?cycle_id=${node.id}`);
      return;
    }

    setLoadError(null);
    setLoadingNodeId(node.id);

    const result = await fetchSpineNodeEditAction(node.id);
    setLoadingNodeId(null);

    if (!result.ok) {
      setLoadError(result.error);
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
    }
  }

  const activeNodeId =
    whyTarget?.data?.id ??
    inspector?.data.id ??
    loadingNodeId;

  return (
    <>
      <nav
        className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-sm"
        aria-label="Perspectives de l'arbre Spine"
      >
        {TABS.map(({ id, label, subtitle, icon: Icon }) => {
          const active = activeTab === id;
          const count = dataset[id].length;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition text-left",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>
                {label}
                <span
                  className={cn(
                    "ml-1.5 text-xs font-normal",
                    active ? "text-primary-foreground/80" : "text-muted-foreground/70"
                  )}
                >
                  · {subtitle} ({count})
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {loadError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {loadingNodeId && (
        <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </div>
      )}

      <SpineTreeView
        projectSlug={projectSlug}
        rootNodes={rootNodes}
        hierarchy={hierarchy}
        onNodeClick={handleNodeClick}
        activeNodeId={activeNodeId}
        members={dataset.members}
      />

      <p className={cn("text-xs text-muted-foreground/80", loadingNodeId && "opacity-60")}>
        Cliquez sur un nœud pour l&apos;inspecter — Structure, Édition et drill enfants dans le
        même panneau.
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
        featureExecutionMode={featureExecutionMode}
        epicEqualsCycle={epicEqualsCycle}
        onClose={closeAll}
        onSaved={handleSaved}
      />
    </>
  );
}
