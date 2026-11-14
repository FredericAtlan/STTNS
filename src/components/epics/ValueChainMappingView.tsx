"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Filter, Users } from "lucide-react";
import {
  ORPHAN_REASON_LABELS,
  type MappingFeatureNode,
  type MappingStory,
  type ValueChainMap,
  type ValueChainRow,
} from "@/lib/epics/valueChainMapping";
import { USER_STORY_STATUS_LABELS } from "@/lib/sttns/personas";
import { StatusPill, type StatusType } from "@/components/ui/StatusPill";
import { cn } from "@/lib/utils";

function OrphanPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-dashed border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
      {label}
    </span>
  );
}

function DiscreteRef({ children }: { children: string }) {
  return (
    <p className="mt-0.5 line-clamp-1 font-mono text-[9px] leading-tight text-slate-400">{children}</p>
  );
}

function ChainNode({
  kind,
  name,
  refCode,
  orphan,
  href,
  className,
}: {
  kind: string;
  name: string;
  refCode?: string | null;
  orphan?: boolean;
  href?: string;
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        "min-w-[6.5rem] max-w-[12rem] rounded-xl border px-2.5 py-2",
        orphan
          ? "border-dashed border-rose-200 bg-rose-50/80"
          : "border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{kind}</p>
      <p className="mt-0.5 line-clamp-3 text-xs font-semibold leading-snug text-slate-800">{name}</p>
      {refCode ? <DiscreteRef>{refCode}</DiscreteRef> : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 transition hover:opacity-80">
        {content}
      </Link>
    );
  }

  return <div className="shrink-0">{content}</div>;
}

function FeatureNodes({
  features,
  projectSlug,
}: {
  features: MappingFeatureNode[];
  projectSlug: string;
}) {
  if (!features.length) {
    return <ChainNode kind="Feature" name="Aucune" orphan />;
  }

  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      {features.map((feature) => (
        <ChainNode
          key={feature.id}
          kind="Feature"
          name={feature.name}
          refCode={feature.code}
          href={`/projects/${projectSlug}/features/${feature.id}`}
          className="min-w-[6.5rem]"
        />
      ))}
    </div>
  );
}

