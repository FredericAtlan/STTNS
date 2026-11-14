"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  flatToDrafts,
  newMetricDraft,
  newSubMetricDraft,
  type MetricDraft,
} from "@/lib/sttns/metrics";
import type { SttnsProject, SttnsProjectMetric } from "@/types/sttns";
import { saveNorthStarMetricsAction } from "@/app/projects/[slug]/north-star/edit/actions";
import { ChevronDown, ChevronUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { SttnsContextHelp } from "@/components/ui/SttnsContextHelp";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface Props {
  project: SttnsProject;
  metrics: SttnsProjectMetric[];
  projectSlug: string;
}

function getNodeAtPath(drafts: MetricDraft[], path: number[]): MetricDraft | null {
  let node: MetricDraft | null = null;
  let list = drafts;
  for (const index of path) {
    node = list[index] ?? null;
    if (!node) return null;
    list = node.children;
  }
  return node;
}

function updateAtPath(
  drafts: MetricDraft[],
  path: number[],
  updater: (node: MetricDraft) => MetricDraft
): MetricDraft[] {
  if (path.length === 0) return drafts;
  const [head, ...rest] = path;
  if (rest.length === 0) {
    return drafts.map((d, i) => (i === head ? updater(d) : d));
  }
  return drafts.map((d, i) =>
    i === head ? { ...d, children: updateAtPath(d.children, rest, updater) } : d
  );
}

function updateDraftAtPath(
  drafts: MetricDraft[],
  path: number[],
  patch: Partial<MetricDraft>
): MetricDraft[] {
  return updateAtPath(drafts, path, (node) => ({ ...node, ...patch }));
}

function updateChildrenAtPath(
  drafts: MetricDraft[],
  parentPath: number[],
  updater: (children: MetricDraft[]) => MetricDraft[]
): MetricDraft[] {
  return updateAtPath(drafts, parentPath, (node) => ({
    ...node,
    children: updater(node.children),
  }));
}

function SubMetricsEditor({
  drafts,
  parentPath,
  level,
  setDrafts,
}: {
  drafts: MetricDraft[];
  parentPath: number[];
  level: number;
  setDrafts: React.Dispatch<React.SetStateAction<MetricDraft[]>>;
}) {
  const parent = getNodeAtPath(drafts, parentPath);
  const children = parent?.children ?? [];

  return (
    <div
      className={
        level === 3
          ? "mt-4 border-t border-slate-200 pt-4"
          : "mt-3 border-l-2 border-emerald-100 pl-3"
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Sub-metrics (level {level})
        </p>
        <button
          type="button"
          onClick={() =>
            setDrafts((prev) =>
              updateChildrenAtPath(prev, parentPath, (list) => [...list, newSubMetricDraft()])
            )
          }
          className="text-xs font-bold text-sttns-accent hover:underline"
        >
          + Add
        </button>
      </div>

      <p className="mb-2 text-[11px] text-amber-800">
        Each sub-metric needs a name — empty rows block save.
      </p>

      {children.length === 0 ? (
        <p className="text-xs text-sttns-muted">
          Optional — operational breakdowns attached to this metric.
        </p>
      ) : (
        <div className="space-y-3">
          {children.map((child, ci) => {
            const childPath = [...parentPath, ci];
            return (
              <div
                key={child.key}
                className="rounded-lg border border-emerald-100 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-600">
                    Level {level} · {ci + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDrafts((prev) =>
                        updateChildrenAtPath(prev, parentPath, (list) =>
                          list.filter((_, j) => j !== ci)
                        )
                      )
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="sttns-input text-sm"
                    value={child.name}
                    onChange={(e) =>
                      setDrafts((prev) =>
                        updateDraftAtPath(prev, childPath, { name: e.target.value })
                      )
                    }
                    placeholder="Sub-metric name"
                  />
                  <input
                    className="sttns-input text-sm sm:col-span-2"
                    value={child.description}
                    onChange={(e) =>
                      setDrafts((prev) =>
                        updateDraftAtPath(prev, childPath, { description: e.target.value })
                      )
                    }
                    placeholder="Description (optional)"
                  />
                </div>
                <SubMetricsEditor
                  drafts={drafts}
                  parentPath={childPath}
                  level={level + 1}
                  setDrafts={setDrafts}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function NorthStarMetricsForm({ project, metrics, projectSlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nsmLabel, setNsmLabel] = useState(project.nsm_label);
  const [nsmDescription, setNsmDescription] = useState(project.nsm_description ?? "");
  const [drafts, setDrafts] = useState<MetricDraft[]>(() =>
    metrics.length ? flatToDrafts(metrics) : [newMetricDraft()]
  );
  const draftsRef = useRef(drafts);
  const existingIdsRef = useRef(metrics.map((m) => m.id));

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    existingIdsRef.current = metrics.map((m) => m.id);
  }, [metrics]);

  function updateMain(index: number, patch: Partial<MetricDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function addMain() {
    setDrafts((prev) => [...prev, newMetricDraft()]);
  }

  function removeMain(index: number) {
    setDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function moveMain(index: number, dir: -1 | 1) {
    setDrafts((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const tree = structuredClone(draftsRef.current);

    const result = await saveNorthStarMetricsAction(
      project.id,
      projectSlug,
      nsmLabel,
      nsmDescription,
      tree,
      existingIdsRef.current
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(`/projects/${projectSlug}/nsm`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="sttns-card border-l-4 border-l-emerald-500">
        <div className="flex items-center gap-1.5">
          <h3 className="font-display text-lg font-bold">North Star Metric</h3>
          <SttnsContextHelp {...PAGE_CONTEXT_HELP.nsmLevel1} />
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label className="sttns-label" htmlFor="nsm-label">
              NSM label
            </label>
            <input
              id="nsm-label"
              className="sttns-input"
              value={nsmLabel}
              onChange={(e) => setNsmLabel(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="sttns-label" htmlFor="nsm-desc">
              Description / alignment rule
            </label>
            <textarea
              id="nsm-desc"
              className="sttns-input min-h-[80px]"
              value={nsmDescription}
              onChange={(e) => setNsmDescription(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="sttns-card border-l-4 border-l-emerald-500">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-lg font-bold">Impact Metrics</h3>
              <SttnsContextHelp {...PAGE_CONTEXT_HELP.nsmLevel2} />
            </div>
          </div>
          <button type="button" onClick={addMain} className="sttns-btn-secondary text-sm">
            <Plus className="h-4 w-4" />
            Main metric
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {drafts.map((main, mi) => (
            <div
              key={main.key}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                  Main metric {mi + 1}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveMain(mi, -1)}
                    disabled={mi === 0}
                    className="rounded p-1 text-slate-500 hover:bg-white disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMain(mi, 1)}
                    disabled={mi === drafts.length - 1}
                    className="rounded p-1 text-slate-500 hover:bg-white disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMain(mi)}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="sttns-label">Name</label>
                  <input
                    className="sttns-input"
                    value={main.name}
                    onChange={(e) => updateMain(mi, { name: e.target.value })}
                    placeholder="E.g. Breadth, Conversion rate…"
                  />
                </div>
                <div>
                  <label className="sttns-label">Description / measure</label>
                  <textarea
                    className="sttns-input min-h-[72px]"
                    value={main.description}
                    onChange={(e) => updateMain(mi, { description: e.target.value })}
                    placeholder="How this metric is measured for this project…"
                  />
                </div>
              </div>

              <SubMetricsEditor
                drafts={drafts}
                parentPath={[mi]}
                level={3}
                setDrafts={setDrafts}
              />
            </div>
          ))}
        </div>
      </section>

      <button type="submit" disabled={loading} className="sttns-btn-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </button>
    </form>
  );
}
