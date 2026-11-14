"use client";

import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";
import {
  iconSizeClass,
  tableColumnTooltip,
  type IconVocabEntry,
} from "@/lib/sttns/iconVocabulary";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type IconHeaderProps = {
  icon: LucideIcon;
  /** Libellé court (accessibilité) */
  tip: string;
  /** Description affichée au survol — par défaut = tip */
  description?: string;
  placement?: "top" | "bottom" | "right" | "left";
};

export function SttnsIconHeader({
  icon: Icon,
  tip,
  description,
  placement = "bottom",
}: IconHeaderProps) {
  const hoverText = description ?? tip;
  const multiline = hoverText.length > 36;

  return (
    <SttnsIconTip label={hoverText} placement={placement} multiline={multiline}>
      <span
        className="inline-flex items-center justify-center"
        aria-label={tip}
        title={hoverText}
      >
        <Icon className={cn(iconSizeClass("xs"), "text-zinc-400")} />
      </span>
    </SttnsIconTip>
  );
}

/** En-tête texte + icône : l'icône affiche la description au survol. */
export function SttnsTableTextHeader({
  icon: Icon,
  label,
  description,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
}) {
  const hoverText = description ?? label;
  const multiline = hoverText.length > 36;

  return (
    <span className="inline-flex items-center gap-1 normal-case tracking-normal text-zinc-600">
      <SttnsIconTip label={hoverText} placement="bottom" multiline={multiline}>
        <span className="inline-flex shrink-0" aria-hidden title={hoverText}>
          <Icon className={cn(iconSizeClass("xs"), "text-zinc-400")} />
        </span>
      </SttnsIconTip>
      {label}
    </span>
  );
}

/** En-tête icône seule à partir du vocabulaire colonnes. */
export function SttnsTableColumnHeader({
  column,
  placement = "bottom",
}: {
  column: IconVocabEntry;
  placement?: "top" | "bottom" | "right" | "left";
}) {
  return (
    <SttnsIconHeader
      icon={column.icon}
      tip={column.label}
      description={tableColumnTooltip(column)}
      placement={placement}
    />
  );
}

export type SttnsDataColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

type Props<T extends { id: string }> = {
  columns: SttnsDataColumn<T>[];
  rows: T[];
  emptyMessage?: ReactNode;
  getRowHref?: (row: T) => string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string | undefined;
};

export function SttnsDataTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage = "Aucun élément.",
  getRowHref,
  onRowClick,
  getRowClassName,
}: Props<T>) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-zinc-200 bg-white px-4 py-10 text-center text-xs text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="sttns-scroll-x">
        <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={cn(
                  "relative z-20 h-9 overflow-visible px-3 text-[10px] font-semibold uppercase tracking-wide text-zinc-500",
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "h-9 transition-colors hover:bg-emerald-50/40",
                (getRowHref || onRowClick) && "cursor-pointer",
                getRowClassName?.(row)
              )}
              onClick={
                onRowClick
                  ? () => onRowClick(row)
                  : getRowHref
                    ? () => {
                        router.push(getRowHref(row));
                      }
                    : undefined
              }
            >
              {columns.map((col) => (
                <td
                  key={col.id}
                  className={cn("max-w-[280px] truncate px-3 py-1.5 text-zinc-800", col.className)}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