function StoryNode({
  story,
  projectSlug,
}: {
  story: MappingStory;
  projectSlug: string;
}) {
  return (
    <div className="min-w-[7rem] max-w-[12rem] shrink-0">
      <Link
        href={`/projects/${projectSlug}/user-stories/${story.id}`}
        className={cn(
          "block rounded-xl border px-2.5 py-2 transition hover:border-emerald-300",
          story.isOrphan
            ? "border-dashed border-amber-200 bg-amber-50/80"
            : "border-emerald-200 bg-emerald-50/50"
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Story</p>
        <p className="mt-0.5 line-clamp-3 text-xs font-semibold leading-snug text-slate-900">
          {story.title}
        </p>
        {story.contextLabel && (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500">
            {story.contextLabel}
          </p>
        )}
        <StatusPill status={story.status as StatusType} size="sm" className="mt-1" />
      </Link>
      {story.isOrphan && (
        <div className="mt-1 flex flex-wrap gap-1">
          {story.orphanReasons.map((reason) => (
            <OrphanPill key={reason} label={ORPHAN_REASON_LABELS[reason]} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChainRowView({ row, projectSlug }: { row: ValueChainRow; projectSlug: string }) {
  const rowOrphan =
    row.persona.isOrphan ||
    row.painPoint?.isOrphan ||
    row.jtbd?.isOrphan ||
    row.jtbd?.isGhost ||
    row.story?.isOrphan;

  if (!row.story && !row.painPoint?.isOrphan && !row.jtbd?.isOrphan && !row.jtbd?.isGhost) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-start gap-1.5 overflow-x-auto pb-1",
        rowOrphan && "rounded-xl bg-rose-50/30 px-2 py-2"
      )}
    >
      <ChainNode
        kind="PP"
        name={row.painPoint?.label ?? "—"}
        refCode={row.painPoint?.clientKey}
        orphan={row.painPoint?.isOrphan}
      />
      <ChevronRight className="mt-6 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
      <ChainNode
        kind="JTBD"
        name={row.jtbd?.label ?? "—"}
        refCode={row.jtbd?.clientKey}
        orphan={row.jtbd?.isOrphan || row.jtbd?.isGhost}
      />
      <ChevronRight className="mt-6 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
      {row.story ? (
        <StoryNode story={row.story} projectSlug={projectSlug} />
      ) : (
        <ChainNode kind="Story" name="Aucune" orphan />
      )}
      <ChevronRight className="mt-6 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
      <ChainNode
        kind="Epic"
        name={row.story?.epicTitle ?? "—"}
        orphan={!row.story?.epicId}
        href={row.story?.epicId ? `/projects/${projectSlug}/epics/${row.story.epicId}` : undefined}
      />
      <ChevronRight className="mt-6 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
      <FeatureNodes features={row.story?.features ?? []} projectSlug={projectSlug} />
      <ChevronRight className="mt-6 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
      <ChainNode
        kind="Impact"
        name={row.story?.impactLabel ?? "—"}
        orphan={row.story?.orphanReasons.includes("story_no_impact")}
      />
    </div>
  );
}

function PersonaChainCard({
  rows,
  projectSlug,
  orphansOnly,
}: {
  rows: ValueChainRow[];
  projectSlug: string;
  orphansOnly: boolean;
}) {
  const persona = rows[0]?.persona;
  if (!persona) return null;

  const visibleRows = orphansOnly
    ? rows.filter(
        (row) =>
          row.persona.isOrphan ||
          row.painPoint?.isOrphan ||
          row.jtbd?.isOrphan ||
          row.jtbd?.isGhost ||
          row.story?.isOrphan ||
          (!row.story && (row.painPoint?.isOrphan || row.jtbd?.isOrphan))
      )
    : rows;

  if (!visibleRows.length) return null;

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/50 p-4 backdrop-blur-sm">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-sm font-semibold text-slate-900">
          {persona.name}
          {persona.code ? (
            <span className="ml-1.5 font-mono text-[9px] font-normal text-slate-400">{persona.code}</span>
          ) : null}
        </h3>
        {persona.tierLabel && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {persona.tierLabel}
          </span>
        )}
        {persona.scope === "reference" && (
          <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
            Inactif
          </span>
        )}
        {persona.isOrphan && <OrphanPill label="Persona sans story" />}
      </header>
      <div className="space-y-3">
        {visibleRows.map((row) => (
          <ChainRowView key={row.id} row={row} projectSlug={projectSlug} />
        ))}
      </div>
    </article>
  );
}

export function ValueChainMappingView({
  map,
  projectSlug,
  compact = false,
}: {
  map: ValueChainMap;
  projectSlug: string;
  compact?: boolean;
}) {
  const [orphansOnly, setOrphansOnly] = useState(false);
  const [activeCastOnly, setActiveCastOnly] = useState(true);

  const rowsByPersona = useMemo(() => {
    const groups = new Map<string, ValueChainRow[]>();
    for (const row of map.rows) {
      if (activeCastOnly && row.persona.scope !== "active") continue;
      const list = groups.get(row.persona.id) ?? [];
      list.push(row);
      groups.set(row.persona.id, list);
    }
    return Array.from(groups.entries());
  }, [map.rows, activeCastOnly]);

  const activeCastCount = useMemo(
    () => new Set(map.rows.filter((r) => r.persona.scope === "active").map((r) => r.persona.id)).size,
    [map.rows]
  );

  const showUnassigned =
    !orphansOnly || map.unassignedStories.some((s) => s.isOrphan) || map.unassignedStories.length > 0;
  const showGhostEpics = !orphansOnly || map.ghostEpics.length > 0;
  const showOrphanMetrics = map.orphanMetrics.length > 0;

  return (
    <div className={cn("space-y-6", compact && "space-y-4")}>
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-base font-bold text-zinc-900">
          Chaîne Produit/Exécution
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Chaîne <strong>Persona → PP → JTBD → Story → Epic → Feature → Impact</strong>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCastOnly((v) => !v)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                activeCastOnly
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <Users className="h-3.5 w-3.5" aria-hidden />
              {activeCastOnly ? `Casting actif (${activeCastCount})` : "Casting actif seulement"}
            </button>
            <button
              type="button"
              onClick={() => setOrphansOnly((v) => !v)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                orphansOnly
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <Filter className="h-3.5 w-3.5" aria-hidden />
              {orphansOnly ? "Orphelins seulement" : "Tout afficher"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {rowsByPersona.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
            Aucun persona {activeCastOnly ? "au casting actif" : ""} à afficher.
          </p>
        ) : (
          rowsByPersona.map(([personaId, rows]) => (
            <PersonaChainCard
              key={personaId}
              rows={rows}
              projectSlug={projectSlug}
              orphansOnly={orphansOnly}
            />
          ))
        )}
      </div>

      {showUnassigned && map.unassignedStories.length > 0 && (
        <section className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
          <h3 className="font-display text-sm font-semibold text-amber-900">Stories sans persona</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {map.unassignedStories
              .filter((s) => !orphansOnly || s.isOrphan)
              .map((story) => (
                <StoryNode key={story.id} story={story} projectSlug={projectSlug} />
              ))}
          </div>
        </section>
      )}

      {showGhostEpics && map.ghostEpics.length > 0 && (
        <section className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/30 p-4">
          <h3 className="font-display text-sm font-semibold text-rose-900">Epics fantômes</h3>
          <ul className="mt-3 space-y-2">
            {map.ghostEpics.map((epic) => (
              <li key={epic.id}>
                <Link
                  href={`/projects/${projectSlug}/epics/${epic.id}`}
                  className="flex items-center justify-between rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm hover:bg-rose-50"
                >
                  <span className="font-semibold text-slate-900">{epic.title}</span>
                  <OrphanPill label="0 story" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showOrphanMetrics && (
        <section className="rounded-2xl border border-slate-200/80 bg-white/50 p-4">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Métriques sans couverture (stories validées)
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {map.orphanMetrics.map((metric) => (
              <span
                key={metric.key}
                className="inline-flex max-w-xs flex-col rounded-full border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                <span className="line-clamp-2">{metric.label}</span>
                <span className="font-mono text-[9px] text-slate-400">L{metric.level}</span>
              </span>
            ))}
          </div>
          <Link
            href={`/projects/${projectSlug}/nsm`}
            className="mt-3 inline-block text-xs font-semibold text-emerald-800 hover:underline"
          >
            Voir l&apos;arbre NSM →
          </Link>
        </section>
      )}
    </div>
  );
}
