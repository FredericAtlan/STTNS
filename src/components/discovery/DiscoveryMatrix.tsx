"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  Undo2,
} from "lucide-react";
import { saveEpicAction } from "@/app/projects/[slug]/epics/actions";
import { saveInitiativeAction } from "@/app/projects/[slug]/features/actions";
import { saveUserStoryAction } from "@/app/projects/[slug]/user-stories/actions";
import { archiveWorkItemAction } from "@/app/projects/[slug]/work-items/actions";
import {
  assertDiscoveryReverseAllowedAction,
  type DiscoveryReverseAssertResult,
} from "@/app/projects/[slug]/discovery/actions";
import { DiscoveryDraftManager } from "@/components/discovery/DiscoveryDraftManager";
import { DiscoveryMindMap } from "@/components/discovery/DiscoveryMindMap";
import { DiscoveryTreeCarte } from "@/components/discovery/DiscoveryTreeCarte";
import {
  DiscoveryViewToggle,
  parseDiscoveryViewMode,
  type DiscoveryViewMode,
} from "@/components/discovery/DiscoveryViewToggle";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import {
  EffortDaysPicker,
  ImpactPicker,
  RiskPicker,
} from "@/components/ui/ValueEffortPickers";
import { buildDiscoveryLinkExample } from "@/lib/sttns/discoveryLinkExample";
import {
  applyReverseLocal,
  bulkFinalizeOrder,
  canFinalizeChain,
  canFinalizeDraft,
  clearFeatureShapeUpIfHasStories,
  computeEpicSessionRollup,
  computeFeatureSessionRollup,
  createDraftId,
  discoveryStorageKey,
  emptyDraftMetadata,
  featureFinalizeEffortFields,
  featureHasSessionStories,
  formatSessionParentLabel,
  groupFeaturesByEpic,
  isSessionDraftId,
  parseSessionPayload,
  reverseOrder,
  serializeSessionPayload,
  type DiscoveryDraft,
  type DiscoveryDraftMetadata,
  type DiscoveryItemType,
  type DiscoveryReverseSpineItem,
  type FeatureParentOption,
} from "@/lib/sttns/discoveryMatrix";
import {
  draftTitleCollidesWithSpine,
  type DiscoverySpineStoryRef,
} from "@/lib/sttns/discoveryMindMap";
import {
  EffortBadge,
  EpicImpactSumBadge,
  RatioBadge,
  RiskBadge,
  RiskyCountBadge,
} from "@/components/ui/ValueEffortBadges";
import { SttnsModal } from "@/components/ui/SttnsModal";
import Link from "next/link";
import { cn } from "@/lib/utils";

const VIEW_MODE_KEY = "sttns.discovery.view";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON") {
    return true;
  }
  if (target.isContentEditable) return true;
  return Boolean(target.closest("input, select, textarea, button, [contenteditable='true']"));
}

/** Cellule roll-up Effort — affichage dérivé « Auto » (disabled, hors payload). */
function RollupEffortCell({
  days,
  label,
}: {
  days: number;
  label: string;
}) {
  return (
    <div
      className="sttns-input flex cursor-not-allowed flex-col items-center justify-center gap-0.5 bg-muted py-1 text-muted-foreground opacity-90"
      aria-label={label}
      title="Auto — ∑ Stories session. Non envoyé au save (roll-up serveur)."
    >
      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/80">
        Auto
      </span>
      <span className="tabular-nums text-xs font-semibold text-foreground">∑ {days}j</span>
    </div>
  );
}

function RollupRiskCell({
  maxRisk,
  riskyCount,
}: {
  maxRisk: 1 | 2 | 3 | null;
  riskyCount: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1"
      title="Auto — dérivé des Stories session. Non envoyé au save."
    >
      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/80">
        Auto
      </span>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {maxRisk != null ? (
          <RiskBadge risk={maxRisk} showIcon={maxRisk === 3} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
        <RiskyCountBadge count={riskyCount} />
      </div>
    </div>
  );
}

type DiscoveryParentOption = {
  id: string;
  label: string;
  spineType: "epic" | "feature";
};

type DiscoveryParentGroup = {
  label: string;
  options: DiscoveryParentOption[];
};

/**
 * Sélecteur parent Discovery — dropdown custom pour afficher SpineObjectIcon
 * (les <option> natifs ne rendent pas d'icônes React).
 */
function DiscoveryParentPicker({
  value,
  onChange,
  disabled,
  orphan,
  options,
  groups,
  emptyLabel = "— Orphelin —",
  ariaLabel = "Parent",
}: {
  value: string | null;
  onChange: (parentId: string | null) => void;
  disabled?: boolean;
  orphan?: boolean;
  options?: DiscoveryParentOption[];
  groups?: DiscoveryParentGroup[];
  emptyLabel?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const flat = useMemo(
    () => (groups ? groups.flatMap((g) => g.options) : options ?? []),
    [groups, options]
  );
  const selected = value ? flat.find((o) => o.id === value) ?? null : null;

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;

    function place() {
      const trigger = rootRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gap = 4;
      const maxH = Math.min(420, Math.max(200, window.innerHeight - 24));
      const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
      const spaceAbove = rect.top - gap - 8;
      const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
      const height = Math.min(maxH, Math.max(160, openUp ? spaceAbove : spaceBelow));
      const width = Math.min(Math.max(rect.width, 220), Math.min(360, window.innerWidth - 16));
      let left = rect.left;
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8);
      }
      setMenuStyle(
        openUp
          ? {
              position: "fixed",
              left,
              width,
              bottom: window.innerHeight - rect.top + gap,
              maxHeight: height,
              zIndex: 80,
            }
          : {
              position: "fixed",
              left,
              width,
              top: rect.bottom + gap,
              maxHeight: height,
              zIndex: 80,
            }
      );
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, flat.length]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  function select(next: string | null) {
    onChange(next);
    setOpen(false);
  }

  const triggerLabel = selected?.label ?? emptyLabel;

  const listbox =
    open && !disabled && typeof document !== "undefined" ? (
      <div
        ref={listRef}
        role="listbox"
        aria-label={ariaLabel}
        style={menuStyle}
        className="overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-elevated"
      >
        <button
          type="button"
          role="option"
          aria-selected={!selected}
          onClick={() => select(null)}
          className={cn(
            "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted",
            !selected && "bg-muted/80 font-medium text-foreground"
          )}
        >
          <span className="w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{emptyLabel}</span>
        </button>

        {groups
          ? groups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label}>
                <p
                  data-parent-group={group.label}
                  className="flex items-center gap-1.5 px-2.5 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  <SpineObjectIcon type="epic" size="sm" />
                  <span className="truncate">{group.label}</span>
                </p>
                {group.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={opt.id === value}
                    onClick={() => select(opt.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-muted",
                      opt.id === value && "bg-primary/5 font-medium"
                    )}
                  >
                    <SpineObjectIcon type={opt.spineType} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                    {opt.id === value ? (
                      <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    ) : null}
                  </button>
                ))}
              </div>
            ))
          : (options ?? []).map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={opt.id === value}
                onClick={() => select(opt.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-muted",
                  opt.id === value && "bg-primary/5 font-medium"
                )}
              >
                <SpineObjectIcon type={opt.spineType} size="sm" />
                <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                {opt.id === value ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                ) : null}
              </button>
            ))}
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={triggerLabel}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "sttns-input flex w-full items-center gap-1.5 text-left",
          orphan && "border-destructive/20 bg-destructive/10 text-destructive",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        {selected ? (
          <SpineObjectIcon type={selected.spineType} size="sm" />
        ) : null}
        <span className="min-w-0 flex-1 truncate text-xs">{triggerLabel}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {listbox ? createPortal(listbox, document.body) : null}
    </div>
  );
}

