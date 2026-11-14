"use client";

import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";
import { iconSizeClass } from "@/lib/sttns/iconVocabulary";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type SttnsToolbarFilter = {
  id: string;
  icon: LucideIcon;
  tip: string;
  active: boolean;
  count?: number;
  onClick: () => void;
};

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: SttnsToolbarFilter[];
  trailing?: ReactNode;
  resultCount?: number;
  totalCount?: number;
};

export function SttnsDataToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  filters = [],
  trailing,
  resultCount,
  totalCount,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 py-1.5 shadow-sm">
      <div className="relative min-w-[12rem] flex-1">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-md border-0 bg-transparent py-1 pl-7 pr-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
        />
      </div>

      {filters.map((f) => (
        <SttnsIconTip key={f.id} label={f.tip} placement="bottom">
          <button
            type="button"
            onClick={f.onClick}
            aria-label={f.tip}
            aria-pressed={f.active}
            className={cn(
              "relative inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
              f.active
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
            )}
          >
            <f.icon className={iconSizeClass("sm")} />
            {typeof f.count === "number" && f.count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-white">
                {f.count > 99 ? "99+" : f.count}
              </span>
            )}
          </button>
        </SttnsIconTip>
      ))}

      {trailing}

      {typeof resultCount === "number" && typeof totalCount === "number" && (
        <span className="ml-auto tabular-nums text-[10px] font-medium text-zinc-400">
          {resultCount}/{totalCount}
        </span>
      )}
    </div>
  );
}
