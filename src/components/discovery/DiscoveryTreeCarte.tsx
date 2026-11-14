"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import type { DiscoveryDraft } from "@/lib/sttns/discoveryMatrix";
import {
  buildDiscoveryFlatNodes,
  formatDiscoverySpineBadge,
  isDiscoveryOrphanRoot,
  type DiscoveryFlatNode,
  type DiscoverySpineEpicRef,
  type DiscoverySpineFeatureRef,
  type DiscoverySpineStoryRef,
} from "@/lib/sttns/discoveryMindMap";
import { cn } from "@/lib/utils";

type Props = {
  drafts: DiscoveryDraft[];
  spineEpics: DiscoverySpineEpicRef[];
  spineFeatures: DiscoverySpineFeatureRef[];
  spineStories?: DiscoverySpineStoryRef[];
  activeDraftId?: string | null;
  onSelectDraft?: (draftId: string | null) => void;
  className?: string;
};

function NodeRow({
  node,
  depth,
  byId,
  expandedIds,
  activeDraftId,
  onToggle,
  onSelect,
}: {
  node: DiscoveryFlatNode;
  depth: number;
  byId: Map<string, DiscoveryFlatNode>;
  expandedIds: Set<string>;
  activeDraftId: string | null;
  onToggle: (id: string) => void;
  onSelect: (draftId: string | null) => void;
}) {
  const hasChildren = node.childrenIds.length > 0;
  const open = expandedIds.has(node.id);
  const isActive =
    activeDraftId != null &&
    (activeDraftId === node.draftId || activeDraftId === node.id);
  const badge =
    node.origin === "draft"
      ? "Brouillon"
      : node.spineId
        ? `Spine ${formatDiscoverySpineBadge(node.kind, node.spineId)}`
        : node.origin === "spine"
          ? "Spine"
          : null;

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
          "hover:bg-muted/70",
          isActive && "bg-primary/10 ring-1 ring-inset ring-primary/25",
          node.collision && "bg-warning/10 ring-1 ring-inset ring-warning/40",
          node.origin === "draft" && "border-l-2 border-dashed border-amber-400/80",
          (node.origin === "spine" || node.origin === "poured") &&
            "border-l-2 border-solid border-violet-300"
        )}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm"
            onClick={() => onToggle(node.id)}
            aria-expanded={open}
            aria-label={open ? "Replier" : "Déplier"}
          >
            {open ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </button>
        ) : (
          <span className="inline-block w-8 shrink-0" aria-hidden />
        )}

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => onSelect(node.draftId)}
          disabled={!node.draftId && isDiscoveryOrphanRoot(node.id)}
        >
          <SpineObjectIcon type={node.kind} size="sm" />
          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
            {node.title}
          </span>
          {badge ? (
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                node.origin === "draft"
                  ? "bg-amber-100 text-amber-900"
                  : "bg-violet-100 text-violet-800"
              )}
            >
              {badge}
            </span>
          ) : null}
          {node.attachedSummary ? (
            <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
              {node.attachedSummary}
            </span>
          ) : null}
        </button>
      </div>

      {hasChildren && open ? (
        <ul className="space-y-0.5">
          {node.childrenIds.map((childId) => {
            const child = byId.get(childId);
            if (!child) return null;
            return (
              <NodeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                byId={byId}
                expandedIds={expandedIds}
                activeDraftId={activeDraftId}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Vue Carte — arbre hiérarchique Epic → Feature → Story
 * (lisibilité structurelle, sans canvas React Flow).
 */
export function DiscoveryTreeCarte({
  drafts,
  spineEpics,
  spineFeatures,
  spineStories = [],
  activeDraftId = null,
  onSelectDraft,
  className,
}: Props) {
  const flatNodes = useMemo(
    () =>
      buildDiscoveryFlatNodes(drafts, spineEpics, spineFeatures, { spineStories }),
    [drafts, spineEpics, spineFeatures, spineStories]
  );

  const byId = useMemo(
    () => new Map(flatNodes.map((n) => [n.id, n])),
    [flatNodes]
  );

  const roots = useMemo(
    () => flatNodes.filter((n) => !n.parentId),
    [flatNodes]
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    new Set(flatNodes.filter((n) => n.childrenIds.length > 0).map((n) => n.id))
  );

  const structureKey = flatNodes.map((n) => `${n.id}:${n.parentId ?? ""}`).join("|");
  useEffect(() => {
    setExpandedIds(
      new Set(flatNodes.filter((n) => n.childrenIds.length > 0).map((n) => n.id))
    );
    // structureKey suffit — flatNodes recalculé au même moment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureKey]);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (roots.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 text-sm text-muted-foreground",
          className
        )}
      >
        Aucun brouillon à afficher. Ajoutez une ligne en vue Tableau.
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Arbre Epic → Feature → Story ·{" "}
          <span className="text-amber-800">pointillé = brouillon</span>
          {" · "}
          <span className="text-violet-700">plein = Spine</span>
        </p>
      </div>
      <ul className="max-h-[min(70vh,640px)] space-y-0.5 overflow-y-auto p-3">
        {roots.map((root) => (
          <NodeRow
            key={root.id}
            node={root}
            depth={0}
            byId={byId}
            expandedIds={expandedIds}
            activeDraftId={activeDraftId}
            onToggle={toggle}
            onSelect={(id) => onSelectDraft?.(id)}
          />
        ))}
      </ul>
    </div>
  );
}
