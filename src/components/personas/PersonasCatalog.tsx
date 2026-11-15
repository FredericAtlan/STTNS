"use client";

/**
 * @deprecated Catalogue Personas DRAFT/READY — routes → `/why` (Étape B).
 * Conservé pour éventuelle reprise lecture / scripts ; ne plus brancher de navigation.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { EmptyStateCoach } from "@/components/ui/EmptyStateCoach";
import {
  AlertTriangle,
  CircleCheck,
  Download,
  Eye,
  EyeOff,
  FileText,
  Hash,
  ShieldAlert,
  Sparkles,
  UserCircle,
  Settings2,
  Pencil,
  Trash2,
} from "lucide-react";
import { setPersonaProjectScopeAction, renamePersonaAction, deletePersonaAction } from "@/app/projects/[slug]/personas/actions";
import { PersonaScopeBadge, PersonaStatusBadge } from "@/components/personas/personaUi";
import {
  SttnsDataTable,
  SttnsIconHeader,
  SttnsTableColumnHeader,
  SttnsTableTextHeader,
} from "@/components/ui/SttnsDataTable";
import { KPI_VOCAB, TABLE_COLUMN_VOCAB, tableColumnTooltip } from "@/lib/sttns/iconVocabulary";
import { SttnsDataToolbar } from "@/components/ui/SttnsDataToolbar";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";
import {
  SttnsSortableHeader,
  type SttnsSortDir,
} from "@/components/ui/SttnsSortableHeader";
import {
  SttnsTablePagination,
  type SttnsPageSize,
} from "@/components/ui/SttnsTablePagination";
import { buildCsvContent, downloadCsv } from "@/lib/sttns/csvExport";
import type {
  PersonaCatalogFilter,
  PersonaCatalogHealth,
  PersonaHealthLevel,
} from "@/lib/personas/personaCatalogHealth";
import { matchesPersonaCatalogFilter } from "@/lib/personas/personaCatalogHealth";
import { comparePersonaCode } from "@/lib/personas/personaCodes";
import type { PersonaVocabulary } from "@/lib/personas/personaVocabulary";
import { resolveJobTypeLabel } from "@/lib/personas/personaVocabulary";
import type { PersonaProjectScope } from "@/components/personas/personaUi";
import { cn } from "@/lib/utils";

const HEALTH_ORDER: Record<PersonaHealthLevel, number> = {
  critical: 0,
  warning: 1,
  incomplete: 2,
  empty: 3,
  healthy: 4,
};

type ScopeFilter = "all" | PersonaProjectScope;
type SortKey = "ref" | "name" | "tier" | "scope" | "health" | "pains" | "jobs";

export type PersonaPainPreview = {
  label: string;
  description: string | null;
};

export type PersonaJobPreview = {
  type: string;
  description: string;
};

export type PersonaCatalogRow = {
  id: string;
  personaCode: string | null;
  name: string;
  projectScope: PersonaProjectScope;
  personaStatus: "DRAFT" | "READY";
  health: PersonaCatalogHealth;
  tier: string | null;
  tierCode: string | null;
  summary: string | null;
  pains: PersonaPainPreview[];
  jobs: PersonaJobPreview[];
  painCount: number;
  jobCount: number;
  headline: string | null;
};

function truncate(text: string, max = 100): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function cmpStr(a: string, b: string): number {
  return a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" });
}

function PainPointsCell({ pains }: { pains: PersonaPainPreview[] }) {
  if (pains.length === 0) {
    return <span className="text-xs font-medium text-amber-600">À compléter</span>;
  }

  return (
    <ul className="space-y-1.5">
      {pains.map((pain, index) => (
        <li key={`${pain.label}-${index}`} className="text-xs leading-snug text-zinc-700">
          <span className="font-semibold text-amber-900">{pain.label}</span>
          {pain.description && pain.description.trim() !== pain.label.trim() && (
            <p className="mt-0.5 text-[11px] text-zinc-500">{truncate(pain.description, 120)}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function JobsCell({
  jobs,
  vocabulary,
}: {
  jobs: PersonaJobPreview[];
  vocabulary: PersonaVocabulary;
}) {
  if (jobs.length === 0) {
    return <span className="text-xs font-medium text-amber-600">À compléter</span>;
  }

  const order = new Map(vocabulary.jobTypes.map((t, i) => [t.code, i]));
  const sorted = [...jobs].sort(
    (a, b) => (order.get(a.type) ?? 99) - (order.get(b.type) ?? 99)
  );

  return (
    <ul className="space-y-1.5">
      {sorted.map((job, index) => (
        <li key={`${job.type}-${index}`} className="text-xs leading-snug">
          <span className="font-semibold text-violet-800">
            {resolveJobTypeLabel(job.type, vocabulary)}
          </span>
          <p className="mt-0.5 text-[11px] text-zinc-600">{truncate(job.description, 120)}</p>
        </li>
      ))}
    </ul>
  );
}

function HealthCell({ health }: { health: PersonaCatalogHealth }) {
  const Icon =
    health.level === "healthy"
      ? CircleCheck
      : health.level === "critical"
        ? ShieldAlert
        : health.level === "warning" || health.level === "incomplete"
          ? AlertTriangle
          : Sparkles;

  const tone =
    health.level === "healthy"
      ? "text-emerald-600"
      : health.level === "critical"
        ? "text-red-600"
        : health.level === "warning" || health.level === "incomplete"
          ? "text-amber-600"
          : "text-zinc-400";

  const detail =
    health.criticalCount > 0 || health.warningCount > 0
      ? `${health.criticalCount} critique(s) · ${health.warningCount} avertissement(s)`
      : health.tip;

  return (
    <SttnsIconTip label={`${health.label} — ${detail}`} placement="left">
      <div className="flex flex-col items-center gap-0.5">
        <Icon className={cn("h-4 w-4", tone)} aria-hidden />
        <span className={cn("text-[9px] font-bold uppercase tracking-wide", tone)}>
          {health.label}
        </span>
      </div>
    </SttnsIconTip>
  );
}

function PersonaScopeToggle({
  personaId,
  projectId,
  projectSlug,
  scope,
  disabled,
  castLocked,
}: {
  personaId: string;
  projectId: string;
  projectSlug: string;
  scope: PersonaProjectScope;
  disabled?: boolean;
  castLocked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isActive = scope === "active";
  const isDisabled = disabled || pending || castLocked;

  function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (isDisabled) return;
    const next: PersonaProjectScope = isActive ? "reference" : "active";
    startTransition(async () => {
      const result = await setPersonaProjectScopeAction(
        personaId,
        projectId,
        projectSlug,
        next
      );
      if (result.ok) router.refresh();
    });
  }

  return (
    <SttnsIconTip
      label={
        castLocked
          ? "Casting verrouillé — réouvrir depuis la bannière en haut de page"
          : isActive
            ? "Actif pour le projet — cliquer pour passer inactif"
            : "Inactif — cliquer pour activer"
      }
      placement="left"
    >
      <button
        type="button"
        onClick={toggle}
        disabled={isDisabled}
        aria-pressed={isActive}
        className={cn(
          "inline-flex h-7 w-11 items-center rounded-full border p-0.5 transition-colors",
          isActive
            ? "border-emerald-300 bg-emerald-100"
            : "border-zinc-300 bg-zinc-100",
          pending && "opacity-60"
        )}
      >
        <span
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
            isActive ? "translate-x-4 text-emerald-700" : "translate-x-0 text-zinc-400"
          )}
        >
          {isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </span>
      </button>
    </SttnsIconTip>
  );
}

function readStoredPageSize(projectSlug: string): SttnsPageSize {
  if (typeof window === "undefined") return 10;
  const raw = window.localStorage.getItem(`sttns_personas_page_size_${projectSlug}`);
  if (raw === "5" || raw === "10" || raw === "20") return Number(raw) as SttnsPageSize;
  return 10;
}

type PersonasCatalogProps = {
  projectId: string;
  projectSlug: string;
  rows: PersonaCatalogRow[];
  vocabulary: PersonaVocabulary;
  personasCastLocked?: boolean;
};

export function PersonasCatalog(props: PersonasCatalogProps) {
  if (props.rows.length === 0) {
    return (
      <EmptyStateCoach
        type="persona"
        title="Section vide"
        explanation="Pour construire votre Spine, cette section a besoin de Personas."
        actionLabel="Créer votre premier Persona"
        actionHref={`/projects/${props.projectSlug}/personas/new`}
      />
    );
  }
  return <PersonasCatalogList {...props} />;
}

// Hooks appelés inconditionnellement : le cas « liste vide » est traité par le parent.
function PersonasCatalogList({
  projectId,
  projectSlug,
  rows,
  vocabulary,
  personasCastLocked = false,
}: PersonasCatalogProps) {
  const base = `/projects/${projectSlug}/personas`;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PersonaCatalogFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("ref");
  const [sortDir, setSortDir] = useState<SttnsSortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<SttnsPageSize>(10);

  useEffect(() => {
    setPageSize(readStoredPageSize(projectSlug));
  }, [projectSlug]);

  const tierOrder = useMemo(
    () => new Map(vocabulary.tiers.map((tier, index) => [tier.code, index])),
    [vocabulary.tiers]
  );

  const incompleteCount = rows.filter((r) => matchesPersonaCatalogFilter(r, "incomplete")).length;
  const criticalCount = rows.filter((r) => matchesPersonaCatalogFilter(r, "critical")).length;
  const ghostJobCount = rows.filter((r) => matchesPersonaCatalogFilter(r, "ghostJob")).length;
  const readyCount = rows.filter((r) => matchesPersonaCatalogFilter(r, "ready")).length;
  const activeCount = rows.filter((r) => r.projectScope === "active").length;
  const referenceCount = rows.filter((r) => r.projectScope === "reference").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesPersonaCatalogFilter(row, filter)) return false;
      if (scopeFilter !== "all" && row.projectScope !== scopeFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        (row.personaCode?.toLowerCase().includes(q) ?? false) ||
        row.health.label.toLowerCase().includes(q) ||
        (row.tier?.toLowerCase().includes(q) ?? false) ||
        (row.summary?.toLowerCase().includes(q) ?? false) ||
        (row.headline?.toLowerCase().includes(q) ?? false) ||
        row.pains.some(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            (p.description?.toLowerCase().includes(q) ?? false)
        ) ||
        row.jobs.some((j) => j.description.toLowerCase().includes(q))
      );
    });
  }, [rows, search, filter, scopeFilter]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  const sorted = useMemo(() => {
    const sign = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let result = 0;
      switch (sortKey) {
        case "ref":
          result = comparePersonaCode(a.personaCode, b.personaCode);
          break;
        case "name":
          result = cmpStr(a.name, b.name);
          break;
        case "tier":
          result =
            (tierOrder.get(a.tierCode ?? "") ?? 99) - (tierOrder.get(b.tierCode ?? "") ?? 99);
          if (result === 0) result = cmpStr(a.tier ?? "", b.tier ?? "");
          break;
        case "scope":
          result = cmpStr(a.projectScope, b.projectScope);
          break;
        case "health":
          result = HEALTH_ORDER[a.health.level] - HEALTH_ORDER[b.health.level];
          break;
        case "pains":
          result = a.painCount - b.painCount;
          break;
        case "jobs":
          result = a.jobCount - b.jobCount;
          break;
        default:
          result = 0;
      }
      return result * sign;
    });
  }, [filtered, sortDir, sortKey, tierOrder]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, filter, scopeFilter, sortKey, sortDir, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function handlePageSizeChange(size: SttnsPageSize) {
    setPageSize(size);
    window.localStorage.setItem(`sttns_personas_page_size_${projectSlug}`, String(size));
  }

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const exportCsv = useCallback(() => {
    const headers = [
      "Réf.",
      "Nom",
      "Scope",
      "Statut matrice",
      "Segment",
      "Résumé",
      "Frictions",
      "Jobs",
      "Santé",
    ];
    const csvRows = sorted.map((row) => [
      row.personaCode ?? "",
      row.name,
      row.projectScope === "active" ? "Actif" : "Inactif",
      row.personaStatus,
      row.tier ?? "",
      row.summary ?? "",
      row.pains.map((p) => p.label).join(" | "),
      row.jobs
        .map((j) => `${resolveJobTypeLabel(j.type, vocabulary)}: ${j.description}`)
        .join(" | "),
      row.health.label,
    ]);
    downloadCsv(
      `personas-${projectSlug}-${new Date().toISOString().slice(0, 10)}.csv`,
      buildCsvContent(headers, csvRows)
    );
  }, [projectSlug, sorted, vocabulary]);

  const sortHeader = (key: SortKey, label: React.ReactNode, className?: string) => (
    <SttnsSortableHeader
      sortKey={key}
      activeKey={sortKey}
      dir={sortDir}
      onSort={(k) => handleSort(k as SortKey)}
      label={label}
      className={className}
    />
  );

  const columns = useMemo(
    () => [
      {
        id: "ref",
        header: sortHeader(
          "ref",
          <SttnsTableTextHeader
            icon={TABLE_COLUMN_VOCAB.personaRef.icon}
            label={TABLE_COLUMN_VOCAB.personaRef.label}
            description={TABLE_COLUMN_VOCAB.personaRef.hint}
          />
        ),
        cell: (row: PersonaCatalogRow) => (
          <span className="font-mono text-xs font-bold text-emerald-900">
            {row.personaCode ?? "—"}
          </span>
        ),
        className: "w-[56px] align-top py-2.5",
      },
      {
        id: "scope",
        header: sortHeader(
          "scope",
          <SttnsTableTextHeader
            icon={TABLE_COLUMN_VOCAB.personaScope.icon}
            label={TABLE_COLUMN_VOCAB.personaScope.label}
            description={TABLE_COLUMN_VOCAB.personaScope.hint}
          />
        ),
        cell: (row: PersonaCatalogRow) => (
          <div className="flex flex-col items-start gap-1.5" onClick={(e) => e.stopPropagation()}>
            <PersonaScopeToggle
              personaId={row.id}
              projectId={projectId}
              projectSlug={projectSlug}
              scope={row.projectScope}
              castLocked={personasCastLocked}
            />
            <PersonaScopeBadge scope={row.projectScope} />
          </div>
        ),
        className: "w-[88px] align-top py-2.5",
      },
      {
        id: "name",
        header: sortHeader(
          "name",
          <SttnsTableTextHeader
            icon={TABLE_COLUMN_VOCAB.personaName.icon}
            label={TABLE_COLUMN_VOCAB.personaName.label}
            description={TABLE_COLUMN_VOCAB.personaName.hint}
          />
        ),
        cell: (row: PersonaCatalogRow) => (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`${base}/${row.id}`}
              className="font-semibold text-zinc-900 hover:text-emerald-800"
              onClick={(e) => e.stopPropagation()}
            >
              {row.name}
            </Link>
            <PersonaStatusBadge status={row.personaStatus} />
          </div>
        ),
        className: "min-w-[180px] max-w-[240px] align-top py-2.5",
      },
      {
        id: "tier",
        header: sortHeader(
          "tier",
          <SttnsIconHeader
            icon={KPI_VOCAB.personaTiers.icon}
            tip={KPI_VOCAB.personaTiers.label}
            description={tableColumnTooltip(KPI_VOCAB.personaTiers)}
          />
        ),
        cell: (row: PersonaCatalogRow) =>
          row.tier ? (
            <span className="text-xs text-zinc-600">{row.tier}</span>
          ) : (
            <span className="text-zinc-300">—</span>
          ),
        className: "max-w-[100px] align-top py-2.5",
      },
      {
        id: "summary",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.personaSummary} />,
        cell: (row: PersonaCatalogRow) =>
          row.summary?.trim() ? (
            <p className="text-xs leading-snug text-zinc-600">
              <span className="font-semibold text-emerald-900">Résumé :</span>{" "}
              {truncate(row.summary, 160)}
            </p>
          ) : (
            <span className="text-xs font-medium text-amber-600">À compléter</span>
          ),
        className: "min-w-[140px] max-w-[220px] align-top py-2.5",
      },
      {
        id: "pain",
        header: sortHeader(
          "pains",
          <span className="inline-flex items-center gap-1 normal-case tracking-normal">
            <SttnsIconHeader
              icon={KPI_VOCAB.personaPain.icon}
              tip={KPI_VOCAB.personaPain.label}
              description={tableColumnTooltip(KPI_VOCAB.personaPain)}
            />
            Frictions
          </span>
        ),
        cell: (row: PersonaCatalogRow) => <PainPointsCell pains={row.pains} />,
        className: "min-w-[200px] max-w-[280px] align-top py-2.5",
      },
      {
        id: "jobs",
        header: sortHeader(
          "jobs",
          <span className="inline-flex items-center gap-1 normal-case tracking-normal">
            <SttnsIconHeader
              icon={KPI_VOCAB.personaJobs.icon}
              tip={KPI_VOCAB.personaJobs.label}
              description={tableColumnTooltip(KPI_VOCAB.personaJobs)}
            />
            Jobs
          </span>
        ),
        cell: (row: PersonaCatalogRow) => <JobsCell jobs={row.jobs} vocabulary={vocabulary} />,
        className: "min-w-[200px] max-w-[300px] align-top py-2.5",
      },
      {
        id: "health",
        header: sortHeader(
          "health",
          <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.personaHealth} />
        ),
        cell: (row: PersonaCatalogRow) => <HealthCell health={row.health} />,
        headerClassName: "w-[88px] text-center",
        className: "w-[88px] align-top py-2.5 text-center",
      },
      {
        id: "actions",
        header: <SttnsTableColumnHeader column={TABLE_COLUMN_VOCAB.actions} />,
        cell: (row: PersonaCatalogRow) => (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                const newName = window.prompt("Renommer le persona :", row.name);
                if (newName && newName.trim() !== row.name) {
                  renamePersonaAction(row.id, projectId, projectSlug, newName.trim());
                }
              }}
              className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
              title="Renommer"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Effacer définitivement le persona "${row.name}" ?`)) {
                  deletePersonaAction(row.id, projectId, projectSlug);
                }
              }}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              title="Effacer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
        className: "w-[80px] align-top py-2.5",
      },
    ],
    [base, projectId, projectSlug, sortDir, sortKey, vocabulary]
  );

  return (
    <div className="space-y-2">
      <SttnsDataToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Réf., nom, segment, friction, job…"
        resultCount={filtered.length}
        totalCount={rows.length}
        filters={[
          {
            id: "active",
            icon: Eye,
            tip: "Actifs pour le projet",
            active: scopeFilter === "active",
            count: activeCount,
            onClick: () => setScopeFilter((f) => (f === "active" ? "all" : "active")),
          },
          {
            id: "reference",
            icon: EyeOff,
            tip: "Inactifs — hors casting",
            active: scopeFilter === "reference",
            count: referenceCount,
            onClick: () => setScopeFilter((f) => (f === "reference" ? "all" : "reference")),
          },
          {
            id: "incomplete",
            icon: AlertTriangle,
            tip: "À compléter — frictions ou jobs manquants",
            active: filter === "incomplete",
            count: incompleteCount,
            onClick: () => setFilter((f) => (f === "incomplete" ? "all" : "incomplete")),
          },
          {
            id: "critical",
            icon: ShieldAlert,
            tip: "Friction ignorée — non couverte par un job",
            active: filter === "critical",
            count: criticalCount,
            onClick: () => setFilter((f) => (f === "critical" ? "all" : "critical")),
          },
          {
            id: "ghostJob",
            icon: Sparkles,
            tip: "Job fantôme — job sans friction liée",
            active: filter === "ghostJob",
            count: ghostJobCount,
            onClick: () => setFilter((f) => (f === "ghostJob" ? "all" : "ghostJob")),
          },
          {
            id: "ready",
            icon: CircleCheck,
            tip: "Statut Ready enregistré",
            active: filter === "ready",
            count: readyCount,
            onClick: () => setFilter((f) => (f === "ready" ? "all" : "ready")),
          },
        ]}
        trailing={
          <SttnsIconTip label="Exporter CSV (filtres appliqués)" placement="bottom">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
              aria-label="Exporter CSV"
            >
              <Download className="h-4 w-4" />
            </button>
          </SttnsIconTip>
        }
      />

      <div className="min-w-0 [&_table]:min-w-[1040px]">
        <SttnsDataTable
          columns={columns}
          rows={paged}
          getRowHref={(row) => `${base}/${row.id}`}
          getRowClassName={(row) =>
            row.projectScope === "reference" ? "opacity-70 bg-zinc-50/40" : undefined
          }
          emptyMessage={
            rows.length === 0 ? (
              <>
                Aucun persona.{" "}
                <Link href={`${base}/new`} className="font-semibold text-emerald-700 hover:underline">
                  Créer le premier
                </Link>
              </>
            ) : (
              "Aucun résultat pour ce filtre."
            )
          }
        />
      </div>

      {sorted.length > 0 && (
        <SttnsTablePagination
          page={page}
          pageSize={pageSize}
          totalItems={sorted.length}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
