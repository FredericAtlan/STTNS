"use client";

import { useMemo, useState, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { fetchSpineNodeEditAction } from "@/app/projects/[slug]/spine/actions";
import {
  SpineInspector,
  type SpineInspectorFrame,
} from "@/components/spine/SpineInspector";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  EffortBadge,
  EpicImpactSumBadge,
  ImpactBadge,
  RatioBadge,
  RiskyCountBadge,
} from "@/components/ui/ValueEffortBadges";
import { SpineRichText } from "@/components/ui/SpineRichText";
import type { SpineEditContext } from "@/lib/sttns/spineEditContext";
import { type ImpactLevel, formatValueEffortRatio } from "@/lib/sttns/valueEffort";
import { cn } from "@/lib/utils";

type WorkItemType = "epic" | "feature" | "persona" | "job";

export interface PortfolioItem {
  id: string;
  type: WorkItemType;
  title: string;
  description?: string | null;
  impact: ImpactLevel | null;
  totalImpact?: number;
  effortDays: number;
  valueEffortRatio: number | null;
  riskyCount?: number;
  status: string;
  contextLinks?: Array<{ type: string; context_id: string; label?: string }>;
  parentId?: string | null;
  featureCount?: number;
  storyCount?: number;
}

interface Props {
  projectId: string;
  projectSlug: string;
  items: PortfolioItem[];
  editContext: Pick<SpineEditContext, "epics" | "jtbdOptions" | "features" | "cycles">;
  jtbdMap?: Record<string, { id: string; title: string; personaName: string }>;
  personaMap?: Record<string, { id: string; title: string }>;
  featureExecutionMode?: boolean;
  epicEqualsCycle?: boolean;
}

type SortField = "valeur" | "effort" | "ratio" | "title" | "status";
type SortDirection = "asc" | "desc";

function itemValeur(item: PortfolioItem): number {
  if (item.type === "epic") return item.totalImpact ?? 0;
  return item.impact ?? -1;
}

function mapPortfolioStatus(s: string): string {
  const lower = s.toLowerCase();
  if (lower === "in_progress" || lower === "doing" || lower === "active") return "in_progress";
  if (
    lower === "done" ||
    lower === "ready" ||
    lower === "shipped" ||
    lower === "validated" ||
    lower === "delivered"
  )
    return "done";
  if (lower === "review" || lower === "in_review") return "review";
  return "todo";
}

function sortItems(
  list: PortfolioItem[],
  sortField: SortField,
  sortDirection: SortDirection
): PortfolioItem[] {
  const sorted = [...list];
  sorted.sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "valeur":
        comparison = itemValeur(a) - itemValeur(b);
        break;
      case "effort":
        comparison = a.effortDays - b.effortDays;
        break;
      case "ratio":
        comparison = (a.valueEffortRatio ?? -1) - (b.valueEffortRatio ?? -1);
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });
  return sorted;
}

