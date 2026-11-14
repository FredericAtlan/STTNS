"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { PainPoint } from "@/lib/personas/personaMatrix.types";
import { cn } from "@/lib/utils";

interface Props {
  painPoints: PainPoint[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function PersonaPainPointMultiSelect({
  painPoints,
  value,
  onChange,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectable = painPoints.filter((p) => p.shortLabel.trim());

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  const summary =
    value.length === 0
      ? "Lier aux frictions…"
      : `${value.length} friction${value.length > 1 ? "s" : ""} liée${value.length > 1 ? "s" : ""}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || selectable.length === 0}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "sttns-input flex w-full items-center justify-between gap-2 text-left text-sm",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span className={value.length === 0 ? "text-zinc-400" : "text-zinc-800"}>
          {selectable.length === 0 ? "Saisissez des frictions d'abord" : summary}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition", open && "rotate-180")} />
      </button>

      {open && selectable.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          {selectable.map((pain) => {
            const checked = value.includes(pain.id);
            return (
              <button
                key={pain.id}
                type="button"
                onClick={() => toggle(pain.id)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-emerald-50"
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    checked
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-zinc-300 bg-white"
                  )}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                <span>
                  <span className="font-semibold text-zinc-900">{pain.shortLabel.trim()}</span>
                  {pain.detail?.trim() && (
                    <span className="mt-0.5 block text-xs text-zinc-500 line-clamp-2">
                      {pain.detail.trim()}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
