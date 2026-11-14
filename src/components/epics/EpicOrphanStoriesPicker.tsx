"use client";

import { cn } from "@/lib/utils";

import type { ImpactCategoryKey } from "@/lib/userStories/userStoryHealth";

export type EpicStoryPickRow = {
  id: string;
  title: string;
  contextLabel: string | null;
  personaId: string | null;
  personaName: string | null;
  personaCode: string | null;
  tierCode: string | null;
  jtbdLabel: string | null;
  jtbdClientKey: string | null;
  impactCategory: ImpactCategoryKey | null;
  storyCode: string | null;
  isOrphan: boolean;
};

export function EpicOrphanStoriesPicker({
  rows,
  selectedIds,
  onChange,
  disabled,
}: {
  rows: EpicStoryPickRow[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const orphanRows = rows.filter((row) => row.isOrphan);
  const linkedRows = rows.filter((row) => !row.isOrphan);

  function toggle(id: string) {
    if (disabled) return;
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
        Aucune user story disponible. Capturez d&apos;abord des récits terrain (Adja, Yao, Laura).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {orphanRows.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500">
            🚨 Stories orphelines · sans epic
          </p>
          <ul className="space-y-2">
            {orphanRows.map((row) => (
              <StoryPickCard
                key={row.id}
                row={row}
                checked={selectedIds.includes(row.id)}
                onToggle={() => toggle(row.id)}
                disabled={disabled}
                orphan
              />
            ))}
          </ul>
        </div>
      )}

      {linkedRows.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Déjà rattachées à cette epic
          </p>
          <ul className="space-y-2">
            {linkedRows.map((row) => (
              <StoryPickCard
                key={row.id}
                row={row}
                checked={selectedIds.includes(row.id)}
                onToggle={() => toggle(row.id)}
                disabled={disabled}
              />
            ))}
          </ul>
        </div>
      )}

      {orphanRows.length === 0 && linkedRows.length > 0 && (
        <p className="text-xs text-emerald-700">
          Aucune story orpheline — sélectionnez ci-dessus pour ajuster le rattachement.
        </p>
      )}
    </div>
  );
}

function StoryPickCard({
  row,
  checked,
  onToggle,
  disabled,
  orphan,
}: {
  row: EpicStoryPickRow;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  orphan?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all",
          checked
            ? "border-emerald-300 bg-emerald-50/80 shadow-sm"
            : orphan
              ? "border-rose-100 bg-white hover:border-rose-200"
              : "border-slate-100 bg-white hover:border-slate-200",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs",
            checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"
          )}
          aria-hidden
        >
          {checked ? "✓" : ""}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            {row.storyCode && (
              <span className="font-mono text-[10px] font-bold text-slate-500">{row.storyCode}</span>
            )}
            {row.personaName && (
              <span className="text-[10px] font-medium text-emerald-800">{row.personaName}</span>
            )}
          </span>
          <span className="mt-0.5 block text-sm font-medium text-slate-800">{row.title}</span>
          {row.contextLabel && (
            <span className="mt-0.5 block truncate text-xs text-slate-500">{row.contextLabel}</span>
          )}
        </span>
      </button>
    </li>
  );
}
