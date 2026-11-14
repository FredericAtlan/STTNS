"use client";

import { ChevronRight } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { cn } from "@/lib/utils";

export type SpineBreadcrumbItem = {
  id: string;
  label: string;
  kind: "epic" | "feature" | "story" | "label";
};

interface Props {
  items: SpineBreadcrumbItem[];
  onNavigate?: (item: SpineBreadcrumbItem, index: number) => void;
  className?: string;
}

/** Fil d'Ariane Spine — clic sur un segment ancêtre pour remonter. */
export function SpineBreadcrumb({ items, onNavigate, className }: Props) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Fil d'Ariane Spine"
      className={cn("flex flex-wrap items-center gap-1 text-xs text-zinc-500", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const canClick = !isLast && item.kind !== "label" && !!onNavigate;
        return (
          <span key={`${item.kind}-${item.id}`} className="inline-flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-zinc-300" />}
            {canClick ? (
              <button
                type="button"
                onClick={() => onNavigate?.(item, index)}
                className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-medium text-zinc-600 hover:bg-zinc-100 hover:text-emerald-700"
              >
                {item.kind !== "label" && (
                  <SpineObjectIcon type={item.kind} className="h-3 w-3" />
                )}
                <span className="max-w-[140px] truncate">{item.label}</span>
              </button>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1 py-0.5",
                  isLast ? "font-semibold text-zinc-800" : "text-zinc-500"
                )}
              >
                {item.kind !== "label" && (
                  <SpineObjectIcon type={item.kind} className="h-3 w-3" />
                )}
                <span className="max-w-[160px] truncate">{item.label}</span>
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
