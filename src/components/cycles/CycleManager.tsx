"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { CycleCreateSlideOver } from "@/components/cycles/CycleCreateSlideOver";
import { SttnsModal } from "@/components/ui/SttnsModal";
import { archiveCycleAction } from "@/app/projects/[slug]/cycles/actions";
import {
  cycleStatusClass,
  cycleStatusLabel,
  formatCycleDate,
  type CycleRow,
} from "@/lib/sttns/cycles";
import { executionCycleHref } from "@/lib/sttns/executionNav";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  projectSlug: string;
  cycles: CycleRow[];
  defaultCycleWeeks: number;
  featureExecutionMode?: boolean;
  epicEqualsCycle?: boolean;
}

function CycleStatusBadge({ cycle }: { cycle: Pick<CycleRow, "status"> }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-none tracking-wide",
        cycleStatusClass(cycle.status)
      )}
    >
      {cycleStatusLabel(cycle.status)}
    </span>
  );
}

export function CycleManager({
  projectId,
  projectSlug,
  cycles,
  defaultCycleWeeks,
  featureExecutionMode = false,
  epicEqualsCycle = false,
}: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<CycleRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CycleRow | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  function openCreateForm() {
    setEditingCycle(null);
    setFormOpen(true);
  }

  function openEditForm(cycle: CycleRow) {
    setEditingCycle(cycle);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCycle(null);
  }

  const openCycles = cycles.filter((c) => c.is_active);
  const closedCycles = cycles.filter((c) => !c.is_active);

  function cycleHref(cycleId: string) {
    return executionCycleHref(projectSlug, cycleId, {
      executionUnit: featureExecutionMode ? "feature" : "story",
    });
  }

  function requestArchive(cycle: CycleRow) {
    setError(null);
    setArchiveTarget(cycle);
  }

  function cancelArchive() {
    if (isArchiving) return;
    setArchiveTarget(null);
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    setIsArchiving(true);
    setError(null);
    const result = await archiveCycleAction(
      archiveTarget.id,
      projectId,
      projectSlug
    );
    setIsArchiving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setArchiveTarget(null);
    router.refresh();
  }

  const archiveTargetLabel = featureExecutionMode ? "features" : "stories";

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            {cycles.length} cycle{cycles.length !== 1 ? "s" : ""} · assignables aux{" "}
            {featureExecutionMode ? "features (Kanban)" : "stories du backlog"}
            {epicEqualsCycle ? " · epic lié à chaque cycle" : ""}
          </p>
          <button
            type="button"
            onClick={openCreateForm}
            className="sttns-btn-primary sttns-btn-md"
          >
            <Plus className="h-4 w-4" />
            Nouveau cycle
          </button>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {cycles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <SpineObjectIcon type="cycle" size="md" className="mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-800">Aucun cycle pour ce projet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Créez un sprint pour assigner vos{" "}
              {featureExecutionMode ? "features depuis le Kanban" : "stories depuis le backlog"}.
            </p>
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 sttns-btn-primary sttns-btn-md"
            >
              <Plus className="h-4 w-4" />
              Nouveau cycle
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="sttns-scroll-x">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50/90">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Cycle
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Début
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Fin
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Capacité
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {openCycles.map((cycle) => (
                    <tr key={cycle.id} className="hover:bg-emerald-50/30">
                      <td className="px-4 py-3">
                        <Link
                          href={cycleHref(cycle.id)}
                          className="flex items-center gap-2 font-medium text-zinc-900 hover:text-emerald-700 hover:underline"
                        >
                          <SpineObjectIcon type="cycle" size="xs" />
                          {cycle.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{formatCycleDate(cycle.start_date)}</td>
                      <td className="px-4 py-3 text-zinc-600">{formatCycleDate(cycle.end_date)}</td>
                      <td className="px-4 py-3 text-zinc-600">{cycle.capacity_points}j</td>
                      <td className="px-4 py-3">
                        <CycleStatusBadge cycle={cycle} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => openEditForm(cycle)}
                            className="rounded p-1.5 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-700"
                            title="Modifier le cycle"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {cycle.is_active && (
                            <button
                              type="button"
                              onClick={() => requestArchive(cycle)}
                              className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                              title="Clôturer le cycle"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {closedCycles.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-zinc-200">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Cycles clôturés ({closedCycles.length})
            </h3>
            <ul className="space-y-2 opacity-75">
              {closedCycles.map((cycle) => (
                <li
                  key={cycle.id}
                  className="flex items-center justify-between rounded border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm"
                >
                  <Link
                    href={cycleHref(cycle.id)}
                    className="flex items-center gap-2 text-zinc-600 hover:text-emerald-700 hover:underline"
                  >
                    <SpineObjectIcon type="cycle" size="xs" colored={false} />
                    {cycle.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(cycle)}
                      className="rounded p-1.5 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-700"
                      title="Modifier le cycle"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <CycleStatusBadge cycle={cycle} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <CycleCreateSlideOver
        open={formOpen}
        projectId={projectId}
        projectSlug={projectSlug}
        defaultCycleWeeks={defaultCycleWeeks}
        cycle={editingCycle}
        onClose={closeForm}
        onSuccess={() => router.refresh()}
      />

      <SttnsModal
        open={!!archiveTarget}
        onClose={cancelArchive}
        title="Clôturer le cycle ?"
        preventClose={isArchiving}
        footer={
          <>
            <button
              type="button"
              onClick={cancelArchive}
              disabled={isArchiving}
              className="sttns-btn-secondary sttns-btn-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void confirmArchive()}
              disabled={isArchiving}
              className="sttns-btn-destructive sttns-btn-sm"
            >
              {isArchiving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Clôture en cours…
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Clôturer
                </>
              )}
            </button>
          </>
        }
      >
        {archiveTarget && (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Le cycle <strong className="text-foreground">« {archiveTarget.name} »</strong>{" "}
              sera clôturé et ne pourra plus être assigné aux {archiveTargetLabel}.
            </p>
            <p>
              Les {archiveTargetLabel} actuellement rattachés seront{" "}
              <strong className="text-foreground">détachés du cycle</strong> (retour au
              backlog).
            </p>
            {epicEqualsCycle && (
              <p className="rounded border border-warning/30 bg-warning/5 p-2 text-xs text-warning">
                Mode Shape Up : l&apos;epic lié à ce cycle sera également archivé.
              </p>
            )}
          </div>
        )}
      </SttnsModal>
    </>
  );
}
