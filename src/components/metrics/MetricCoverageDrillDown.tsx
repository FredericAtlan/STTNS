"use client";

import Link from "next/link";
import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import type { NsmCoverageBundle } from "@/lib/metrics/nsmCoverage";

export type MetricCoverageDrillDownState =
  | {
      open: true;
      metricLabel: string;
      kind: "epics" | "stories";
      ids: string[];
    }
  | { open: false };

interface Props {
  state: MetricCoverageDrillDownState;
  onClose: () => void;
  projectSlug: string;
  bundle: NsmCoverageBundle;
}

export function MetricCoverageDrillDown({ state, onClose, projectSlug, bundle }: Props) {
  if (!state.open) return null;

  const isEpics = state.kind === "epics";
  const title = isEpics ? "Epics couvrant cette métrique" : "User stories couvrant cette métrique";
  const items = state.ids
    .map((id) => (isEpics ? bundle.epicsById[id] : bundle.storiesById[id]))
    .filter(Boolean);

  return (
    <SttnsSlideOver
      open
      onClose={onClose}
      eyebrow={state.metricLabel}
      title={title}
      size="sm"
      ariaLabelClose="Fermer le détail de couverture"
    >
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Aucun élément dans ce périmètre.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const href = isEpics
              ? `/projects/${projectSlug}/epics/${item!.id}`
              : `/projects/${projectSlug}/user-stories/${item!.id}`;
            const story = !isEpics
              ? bundle.storiesById[item!.id]
              : null;
            const epicTitle = isEpics ? item!.title : null;

            return (
              <li key={item!.id}>
                <Link
                  href={href}
                  onClick={onClose}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm transition hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  <span className="mt-0.5">
                    <SpineObjectIcon type={isEpics ? "epic" : "story"} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-900">
                      {isEpics ? epicTitle : item!.title}
                    </span>
                    {!isEpics && story?.context_label && (
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {story.context_label}
                      </span>
                    )}
                    {!isEpics && story && !story.epic_id && (
                      <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        Sans epic
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Stories comptées : statut validé, en sprint ou livré. Remontée parent incluse pour les
        sous-métriques.
      </p>
    </SttnsSlideOver>
  );
}