export function StrategyPortfolio({
  projectId,
  projectSlug,
  items,
  editContext,
  jtbdMap = {},
  featureExecutionMode = false,
  epicEqualsCycle = false,
}: Props) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("ratio");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const withChildren = items
      .filter((i) => i.type === "epic")
      .filter((epic) => items.some((f) => f.type === "feature" && f.parentId === epic.id))
      .map((e) => e.id);
    return new Set(withChildren);
  });
  const [inspector, setInspector] = useState<SpineInspectorFrame | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const epics = useMemo(
    () => sortItems(items.filter((i) => i.type === "epic"), sortField, sortDirection),
    [items, sortField, sortDirection]
  );

  const featuresByEpic = useMemo(() => {
    const map = new Map<string, PortfolioItem[]>();
    const orphans: PortfolioItem[] = [];
    for (const item of items) {
      if (item.type !== "feature") continue;
      if (!item.parentId) {
        orphans.push(item);
        continue;
      }
      const list = map.get(item.parentId) ?? [];
      list.push(item);
      map.set(item.parentId, list);
    }
    for (const [key, list] of Array.from(map.entries())) {
      map.set(key, sortItems(list, sortField, sortDirection));
    }
    return { map, orphans: sortItems(orphans, sortField, sortDirection) };
  }, [items, sortField, sortDirection]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function toggleEpic(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function openInspector(id: string) {
    if (loadingId) return;
    setLoadError(null);
    setLoadingId(id);
    const result = await fetchSpineNodeEditAction(id);
    setLoadingId(null);
    if (!result.ok) {
      setLoadError(result.error);
      return;
    }
    if (result.payload.kind === "epic") {
      setInspector({ kind: "epic", data: result.payload.data });
    } else if (result.payload.kind === "feature") {
      setInspector({ kind: "feature", data: result.payload.data });
    } else if (result.payload.kind === "story") {
      setInspector({ kind: "story", data: result.payload.data });
    }
  }

  function SortHeader({ field, children }: { field: SortField; children: React.ReactNode }) {
    const isActive = sortField === field;
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className={cn(
          "flex items-center gap-1 text-left text-[11px] font-semibold uppercase tracking-wide",
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {children}
        {isActive &&
          (sortDirection === "desc" ? (
            <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUp className="h-3 w-3" />
          ))}
        {!isActive && <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />}
      </button>
    );
  }

  function ValeurCell({ item }: { item: PortfolioItem }) {
    if (item.type === "feature") {
      return <ImpactBadge impact={item.impact} showLabel />;
    }
    return <EpicImpactSumBadge total={item.totalImpact} />;
  }

  function renderFeatureRow(item: PortfolioItem, indented: boolean) {
    const linkedJtbd = item.contextLinks?.find((link) => link.type === "job");
    const jtbdInfo = linkedJtbd ? jtbdMap[linkedJtbd.context_id] : null;

    return (
      <tr
        key={item.id}
        className={cn(
          "bg-background transition-colors hover:bg-muted/50",
          indented && "bg-muted/20"
        )}
      >
        <td className="px-3 py-2">
          <div className={cn("flex items-center gap-2", indented && "pl-7")}>
            <SpineObjectIcon type="feature" className="h-4 w-4" />
            <span className="text-[11px] font-medium text-muted-foreground">Feature</span>
          </div>
        </td>
        <td className="px-3 py-2">
          <button
            type="button"
            onClick={() => void openInspector(item.id)}
            className="text-left text-sm font-medium text-foreground hover:text-primary hover:underline"
          >
            {item.title}
          </button>
          {item.description && (
            <SpineRichText
              content={item.description}
              className="mt-0.5 line-clamp-1 [&_p]:m-0 [&_p]:text-xs [&_p]:text-muted-foreground"
            />
          )}
        </td>
        <td className="px-3 py-2">
          <ValeurCell item={item} />
        </td>
        <td className="px-3 py-2">
          <div className="flex flex-col items-start gap-1">
            <EffortBadge days={item.effortDays} />
            <RiskyCountBadge count={item.riskyCount ?? 0} />
          </div>
        </td>
        <td className="px-3 py-2">
          <RatioBadge ratio={item.valueEffortRatio} />
        </td>
        <td className="px-3 py-2">
          {jtbdInfo ? (
            <Link
              href={`/projects/${projectSlug}/why?tab=matrix`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[140px]">
                {jtbdInfo.personaName}: {jtbdInfo.title}
              </span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-destructive/20 bg-destructive/10 px-1.5 py-0.5 text-[11px] font-medium text-destructive">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Pas de JTBD
            </span>
          )}
        </td>
        <td className="px-3 py-2">
          <StatusBadge status={mapPortfolioStatus(item.status)} />
        </td>
      </tr>
    );
  }

  const totalItems = items.filter((i) => i.type === "epic" || i.type === "feature").length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{epics.length}</span> epics
          {" · "}
          <span className="font-medium tabular-nums text-foreground">{totalItems}</span> items
        </p>
      </div>

      {loadError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {totalItems === 0 ? (
        <div className="sttns-card border-dashed text-center">
          <AlertCircle className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucun Epic ou Feature.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Créez un Epic, puis ajoutez des Features pour voir le ratio V/E.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              href={`/projects/${projectSlug}/epics/new`}
              className="sttns-btn-secondary sttns-btn-sm"
            >
              + Epic
            </Link>
            <Link
              href={`/projects/${projectSlug}/features/new`}
              className="sttns-btn-primary sttns-btn-sm"
            >
              + Feature
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="sttns-scroll-x">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Type
                  </th>
                  <th className="px-3 py-2.5">
                    <SortHeader field="title">Nom</SortHeader>
                  </th>
                  <th className="px-3 py-2.5">
                    <SortHeader field="valeur">Valeur</SortHeader>
                  </th>
                  <th className="px-3 py-2.5">
                    <SortHeader field="effort">Effort</SortHeader>
                  </th>
                  <th className="px-3 py-2.5">
                    <SortHeader field="ratio">Ratio V/E</SortHeader>
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Contexte
                  </th>
                  <th className="px-3 py-2.5">
                    <SortHeader field="status">Statut</SortHeader>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {epics.map((epic) => {
                  const children = featuresByEpic.map.get(epic.id) ?? [];
                  const isOpen = expanded.has(epic.id);
                  const featCount = epic.featureCount ?? children.length;
                  const storyCount = epic.storyCount ?? 0;

                  return (
                    <Fragment key={epic.id}>
                      <tr className="bg-muted/30 hover:bg-muted/50">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleEpic(epic.id)}
                              className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm"
                              aria-label={isOpen ? "Replier" : "Déplier"}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <SpineObjectIcon type="epic" className="h-4 w-4" />
                            <span className="text-[11px] font-semibold text-violet-700">
                              Epic
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => void openInspector(epic.id)}
                            className="inline-flex items-center gap-2 text-left text-sm font-semibold text-foreground hover:text-primary hover:underline"
                          >
                            {epic.title}
                            {loadingId === epic.id && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            )}
                          </button>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {featCount} feature{featCount !== 1 ? "s" : ""} · {storyCount}{" "}
                            stor{storyCount !== 1 ? "ies" : "y"} · ratio{" "}
                            {formatValueEffortRatio(epic.valueEffortRatio)}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => void openInspector(epic.id)}
                            className="inline-flex"
                            title="Ouvrir Structure"
                          >
                            <ValeurCell item={epic} />
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <EffortBadge days={epic.effortDays} />
                        </td>
                        <td className="px-3 py-2.5">
                          <RatioBadge ratio={epic.valueEffortRatio} />
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                          Conteneur macro
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={mapPortfolioStatus(epic.status)} />
                        </td>
                      </tr>
                      {isOpen &&
                        (children.length === 0 ? (
                          <tr key={`${epic.id}-empty`}>
                            <td
                              colSpan={7}
                              className="border-l-2 border-l-warning/40 bg-warning/10 px-3 py-2.5 pl-14 text-xs text-warning"
                            >
                              Aucune Feature —{" "}
                              <Link
                                href={`/projects/${projectSlug}/features/new?epic_id=${epic.id}`}
                                className="font-semibold underline underline-offset-2"
                              >
                                créer une Feature
                              </Link>
                            </td>
                          </tr>
                        ) : (
                          children.map((f) => renderFeatureRow(f, true))
                        ))}
                    </Fragment>
                  );
                })}

                {featuresByEpic.orphans.length > 0 && (
                  <>
                    <tr>
                      <td
                        colSpan={7}
                        className="border-l-2 border-l-warning/40 bg-warning/10 px-3 py-2 text-[11px] font-semibold text-warning"
                      >
                        Features orphelines (sans Epic)
                      </td>
                    </tr>
                    {featuresByEpic.orphans.map((f) => renderFeatureRow(f, false))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">Clic titre</span> → Inspecteur ·{" "}
        <span className="font-medium text-foreground">Chevron</span> → Features
      </p>

      <SpineInspector
        open={!!inspector}
        initial={inspector}
        projectId={projectId}
        projectSlug={projectSlug}
        editContext={editContext}
        featureExecutionMode={featureExecutionMode}
        epicEqualsCycle={epicEqualsCycle}
        onClose={() => setInspector(null)}
        onSaved={() => {
          setInspector(null);
          router.refresh();
        }}
      />
    </div>
  );
}