export type DiscoverySpineEpic = { id: string; title: string };
export type DiscoverySpineFeature = { id: string; title: string; epic_id: string | null };
export type DiscoverySpineStory = DiscoverySpineStoryRef;
export type DiscoveryJtbdOption = { id: string; title: string; personaName: string };

interface Props {
  projectId: string;
  projectSlug: string;
  spineEpics: DiscoverySpineEpic[];
  spineFeatures: DiscoverySpineFeature[];
  spineStories?: DiscoverySpineStory[];
  jtbdOptions: DiscoveryJtbdOption[];
  /** Préremplissage auteur (Draft Manager) — côté serveur uniquement. */
  defaultAuthor?: string;
}

function emptyDraft(type: DiscoveryItemType = "feature"): DiscoveryDraft {
  return {
    id: createDraftId(),
    type,
    title: "",
    parentId: null,
    jtbdId: null,
    impact: type === "feature" ? 1 : null,
    effort_days: type === "story" ? 1 : type === "feature" ? 1 : null,
    complexity: type === "story" ? 1 : type === "feature" ? 1 : null,
    description: "",
    doc_url: "",
    spineId: null,
  };
}

export function DiscoveryMatrix({
  projectId,
  projectSlug,
  spineEpics,
  spineFeatures,
  spineStories = [],
  jtbdOptions,
  defaultAuthor = "",
}: Props) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DiscoveryDraft[]>([]);
  const [draftMeta, setDraftMeta] = useState<DiscoveryDraftMetadata>(() =>
    emptyDraftMetadata(defaultAuthor)
  );
  const [hydrated, setHydrated] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkReverseBusy, setBulkReverseBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCommitted, setLastCommitted] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [viewMode, setViewMode] = useState<DiscoveryViewMode>("table");
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [reverseConfirm, setReverseConfirm] = useState<{
    items: DiscoveryReverseSpineItem[];
  } | null>(null);
  const [reverseChecking, setReverseChecking] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const focusedRowIndexRef = useRef(0);

  const storageKey = discoveryStorageKey(projectId);
  const busy = bulkBusy || bulkReverseBusy || reverseChecking;

  const selectedFinalizeCount = useMemo(
    () => bulkFinalizeOrder(drafts, selectedIds).length,
    [drafts, selectedIds]
  );

  const selectableDraftIds = useMemo(
    () =>
      drafts
        .filter((d) => !d.spineId && canFinalizeChain(d, drafts))
        .map((d) => d.id),
    [drafts]
  );

  const allSelectableSelected =
    selectableDraftIds.length > 0 &&
    selectableDraftIds.every((id) => selectedIds.has(id));
  const someSelectableSelected =
    selectableDraftIds.some((id) => selectedIds.has(id)) && !allSelectableSelected;

  const pouredCount = useMemo(
    () => drafts.filter((d) => d.spineId).length,
    [drafts]
  );

  /** Retire de la sélection les lignes absentes, déjà versées, ou plus finalisables. */
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Set<string>();
      for (const id of Array.from(prev)) {
        const d = drafts.find((x) => x.id === id);
        if (!d || d.spineId) {
          changed = true;
          continue;
        }
        if (!canFinalizeChain(d, drafts)) {
          changed = true;
          continue;
        }
        next.add(id);
      }
      return changed ? next : prev;
    });
  }, [drafts]);

  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? sessionStorage.getItem(storageKey) : null;
    const { drafts: loaded, metadata } = parseSessionPayload(raw, defaultAuthor);
    setDrafts(clearFeatureShapeUpIfHasStories(loaded));
    setDraftMeta(
      metadata.author.trim() ? metadata : { ...metadata, author: defaultAuthor }
    );
    try {
      const savedView = localStorage.getItem(`${VIEW_MODE_KEY}:${projectId}`);
      setViewMode(parseDiscoveryViewMode(savedView));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [storageKey, defaultAuthor, projectId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(`${VIEW_MODE_KEY}:${projectId}`, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode, hydrated, projectId]);

  useEffect(() => {
    if (!activeDraftId || viewMode !== "table") return;
    const tr = tableRef.current?.querySelector<HTMLElement>(
      `tr[data-draft-id="${activeDraftId}"]`
    );
    if (tr && typeof tr.scrollIntoView === "function") {
      tr.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeDraftId, viewMode]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const emptySession =
        drafts.length === 0 &&
        !draftMeta.title.trim() &&
        !draftMeta.comments.trim() &&
        (!draftMeta.author.trim() || draftMeta.author === defaultAuthor) &&
        !draftMeta.createdAt &&
        !draftMeta.exportedAt;
      if (emptySession) {
        sessionStorage.removeItem(storageKey);
      } else {
        sessionStorage.setItem(
          storageKey,
          serializeSessionPayload(drafts, draftMeta)
        );
      }
    } catch {
      /* quota / private mode — ignore */
    }
  }, [drafts, draftMeta, hydrated, storageKey, defaultAuthor]);

  const updateDraft = useCallback((id: string, patch: Partial<DiscoveryDraft>) => {
    setDrafts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...patch } : d));
      return clearFeatureShapeUpIfHasStories(next);
    });
  }, []);

  const removeDraft = useCallback((id: string) => {
    setDrafts((prev) =>
      clearFeatureShapeUpIfHasStories(
        prev
          .filter((d) => d.id !== id)
          .map((d) => (d.parentId === id ? { ...d, parentId: null } : d))
      )
    );
    setExpandedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearSession = useCallback(() => {
    setDrafts([]);
    setDraftMeta(emptyDraftMetadata(defaultAuthor));
    setExpandedIds(new Set());
    setSelectedIds(new Set());
    setError(null);
    setLastCommitted(null);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }, [storageKey, defaultAuthor]);

  const replaceSessionFromFile = useCallback(
    (nextDrafts: DiscoveryDraft[], nextMeta: DiscoveryDraftMetadata) => {
      setDrafts(clearFeatureShapeUpIfHasStories(nextDrafts));
      setDraftMeta(nextMeta);
      setExpandedIds(new Set());
      setSelectedIds(new Set());
      setError(null);
    },
    []
  );

  const toggleSelected = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        if (!checked) {
          if (prev.size === 0) return prev;
          return new Set();
        }
        return new Set(selectableDraftIds);
      });
    },
    [selectableDraftIds]
  );

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelectableSelected;
    }
  }, [someSelectableSelected]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const epicTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of spineEpics) map.set(e.id, e.title);
    for (const d of drafts) {
      if (d.type === "epic") {
        map.set(d.id, d.title.trim() || "(Epic sans titre)");
      }
    }
    return map;
  }, [drafts, spineEpics]);

  const spineCollisionCatalog = useMemo(
    () => [
      ...spineEpics.map((e) => ({ id: e.id, title: e.title, kind: "epic" as const })),
      ...spineFeatures.map((f) => ({
        id: f.id,
        title: f.title,
        kind: "feature" as const,
      })),
      ...spineStories.map((s) => ({
        id: s.id,
        title: s.title,
        kind: "story" as const,
      })),
    ],
    [spineEpics, spineFeatures, spineStories]
  );

  const addDraftRow = useCallback(() => {
    setDrafts((prev) => [...prev, emptyDraft("feature")]);
  }, []);

  const parentOptions = useMemo(() => {
    const draftEpics = drafts
      .filter((d) => d.type === "epic")
      .map((d) => ({
        id: d.id,
        title: d.title.trim() || "(Epic sans titre)",
        source: "session" as const,
      }));

    const featureOptions: FeatureParentOption[] = [
      ...spineFeatures.map((f) => ({
        id: f.id,
        title: f.title,
        source: "spine" as const,
        epicId: f.epic_id,
        epicTitle: f.epic_id
          ? formatSessionParentLabel(
              epicTitleById.get(f.epic_id) ?? "",
              isSessionDraftId(f.epic_id) ? "session" : "spine",
              "(Epic sans titre)"
            )
          : null,
      })),
      ...drafts
        .filter((d) => d.type === "feature")
        .map((d) => {
          const epicId = d.parentId;
          return {
            id: d.id,
            title: d.title.trim() || "(Feature sans titre)",
            source: "session" as const,
            epicId,
            epicTitle: epicId
              ? formatSessionParentLabel(
                  epicTitleById.get(epicId) ?? "",
                  isSessionDraftId(epicId) ? "session" : "spine",
                  "(Epic sans titre)"
                )
              : null,
          };
        }),
    ];

    return {
      epics: [
        ...spineEpics.map((e) => ({ id: e.id, title: e.title, source: "spine" as const })),
        ...draftEpics,
      ],
      featureGroups: groupFeaturesByEpic(featureOptions),
    };
  }, [drafts, spineEpics, spineFeatures, epicTitleById]);

  async function commitOne(
    draft: DiscoveryDraft,
    idMap: Map<string, string>,
    working: DiscoveryDraft[]
  ): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
    const resolveParent = (parentId: string | null): string | null => {
      if (!parentId) return null;
      if (isSessionDraftId(parentId)) {
        if (idMap.has(parentId)) return idMap.get(parentId)!;
        const parentDraft = working.find((d) => d.id === parentId);
        if (parentDraft?.spineId) return parentDraft.spineId;
        return null;
      }
      return parentId;
    };

    const description = draft.description.trim() || undefined;
    const doc_url = draft.doc_url.trim() || undefined;

    if (draft.type === "epic") {
      const result = await saveEpicAction(projectId, projectSlug, {
        title: draft.title.trim(),
        status: "todo",
        priority: 3,
        sort_order: 0,
        ...(description ? { description } : {}),
        ...(doc_url ? { doc_url } : {}),
      });
      if (!result.ok) return result;
      if (!result.id) return { ok: false, error: "Epic créé sans id." };
      return { ok: true, id: result.id };
    }

    if (draft.type === "feature") {
      const epicId = resolveParent(draft.parentId);
      if (!epicId) return { ok: false, error: "Epic parent introuvable (créez-le au Spine d'abord)." };
      if (!draft.jtbdId) return { ok: false, error: "JTBD obligatoire." };
      if (draft.impact == null) return { ok: false, error: "Impact obligatoire." };

      const shapeUpFields = featureFinalizeEffortFields(draft, working);
      const result = await saveInitiativeAction(
        projectSlug,
        {
          project_id: projectId,
          feature_name: draft.title.trim(),
          epic_id: epicId,
          impact: draft.impact,
          ...shapeUpFields,
          ...(description ? { description } : {}),
          ...(doc_url ? { doc_url } : {}),
          context_links: [{ type: "job" as const, context_id: draft.jtbdId }],
        },
        { metricSelect: "" }
      );
      if (!result.ok) return result;
      return { ok: true, id: result.id };
    }

    const featureId = resolveParent(draft.parentId);
    if (!featureId) {
      return { ok: false, error: "Feature parente introuvable (créez-la au Spine d'abord)." };
    }
    if (draft.effort_days == null || draft.complexity == null) {
      return { ok: false, error: "Effort et Risque obligatoires." };
    }

    const result = await saveUserStoryAction(projectId, projectSlug, {
      title: draft.title.trim(),
      feature_id: featureId,
      effort_days: draft.effort_days,
      complexity: draft.complexity,
      status: "todo",
      ...(description ? { description } : {}),
      ...(doc_url ? { doc_url } : {}),
    });
    if (!result.ok) return result;
    if (!("id" in result) || !result.id) {
      return { ok: false, error: "Story créée sans id." };
    }
    return { ok: true, id: result.id };
  }

  /**
   * P0.2 — Commit idempotent : après un échec partiel, `working` contient
   * l'état exact des drafts *non encore commit*. On persiste immédiatement
   * (setDrafts + sessionStorage via effet) pour qu'un retry ne re-crée pas
   * de doublons pour les étapes déjà versées au Spine.
   */
  async function commitChain(
    chain: DiscoveryDraft[],
    snapshot: DiscoveryDraft[]
  ): Promise<
    | { ok: true; working: DiscoveryDraft[]; committed: number }
    | { ok: false; error: string; working: DiscoveryDraft[]; committed: number }
  > {
    const idMap = new Map<string, string>();
    let working = [...snapshot];
    let committed = 0;

    for (const step of chain) {
      const result = await commitOne(step, idMap, working);
      if (!result.ok) {
        return { ok: false, error: result.error, working, committed };
      }
      idMap.set(step.id, result.id);
      working = working.map((d) => {
        if (d.id === step.id) {
          return { ...d, spineId: result.id };
        }
        if (d.parentId === step.id) {
          return { ...d, parentId: result.id };
        }
        return d;
      });
      committed += 1;
      // Persistance incrémentale : spineId posé immédiatement — retry skip les déjà versés.
      setDrafts(working);
    }

    return { ok: true, working, committed };
  }

  async function handleBulkFinalize() {
    if (busy) return;
    setError(null);
    setLastCommitted(null);

    const snapshot = drafts;
    const chain = bulkFinalizeOrder(snapshot, selectedIds);
    if (chain.length === 0) {
      setError(
        selectedIds.size === 0
          ? "Sélectionnez au moins une ligne à créer au Spine."
          : "Aucun élément prêt à créer au Spine."
      );
      return;
    }

    setBulkBusy(true);
    try {
      const result = await commitChain(chain, snapshot);
      if (!result.ok) {
        setError(
          result.committed > 0
            ? `${result.committed}/${chain.length} versé${result.committed > 1 ? "s" : ""} — ${result.error}`
            : result.error
        );
        router.refresh();
        return;
      }
      setSelectedIds(new Set());
      setLastCommitted(
        `${chain.length} élément${chain.length > 1 ? "s" : ""} versé${chain.length > 1 ? "s" : ""} au Spine (todo)`
      );
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  async function prepareReverseGuard(
    spineIds: string[]
  ): Promise<DiscoveryReverseAssertResult> {
    return assertDiscoveryReverseAllowedAction(projectId, spineIds);
  }

  async function requestBulkReverse() {
    if (busy || pouredCount === 0) return;
    setError(null);
    setLastCommitted(null);

    const spineIds = drafts
      .filter((d) => d.spineId)
      .map((d) => d.spineId!)
      .filter(Boolean);

    setReverseChecking(true);
    try {
      const gate = await prepareReverseGuard(spineIds);
      if (!gate.ok) {
        setError(gate.error);
        return;
      }
      setReverseConfirm({ items: gate.items });
    } finally {
      setReverseChecking(false);
    }
  }

  async function confirmReverse() {
    if (!reverseConfirm || busy) return;
    const pending = reverseConfirm;
    setReverseConfirm(null);

    setBulkReverseBusy(true);
    try {
      let working = [...drafts];
      let total = 0;
      const done = new Set<string>();

      const roots = working
        .filter((d) => d.spineId)
        .sort(
          (a, b) =>
            (a.type === "story" ? 0 : a.type === "feature" ? 1 : 2) -
            (b.type === "story" ? 0 : b.type === "feature" ? 1 : 2)
        );

      for (const root of roots) {
        if (done.has(root.id)) continue;
        const current = working.find((d) => d.id === root.id);
        if (!current?.spineId) continue;

        const chain = reverseOrder(current, working);
        for (const step of chain) {
          if (!step.spineId) continue;
          const archived = await archiveWorkItemAction(step.spineId, projectSlug);
          if (!archived.ok) {
            setDrafts(working);
            setError(
              `Impossible d'archiver « ${step.title || step.type} » : ${archived.error}`
            );
            router.refresh();
            return;
          }
          done.add(step.id);
          total += 1;
        }
        working = applyReverseLocal(current, working);
        setDrafts(clearFeatureShapeUpIfHasStories(working));
      }

      setLastCommitted(
        `${total} élément${total > 1 ? "s" : ""} revenu${total > 1 ? "s" : ""} en brouillon (Spine archivé)`
      );
      router.refresh();
    } finally {
      setBulkReverseBusy(false);
    }
  }

  function applyViewMode(mode: DiscoveryViewMode) {
    setViewMode(mode);
  }

  const loadLinkExample = useCallback(() => {
    const res = buildDiscoveryLinkExample({
      spineEpics,
      spineFeatures,
      jtbdOptions,
      author: defaultAuthor,
    });
    if (!res.ok) {
      setError(res.error);
      setLastCommitted(null);
      return;
    }
    replaceSessionFromFile(res.example.drafts, res.example.metadata);
    setSelectedIds(new Set());
    setActiveDraftId(null);
    applyViewMode("tree");
    const c = res.example.coverage;
    const parts = [
      c.featureToSpineEpic && "Feature→Epic Spine",
      c.storyToSpineFeature && "Story→Feature Spine",
      c.sessionChain && "Epic→Feature→Story (nouveaux)",
    ].filter(Boolean);
    setError(null);
    setLastCommitted(
      `Exemple chargé (${res.example.drafts.length} lignes) — ${parts.join(" · ")}. Vue Carte ouverte.`
    );
  }, [
    spineEpics,
    spineFeatures,
    jtbdOptions,
    defaultAuthor,
    replaceSessionFromFile,
  ]);

  const reparentDraft = useCallback(
    (draftId: string, parentId: string | null) => {
      updateDraft(draftId, { parentId });
      setActiveDraftId(draftId);
    },
    [updateDraft]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const table = tableRef.current;
      if (!table || !table.contains(e.target as Node)) return;

      if (e.key === "Escape") {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

      if (e.key === "Enter" && !isEditableTarget(e.target)) {
        const row = drafts[focusedRowIndexRef.current];
        if (!row) return;
        const titleInput = table.querySelector<HTMLInputElement>(
          `tr[data-draft-id="${row.id}"] input[data-discovery-cell="title"]`
        );
        if (titleInput && !titleInput.disabled) {
          e.preventDefault();
          titleInput.focus();
          titleInput.select();
        }
        return;
      }

      if (
        (e.key === "j" || e.key === "k") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isEditableTarget(e.target)
      ) {
        e.preventDefault();
        const delta = e.key === "j" ? 1 : -1;
        const next = Math.max(
          0,
          Math.min(drafts.length - 1, focusedRowIndexRef.current + delta)
        );
        focusedRowIndexRef.current = next;
        const row = drafts[next];
        if (!row) return;
        const tr = table.querySelector<HTMLElement>(`tr[data-draft-id="${row.id}"]`);
        tr?.focus();
        return;
      }

      if (e.key !== "Tab") return;
      const cells = Array.from(
        table.querySelectorAll<HTMLElement>(
          "tbody [data-discovery-cell]:not([disabled]):not([aria-disabled='true'])"
        )
      ).filter((el) => {
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement || el instanceof HTMLButtonElement) {
          return !el.disabled;
        }
        return true;
      });
      if (cells.length === 0) return;
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? cells.indexOf(active) : -1;
      if (idx < 0 && !table.contains(active)) return;
      e.preventDefault();
      const nextIdx = e.shiftKey
        ? idx <= 0
          ? cells.length - 1
          : idx - 1
        : idx < 0 || idx >= cells.length - 1
          ? 0
          : idx + 1;
      cells[nextIdx]?.focus();
      const rowEl = cells[nextIdx]?.closest("tr[data-draft-id]");
      const rowId = rowEl?.getAttribute("data-draft-id");
      if (rowId) {
        const i = drafts.findIndex((d) => d.id === rowId);
        if (i >= 0) focusedRowIndexRef.current = i;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drafts, viewMode]);

  // keyboard + focus atelier handled above

  return (
    <div className="sttns-card !p-0 overflow-x-clip">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addDraftRow}
            disabled={busy}
            className="sttns-btn-primary sttns-btn-sm"
            title="Ajouter une ligne brouillon"
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2} />
            Nouvelle ligne
          </button>
          <DiscoveryViewToggle value={viewMode} onChange={applyViewMode} />
          <p className="text-sm tabular-nums text-muted-foreground">
            <span className="text-foreground/80">
              {drafts.length} brouillon{drafts.length !== 1 ? "s" : ""}
            </span>
            <span className="mx-1.5 text-border" aria-hidden>
              ·
            </span>
            <span>
              {selectedFinalizeCount} sélectionné{selectedFinalizeCount !== 1 ? "s" : ""}
            </span>
            <span className="mx-1.5 text-border" aria-hidden>
              ·
            </span>
            <span>
              {pouredCount} au Spine
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {pouredCount > 0 ? (
            <button
              type="button"
              onClick={() => void requestBulkReverse()}
              disabled={busy || reverseChecking}
              className="sttns-btn-ghost sttns-btn-sm text-muted-foreground"
              title="Archiver les éléments Spine et les ramener en brouillon"
            >
              {bulkReverseBusy || reverseChecking ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4 shrink-0" />
              )}
              Revenir ({pouredCount})
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleBulkFinalize()}
            disabled={busy || selectedFinalizeCount === 0}
            className="sttns-btn-primary sttns-btn-md"
          >
            {bulkBusy ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Check className="h-4 w-4 shrink-0" />
            )}
            Créer au Spine ({selectedFinalizeCount})
          </button>
        </div>
      </div>

      <DiscoveryDraftManager
        projectId={projectId}
        projectSlug={projectSlug}
        drafts={drafts}
        metadata={draftMeta}
        defaultAuthor={defaultAuthor}
        hydrated={hydrated}
        busy={busy}
        onMetadataChange={(patch) =>
          setDraftMeta((prev) => ({ ...prev, ...patch }))
        }
        onReplaceSession={replaceSessionFromFile}
        onError={setError}
        onSuccess={setLastCommitted}
        onRequestClear={() => setClearConfirmOpen(true)}
        onLoadLinkExample={loadLinkExample}
      />

      {jtbdOptions.length === 0 && (
        <div className="mx-5 mt-4 rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-warning">
          Aucun JTBD dans ce projet. Créez Personas / JTBD dans la{" "}
          <Link
            href={`/projects/${projectSlug}/why`}
            className="font-semibold underline underline-offset-2"
          >
            Matrice Besoins
          </Link>{" "}
          avant de créer des Features au Spine.
        </div>
      )}

      {error && (
        <div className="mx-5 mt-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {lastCommitted && (
        <div className="mx-5 mt-4 rounded-md border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">
          {lastCommitted}
        </div>
      )}

      <div className="border-t border-border">
        {viewMode === "table" ? (
          <div className="overflow-x-auto p-4">
        <table ref={tableRef} className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-2 py-3 w-16">
                <div className="flex items-center gap-0.5">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    data-discovery-cell="select-all"
                    checked={allSelectableSelected}
                    disabled={busy || selectableDraftIds.length === 0}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    title={
                      selectableDraftIds.length === 0
                        ? "Aucune ligne finalisable"
                        : allSelectableSelected
                          ? "Tout désélectionner"
                          : "Tout sélectionner pour créer au Spine"
                    }
                    aria-label={
                      allSelectableSelected
                        ? "Tout désélectionner"
                        : "Tout sélectionner pour créer au Spine"
                    }
                    className="h-4 w-4 shrink-0 rounded border-border text-primary accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <span className="inline-block w-8" aria-hidden />
                </div>
              </th>
              <th className="px-3 py-3 w-32">Type</th>
              <th className="px-3 py-3 min-w-[200px]">Titre</th>
              <th className="px-3 py-3 w-48">Parent</th>
              <th className="px-3 py-3 w-44">JTBD</th>
              <th className="px-3 py-3 w-36 text-center">Impact</th>
              <th className="px-3 py-3 w-28 text-center">Effort</th>
              <th className="px-3 py-3 w-32 text-center">Risque</th>
              <th className="px-2 py-3 w-12" aria-label="Supprimer" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border [&_td]:py-3">
            {drafts.map((item, rowIndex) => {
              const needsParent = item.type === "feature" || item.type === "story";
              const isOrphan = needsParent && !item.parentId;
              const hasDraftStories =
                item.type === "feature" && featureHasSessionStories(item.id, drafts);
              const shapeUp = item.type === "feature" && !hasDraftStories;
              const featureRollup = hasDraftStories
                ? computeFeatureSessionRollup(item.id, drafts)
                : null;
              const epicRollup =
                item.type === "epic"
                  ? computeEpicSessionRollup(item.id, drafts)
                  : null;
              const gate = canFinalizeDraft(item, drafts);
              const poured = Boolean(item.spineId);
              const selectable = !poured && canFinalizeChain(item, drafts);
              const isSelected = selectedIds.has(item.id);
              const rowLocked = busy || poured;
              const highRisk =
                (item.type === "story" && item.complexity === 3) ||
                (featureRollup != null && featureRollup.riskyCount > 0);
              const expanded = expandedIds.has(item.id);
              const hasDetails =
                item.description.trim().length > 0 || item.doc_url.trim().length > 0;
              const titleCollision = draftTitleCollidesWithSpine(
                item,
                spineCollisionCatalog
              );

              return (
                <Fragment key={item.id}>
                  <tr
                    data-draft-id={item.id}
                    tabIndex={-1}
                    onFocus={() => {
                      focusedRowIndexRef.current = rowIndex;
                    }}
                    className={cn(
                      "group align-top transition-colors hover:bg-muted/50 focus-within:bg-muted/40 outline-none",
                      highRisk && "bg-warning/5",
                      poured && "bg-primary/5",
                      titleCollision && "bg-warning/10 ring-1 ring-inset ring-warning/40",
                      activeDraftId === item.id && "bg-primary/10 ring-1 ring-inset ring-primary/25"
                    )}
                    title={
                      titleCollision
                        ? "Titre proche d’un objet Spine existant — risque de doublon"
                        : undefined
                    }
                    onClick={() => setActiveDraftId(item.id)}
                  >
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-0.5">
                        <input
                          type="checkbox"
                          data-discovery-cell="select"
                          checked={isSelected}
                          disabled={busy || !selectable}
                          onChange={(e) => toggleSelected(item.id, e.target.checked)}
                          title={
                            poured
                              ? "Déjà au Spine"
                              : selectable
                                ? "Sélectionner pour créer au Spine"
                                : !gate.ok
                                  ? gate.reason
                                  : "Chaîne parent incomplète"
                          }
                          aria-label={
                            poured
                              ? "Déjà au Spine"
                              : selectable
                                ? `Sélectionner « ${item.title || item.type} » pour créer au Spine`
                                : !gate.ok
                                  ? gate.reason
                                  : "Chaîne parent incomplète"
                          }
                          className="h-4 w-4 shrink-0 rounded border-border text-primary accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                        />
                        <button
                          type="button"
                          data-discovery-cell="expand"
                          onClick={() => toggleExpanded(item.id)}
                          className={cn(
                            "sttns-btn-icon sttns-btn-ghost sttns-btn-sm",
                            hasDetails && "text-primary"
                          )}
                          title={
                            expanded
                              ? "Replier description / doc"
                              : "Description & lien doc (facultatif)"
                          }
                          aria-expanded={expanded}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <SpineObjectIcon type={item.type} size="sm" />
                        <select
                          data-discovery-cell="type"
                          value={item.type}
                          disabled={rowLocked}
                          onChange={(e) => {
                            const type = e.target.value as DiscoveryItemType;
                            updateDraft(item.id, {
                              type,
                              parentId: null,
                              jtbdId: type === "feature" ? item.jtbdId : null,
                              impact: type === "feature" ? item.impact ?? 1 : null,
                              effort_days:
                                type === "epic" ? null : item.effort_days ?? 1,
                              complexity:
                                type === "epic" ? null : item.complexity ?? 1,
                            });
                          }}
                          className={cn(
                            "sttns-input font-medium",
                            item.type === "epic" &&
                              "border-violet-200/80 bg-violet-50/80 text-violet-800",
                            item.type === "feature" &&
                              "border-teal-200/80 bg-teal-50/80 text-teal-800",
                            item.type === "story" &&
                              "border-cyan-200/80 bg-cyan-50/80 text-cyan-800"
                          )}
                        >
                          <option value="epic">Epic</option>
                          <option value="feature">Feature</option>
                          <option value="story">Story</option>
                        </select>
                        {poured ? (
                          <span className="rounded border border-primary/30 bg-primary/10 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Spine
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        data-discovery-cell="title"
                        value={item.title}
                        disabled={rowLocked}
                        onChange={(e) => updateDraft(item.id, { title: e.target.value })}
                        placeholder="Nom…"
                        className="sttns-input"
                      />
                    </td>

                    <td className="px-3 py-3">
                      {item.type === "epic" ? (
                        <span className="text-xs italic text-muted-foreground">Racine Spine</span>
                      ) : item.type === "feature" ? (
                        <DiscoveryParentPicker
                          value={item.parentId}
                          disabled={rowLocked}
                          orphan={isOrphan}
                          ariaLabel="Epic parent"
                          onChange={(parentId) => updateDraft(item.id, { parentId })}
                          options={parentOptions.epics.map((p) => ({
                            id: p.id,
                            label: formatSessionParentLabel(
                              p.title,
                              p.source,
                              "(Epic sans titre)"
                            ),
                            spineType: "epic" as const,
                          }))}
                        />
                      ) : (
                        <DiscoveryParentPicker
                          value={item.parentId}
                          disabled={rowLocked}
                          orphan={isOrphan}
                          ariaLabel="Feature parente"
                          onChange={(parentId) => updateDraft(item.id, { parentId })}
                          groups={parentOptions.featureGroups.map((group) => ({
                            label: group.label,
                            options: group.options.map((p) => ({
                              id: p.id,
                              label: formatSessionParentLabel(
                                p.title,
                                p.source,
                                "(Feature sans titre)"
                              ),
                              spineType: "feature" as const,
                            })),
                          }))}
                        />
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {item.type === "feature" ? (
                        <select
                          data-discovery-cell="jtbd"
                          value={item.jtbdId ?? ""}
                          disabled={rowLocked}
                          onChange={(e) =>
                            updateDraft(item.id, { jtbdId: e.target.value || null })
                          }
                          className={cn(
                            "sttns-input",
                            !item.jtbdId && "border-warning/20 bg-warning/10 text-warning"
                          )}
                        >
                          <option value="">— JTBD requis —</option>
                          {jtbdOptions.map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.personaName}: {j.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {item.type === "feature" ? (
                        <ImpactPicker
                          compact
                          disabled={rowLocked}
                          value={item.impact}
                          onChange={(v) => updateDraft(item.id, { impact: v })}
                        />
                      ) : item.type === "epic" && epicRollup && epicRollup.featureCount > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <EpicImpactSumBadge total={epicRollup.totalImpact} />
                        </div>
                      ) : (
                        <span className="block text-center text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      {item.type === "story" ? (
                        <EffortDaysPicker
                          compact
                          disabled={rowLocked}
                          value={item.effort_days}
                          onChange={(v) => updateDraft(item.id, { effort_days: v })}
                        />
                      ) : item.type === "feature" && shapeUp ? (
                        <EffortDaysPicker
                          compact
                          disabled={rowLocked}
                          value={item.effort_days}
                          onChange={(v) => updateDraft(item.id, { effort_days: v })}
                        />
                      ) : item.type === "feature" && featureRollup ? (
                        <RollupEffortCell
                          days={featureRollup.effortDays}
                          label="Effort (∑ Stories session)"
                        />
                      ) : item.type === "epic" && epicRollup && epicRollup.featureCount > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <EffortBadge days={epicRollup.totalDays} />
                        </div>
                      ) : (
                        <span className="block text-center text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3 relative">
                      {item.type === "story" ? (
                        <>
                          <RiskPicker
                            compact
                            disabled={rowLocked}
                            value={item.complexity}
                            onChange={(v) => updateDraft(item.id, { complexity: v })}
                          />
                          {item.complexity === 3 && (
                            <AlertTriangle className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-warning" />
                          )}
                        </>
                      ) : item.type === "feature" && shapeUp ? (
                        <RiskPicker
                          compact
                          disabled={rowLocked}
                          value={item.complexity}
                          onChange={(v) => updateDraft(item.id, { complexity: v })}
                        />
                      ) : item.type === "feature" && featureRollup ? (
                        <RollupRiskCell
                          maxRisk={featureRollup.maxRisk}
                          riskyCount={featureRollup.riskyCount}
                        />
                      ) : item.type === "epic" && epicRollup && epicRollup.featureCount > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <RatioBadge ratio={epicRollup.ratio} />
                        </div>
                      ) : (
                        <span className="block text-center text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-2 py-3 text-right">
                      <button
                        type="button"
                        data-discovery-cell="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDraft(item.id);
                        }}
                        disabled={busy || poured}
                        title={
                          poured
                            ? "Revenir en brouillon avant de supprimer la ligne"
                            : "Supprimer la ligne session"
                        }
                        aria-label="Supprimer la ligne"
                        className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm text-muted-foreground hover:text-destructive disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="bg-muted/30">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="grid gap-3 sm:grid-cols-2 max-w-3xl">
                          <div>
                            <label className="sttns-label" htmlFor={`desc-${item.id}`}>
                              Description (facultatif)
                            </label>
                            <textarea
                              id={`desc-${item.id}`}
                              value={item.description}
                              disabled={rowLocked}
                              onChange={(e) =>
                                updateDraft(item.id, { description: e.target.value })
                              }
                              rows={2}
                              placeholder="Contexte court pour l’équipe…"
                              className="sttns-input min-h-[4rem]"
                            />
                          </div>
                          <div>
                            <label className="sttns-label" htmlFor={`doc-${item.id}`}>
                              Lien doc (Notion / Figma…)
                            </label>
                            <input
                              id={`doc-${item.id}`}
                              type="url"
                              value={item.doc_url}
                              disabled={rowLocked}
                              onChange={(e) =>
                                updateDraft(item.id, { doc_url: e.target.value })
                              }
                              placeholder="https://…"
                              className="sttns-input"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {drafts.length === 0 && hydrated ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Aucune ligne en cadrage. Utilisez le{" "}
                  <strong className="text-foreground">+</strong> ci-dessous pour démarrer.
                  {jtbdOptions.length === 0 && (
                    <p className="mt-2 text-xs text-warning">
                      Astuce : créez d&apos;abord des JTBD dans la Matrice Besoins — requis pour
                      créer une Feature au Spine.
                    </p>
                  )}
                </td>
              </tr>
            ) : null}
            {!hydrated ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Chargement de la session…
                </td>
              </tr>
            ) : null}

            {hydrated ? (
              <tr className="border-t border-dashed border-border/70 bg-muted/10">
                <td className="px-2 py-3" colSpan={9}>
                  <button
                    type="button"
                    onClick={addDraftRow}
                    disabled={busy}
                    className="sttns-btn-ghost sttns-btn-sm text-muted-foreground"
                    title="Ajouter une ligne"
                    aria-label="Ajouter une ligne"
                  >
                    <Plus className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="text-xs">Ajouter une ligne</span>
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
          </div>
        ) : null}

        {viewMode === "tree" ? (
          <div className="p-3">
            <DiscoveryTreeCarte
              drafts={drafts}
              spineEpics={spineEpics}
              spineFeatures={spineFeatures}
              spineStories={spineStories}
              activeDraftId={activeDraftId}
              onSelectDraft={(id) => {
                setActiveDraftId(id);
                if (id) {
                  const idx = drafts.findIndex((d) => d.id === id);
                  if (idx >= 0) focusedRowIndexRef.current = idx;
                }
              }}
            />
          </div>
        ) : null}

        {viewMode === "mindmap" ? (
          <div className="p-3">
            <DiscoveryMindMap
              drafts={drafts}
              spineEpics={spineEpics}
              spineFeatures={spineFeatures}
              spineStories={spineStories}
              activeDraftId={activeDraftId}
              onSelectDraft={(id) => {
                setActiveDraftId(id);
                if (id) {
                  const idx = drafts.findIndex((d) => d.id === id);
                  if (idx >= 0) focusedRowIndexRef.current = idx;
                }
              }}
              onReparentDraft={reparentDraft}
            />
          </div>
        ) : null}
      </div>

      <div className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            Règles de saisie (parent session, Shape Up, roll-up Epic, création / retour Spine) — voir
            l’aide <strong className="text-foreground">i</strong> en tête de page. Tab entre cellules ·
            j/k entre lignes · vues Tableau / Carte / Mind Map.
          </p>
        </div>

      <SttnsModal
        open={reverseConfirm != null}
        onClose={() => setReverseConfirm(null)}
        title="Revenir en brouillon ?"
        eyebrow="Archive Spine"
        size="md"
        preventClose={bulkReverseBusy}
        footer={
          <>
            <button
              type="button"
              className="sttns-btn-secondary"
              onClick={() => setReverseConfirm(null)}
              disabled={bulkReverseBusy}
            >
              Annuler
            </button>
            <button
              type="button"
              className="sttns-btn-destructive"
              onClick={() => void confirmReverse()}
              disabled={bulkReverseBusy}
            >
              {bulkReverseBusy ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4 shrink-0" />
              )}
              Archiver et revenir
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Les éléments suivants seront <strong className="text-foreground">soft-archivés</strong>{" "}
          (statut actuellement todo) et les lignes session seront déverrouillées :
        </p>
        <ul className="mt-3 max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-foreground">
          {(reverseConfirm?.items ?? []).map((item) => (
            <li key={item.id}>
              <span className="font-medium">{item.title.trim() || "(sans titre)"}</span>
              <span className="text-muted-foreground">
                {" "}
                · {item.type} · {item.status}
              </span>
            </li>
          ))}
        </ul>
      </SttnsModal>

      <SttnsModal
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title="Vider la session de brouillons ?"
        eyebrow="Session"
        size="md"
        preventClose={busy}
        footer={
          <>
            <button
              type="button"
              className="sttns-btn-secondary"
              onClick={() => setClearConfirmOpen(false)}
              disabled={busy}
            >
              Annuler
            </button>
            <button
              type="button"
              className="sttns-btn-destructive"
              onClick={() => {
                clearSession();
                setClearConfirmOpen(false);
              }}
              disabled={busy}
            >
              <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
              Vider la session
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Vous êtes sur le point d&apos;effacer{" "}
          <strong className="text-foreground">
            {drafts.length} ligne{drafts.length > 1 ? "s" : ""}
          </strong>
          {draftMeta.title.trim() ? (
            <>
              {" "}
              (« <span className="text-foreground">{draftMeta.title.trim()}</span> »)
            </>
          ) : null}{" "}
          ainsi que les métadonnées du brouillon (cache navigateur inclus). Cette
          action est irréversible — pensez à exporter le brouillon avant si
          nécessaire.
        </p>
      </SttnsModal>
    </div>
  );
}
