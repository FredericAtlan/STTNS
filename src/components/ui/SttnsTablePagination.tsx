"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type SttnsPageSize = 5 | 10 | 20;

const PAGE_SIZE_OPTIONS: SttnsPageSize[] = [5, 10, 20];

type Props = {
  page: number;
  pageSize: SttnsPageSize;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: SttnsPageSize) => void;
  className?: string;
};

export function SttnsTablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  className,
}: Props) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Par page
        </span>
        <div className="inline-flex rounded-md border border-zinc-200 p-0.5">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onPageSizeChange(size)}
              className={cn(
                "min-w-[2rem] rounded px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors",
                pageSize === size
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-zinc-500 hover:bg-zinc-50"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <span className="tabular-nums text-zinc-500">
        {totalItems === 0 ? "0 résultat" : `${pageStart}–${pageEnd} sur ${totalItems}`}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[4rem] text-center tabular-nums text-[11px] font-semibold text-zinc-600">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
