import { deriveGovernanceBucket, type GovernanceBucket } from "@/lib/sttns/governanceAxes";
import { featuresPath } from "@/lib/sttns/paths";
import { computeSttnsScore } from "@/lib/sttns/riceVisual";
import type {
  SttnsEpic,
  SttnsInitiative,
  SttnsInitiativeVersionType,
} from "@/types/sttns";

export const ROADMAP_COLUMNS: SttnsInitiativeVersionType[] = ["v1_mvp", "v2_consolidation"];

export { EPIC_STATUS_BADGE } from "@/lib/sttns/epicCatalog";

export type RoadmapMatrixFilters = {
  hideDraft: boolean;
  hideKilled: boolean;
};

export type RoadmapCellInitiatives = SttnsInitiative[];

export type RoadmapGroupedRow = {
  epic: SttnsEpic | null;
  label: string;
  statusLabel?: string;
  statusKey?: string;
  cells: Record<SttnsInitiativeVersionType, RoadmapCellInitiatives>;
};

/** Détecte une URL repo / PR / branche Git. */
export function isGitDevLink(url: string): boolean {
  const lower = url.trim().toLowerCase();
  if (!lower) return false;

  const hosts = ["github.com", "gitlab.com", "bitbucket.org", "git.sr.ht"];
  if (hosts.some((host) => lower.includes(host))) return true;

  const patterns = ["/pull/", "/pulls/", "/merge_requests/", "/compare/", "/tree/", "/commit/"];
  return patterns.some((p) => lower.includes(p));
}

/** Initiative IDs ayant au moins un lien Git. */
export function buildGitLinkInitiativeIds(
  links: ReadonlyArray<{ initiative_id: string; url: string }>
): Set<string> {
  const ids = new Set<string>();
  for (const link of links) {
    if (isGitDevLink(link.url)) ids.add(link.initiative_id);
  }
  return ids;
}

export function shortFeatureTitle(name: string, maxLen = 28): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export function newFeatureDeepLink(
  projectSlug: string,
  epicId: string | null,
  versionType: SttnsInitiativeVersionType
): string {
  const base = featuresPath(projectSlug, "new");
  const params = new URLSearchParams();
  if (epicId) params.set("epic_id", epicId);
  params.set("version_type", versionType);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function initiativePainSummary(initiative: SttnsInitiative): string | null {
  return initiative.pain_point_detail?.trim() || initiative.pain_point?.trim() || null;
}

export function formatRiceFormula(initiative: SttnsInitiative): string {
  const r = initiative.rice_reach;
  const i = initiative.rice_impact;
  const c = initiative.rice_confidence;
  const e = initiative.rice_effort;

  if (r == null || i == null || c == null || e == null || e <= 0) {
    return "Scoring incomplet (legacy RICE)";
  }

  const score = computeSttnsScore(r, i, c, e);
  const rounded = score != null ? Math.round(score) : "—";
  return `(${r} × ${i} × ${c}) / ${e} = ${rounded}`;
}

/** Styles pill selon bucket gouvernance — draft/killed atténués par défaut. */
export function roadmapPillClasses(bucket: GovernanceBucket): string {
  const base =
    "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold transition hover:ring-2 hover:ring-offset-1";

  switch (bucket) {
    case "build":
      return `${base} border-emerald-200 bg-emerald-100 text-emerald-900 hover:ring-emerald-300`;
    case "learn":
      return `${base} border-violet-200 bg-violet-100 text-violet-900 hover:ring-violet-300`;
    case "in_review":
      return `${base} border-blue-200 bg-blue-50 text-blue-900 hover:ring-blue-200`;
    case "ceo_pending":
      return `${base} border-amber-200 bg-amber-50 text-amber-900 hover:ring-amber-200`;
    case "killed":
      return `${base} border-slate-200 bg-slate-100/80 text-slate-500 opacity-40 line-through hover:ring-slate-200`;
    case "draft":
    default:
      return `${base} border-zinc-200 bg-zinc-100/80 text-zinc-500 opacity-50 hover:ring-zinc-200`;
  }
}

export function shouldShowInitiative(
  initiative: SttnsInitiative,
  filters: RoadmapMatrixFilters
): boolean {
  const bucket = deriveGovernanceBucket(initiative);
  if (filters.hideDraft && bucket === "draft") return false;
  if (filters.hideKilled && bucket === "killed") return false;
  return true;
}

function emptyCells(): Record<SttnsInitiativeVersionType, RoadmapCellInitiatives> {
  return { v1_mvp: [], v2_consolidation: [] };
}

function pushToCell(
  cells: Record<SttnsInitiativeVersionType, RoadmapCellInitiatives>,
  initiative: SttnsInitiative
) {
  const version = (initiative.version_type ?? "v1_mvp") as SttnsInitiativeVersionType;
  cells[version].push(initiative);
}

function sortCellInitiatives(list: RoadmapCellInitiatives): RoadmapCellInitiatives {
  return [...list].sort((a, b) => {
    const codeA = a.feature_code ?? "";
    const codeB = b.feature_code ?? "";
    if (codeA && codeB) return codeA.localeCompare(codeB, undefined, { numeric: true });
    return (a.feature_name ?? "").localeCompare(b.feature_name ?? "");
  });
}

/** Groupe les initiatives par epic (lignes) et version_type (colonnes). */
export function buildRoadmapRows(
  epics: SttnsEpic[],
  initiatives: SttnsInitiative[],
  filters: RoadmapMatrixFilters
): RoadmapGroupedRow[] {
  const visible = initiatives.filter(
    (i) => !i.archived_at && shouldShowInitiative(i, filters)
  );

  const epicIds = new Set(epics.map((e) => e.id));
  const byEpic = new Map<string, SttnsInitiative[]>();
  const orphans: SttnsInitiative[] = [];

  for (const initiative of visible) {
    const epicId = initiative.epic_id;
    if (!epicId || !epicIds.has(epicId)) {
      orphans.push(initiative);
      continue;
    }
    const list = byEpic.get(epicId) ?? [];
    list.push(initiative);
    byEpic.set(epicId, list);
  }

  const sortedEpics = [...epics].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));

  const rows: RoadmapGroupedRow[] = sortedEpics.map((epic) => {
    const cells = emptyCells();
    for (const initiative of byEpic.get(epic.id) ?? []) {
      pushToCell(cells, initiative);
    }
    return {
      epic,
      label: epic.title,
      statusLabel: epic.status,
      statusKey: epic.status,
      cells: {
        v1_mvp: sortCellInitiatives(cells.v1_mvp),
        v2_consolidation: sortCellInitiatives(cells.v2_consolidation),
      },
    };
  });

  if (orphans.length > 0) {
    const cells = emptyCells();
    for (const initiative of orphans) pushToCell(cells, initiative);
    rows.push({
      epic: null,
      label: "Initiatives orphelines",
      cells: {
        v1_mvp: sortCellInitiatives(cells.v1_mvp),
        v2_consolidation: sortCellInitiatives(cells.v2_consolidation),
      },
    });
  }

  return rows;
}
