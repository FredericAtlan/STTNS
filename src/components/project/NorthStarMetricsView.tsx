"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { buildMetricsTree } from "@/lib/sttns/metrics";
import {
  computeNsmPortfolioKpis,
  coverageForNode,
  NSM_COVERAGE_KEY,
  type NsmCoverageBundle,
} from "@/lib/metrics/nsmCoverage";
import { MetricCoverageBadges, type MetricCoverageBadgeCorner } from "@/components/metrics/MetricCoverageBadges";
import { NsmCoverageKpis } from "@/components/metrics/NsmCoverageKpis";
import {
  MetricCoverageDrillDown,
  type MetricCoverageDrillDownState,
} from "@/components/metrics/MetricCoverageDrillDown";
import type { SttnsProject, SttnsProjectMetric } from "@/types/sttns";
import { cn } from "@/lib/utils";
import { Compass, CornerDownRight } from "lucide-react";

/** Colonne gauche → badges à droite (vers le centre) ; colonne droite → badges à gauche. */
function badgeCornerForGridIndex(index: number): MetricCoverageBadgeCorner {
  return index % 2 === 0 ? "right" : "left";
}

interface Props {
  project: SttnsProject;
  metrics: SttnsProjectMetric[];
  projectSlug: string;
  embedded?: boolean;
  coverage: NsmCoverageBundle;
}

function useDrillDown() {
  const [state, setState] = useState<MetricCoverageDrillDownState>({ open: false });
  const close = useCallback(() => setState({ open: false }), []);
  const openDrillDown = useCallback(
    (metricLabel: string, kind: "epics" | "stories", ids: string[]) => {
      setState({ open: true, metricLabel, kind, ids });
    },
    []
  );
  return { state, close, openDrillDown };
}

function CoverageBadgesForNode({
  nodeKey,
  metricLabel,
  corner,
  bundle,
  onDrillDown,
}: {
  nodeKey: string;
  metricLabel: string;
  corner: MetricCoverageBadgeCorner;
  bundle: NsmCoverageBundle;
  onDrillDown: (metricLabel: string, kind: "epics" | "stories", ids: string[]) => void;
}) {
  const counts = coverageForNode(bundle, nodeKey);

  return (
    <MetricCoverageBadges
      epicCount={counts.epicCount}
      storyCount={counts.storyCount}
      corner={corner}
      metricLabel={metricLabel}
      onEpicClick={() => onDrillDown(metricLabel, "epics", counts.epicIds)}
      onStoryClick={() => onDrillDown(metricLabel, "stories", counts.storyIds)}
    />
  );
}

function MetricChildren({
  nodes,
  level,
  corner,
  bundle,
  onDrillDown,
}: {
  nodes: SttnsProjectMetric[];
  level: number;
  corner: MetricCoverageBadgeCorner;
  bundle: NsmCoverageBundle;
  onDrillDown: (metricLabel: string, kind: "epics" | "stories", ids: string[]) => void;
}) {
  if (!nodes.length) return null;

  return (
    <ul
      className={
        level === 3
          ? "mt-4 space-y-3 border-t border-slate-100 pt-3"
          : "mt-2 space-y-2 border-l-2 border-emerald-100 pl-3"
      }
    >
      {nodes.map((node) => (
        <li key={node.id} className="relative">
          <CoverageBadgesForNode
            nodeKey={node.id}
            metricLabel={node.name}
            corner={corner}
            bundle={bundle}
            onDrillDown={onDrillDown}
          />
          <div
            className={cn(
              "flex gap-2 text-sm text-slate-600",
              corner === "right" ? "pr-[4.5rem]" : "pl-[4.5rem]"
            )}
          >
            <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                Level {level} · Sub-metric
              </p>
              <p className="font-semibold text-slate-800">{node.name}</p>
              {node.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{node.description}</p>
              )}
            </div>
          </div>
          {(node.children?.length ?? 0) > 0 && (
            <MetricChildren
              nodes={node.children!}
              level={level + 1}
              corner={corner}
              bundle={bundle}
              onDrillDown={onDrillDown}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function NorthStarMetricsView({
  project,
  metrics,
  projectSlug,
  embedded = false,
  coverage,
}: Props) {
  const tree = buildMetricsTree(metrics);
  const portfolioKpis = computeNsmPortfolioKpis(coverage, metrics);
  const { state, close, openDrillDown } = useDrillDown();

  return (
    <section className={embedded ? "" : "mb-10"}>
      {!embedded && (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-700">
              Filter 1 · Product compass
            </p>
            <h3 className="font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              North Star &amp; Impact Metrics
            </h3>
          </div>
        </div>
      )}

      <NsmCoverageKpis kpis={portfolioKpis} />

      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 p-6 pt-12 text-center shadow-[0_4px_24px_-8px_rgba(16,185,129,0.25)]">
        <CoverageBadgesForNode
          nodeKey={NSM_COVERAGE_KEY}
          metricLabel={project.nsm_label}
          corner="right"
          bundle={coverage}
          onDrillDown={openDrillDown}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_55%)]" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-800">
            <Compass className="h-3 w-3" />
            Level 1 · North Star Metric
          </span>
          <p className="mx-auto mt-4 max-w-3xl font-display text-xl font-extrabold leading-snug text-emerald-950 sm:text-2xl">
            {project.nsm_label}
          </p>
          {project.nsm_description && (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-emerald-800/90">
              {project.nsm_description}
            </p>
          )}
        </div>
      </div>

      {tree.length > 0 && (
        <>
          <div className="my-5 flex justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <div className="h-6 w-px bg-gradient-to-b from-emerald-400 to-emerald-600" />
              <div className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-emerald-600" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tree.map((main, index) => {
              const corner = badgeCornerForGridIndex(index);
              return (
                <div
                  key={main.id}
                  className="group relative rounded-xl border border-slate-200/80 bg-white p-5 pt-12 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <CoverageBadgesForNode
                    nodeKey={main.id}
                    metricLabel={main.name}
                    corner={corner}
                    bundle={coverage}
                    onDrillDown={openDrillDown}
                  />
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                    Level 2 · Impact Metric
                  </p>
                  <p className="mt-1 font-display text-sm font-bold text-slate-900">{main.name}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {main.description ?? "Description to define for this project."}
                  </p>

                  {(main.children?.length ?? 0) > 0 && (
                    <MetricChildren
                      nodes={main.children!}
                      level={3}
                      corner={corner}
                      bundle={coverage}
                      onDrillDown={openDrillDown}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tree.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-sttns-muted">
          No Impact Metrics defined.{" "}
          <Link
            href={`/projects/${projectSlug}/north-star/edit`}
            className="font-bold text-sttns-accent hover:underline"
          >
            Add metrics
          </Link>
        </p>
      )}

      <div className="mt-4 rounded-xl border border-red-200/60 bg-gradient-to-r from-red-50/80 to-white px-4 py-3.5 text-sm text-red-900">
        <strong>Golden rule:</strong> every feature must answer —{" "}
        <em>&quot;Which Impact Metric will this code block move forward, and how?&quot;</em>
      </div>

      <MetricCoverageDrillDown
        state={state}
        onClose={close}
        projectSlug={projectSlug}
        bundle={coverage}
      />
    </section>
  );
}
