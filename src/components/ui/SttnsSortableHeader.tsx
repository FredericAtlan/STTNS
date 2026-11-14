"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type SttnsSortDir = "asc" | "desc";

type Props = {
  label: ReactNode;
  sortKey: string;
  activeKey: string | null;
  dir: SttnsSortDir;
  onSort: (key: string) => void;
  className?: string;
};

export function SttnsSortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className,
}: Props) {
  const active = activeKey === sortKey;
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1 rounded px-0.5 text-left transition-colors hover:text-zinc-800",
        active ? "text-zinc-800" : "text-zinc-500",
        className
      )}
    >
      <span>{label}</span>
      <Icon className={cn("h-3 w-3 shrink-0", active ? "text-emerald-700" : "text-zinc-400")} />
    </button>
  );
}
