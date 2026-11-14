"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Largeurs Slide-over — interdiction des largeurs arbitraires (75vw, etc.). */
export type SttnsSlideOverSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<SttnsSlideOverSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-xl",
  xl: "sm:max-w-2xl",
};

/** Scrim unifié — Slide-over z-[60] (au-dessus header z-50) */
export const STTNS_OVERLAY_SCRIM =
  "bg-zinc-950/40 backdrop-blur-[2px]";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  /** sm=md · md=lg (défaut) · lg=xl · xl=2xl */
  size?: SttnsSlideOverSize;
  /**
   * @deprecated Utiliser `size`. Conservé pour migration ; mappé si fourni.
   */
  maxWidthClass?: string;
  /** zen = volet légèrement translucide (aide contextuelle) */
  variant?: "default" | "zen";
  ariaLabelClose?: string;
}

function resolveSize(
  size: SttnsSlideOverSize | undefined,
  maxWidthClass: string | undefined
): SttnsSlideOverSize {
  if (size) return size;
  if (!maxWidthClass) return "md";
  if (maxWidthClass.includes("max-w-md")) return "sm";
  if (maxWidthClass.includes("max-w-xl")) return "lg";
  if (maxWidthClass.includes("max-w-2xl") || maxWidthClass.includes("75vw")) return "xl";
  return "md";
}

export function SttnsSlideOver({
  open,
  onClose,
  title,
  eyebrow,
  children,
  size,
  maxWidthClass,
  variant = "default",
  ariaLabelClose = "Fermer",
}: Props) {
  const resolved = resolveSize(size, maxWidthClass);
  const isZen = variant === "zen";

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" data-sttns-overlay="slide-over">
      <button
        type="button"
        className={cn(
          "absolute inset-0 animate-in fade-in duration-200",
          STTNS_OVERLAY_SCRIM
        )}
        aria-label={ariaLabelClose}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        data-sttns-overlay="slide-over"
        aria-labelledby="sttns-slide-over-title"
        className={cn(
          "relative z-10 flex w-full flex-col shadow-elevated",
          "max-h-[92vh] sm:max-h-full sm:h-full",
          SIZE_CLASS[resolved],
          "mt-auto rounded-t-2xl border-t border-border sm:mt-0 sm:rounded-none sm:border-l sm:border-t-0",
          "animate-in slide-in-from-right duration-300",
          isZen ? "bg-background/95 backdrop-blur-xl" : "bg-background"
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </p>
            )}
            <h2
              id="sttns-slide-over-title"
              className={cn(
                "text-lg font-bold text-foreground",
                eyebrow && "mt-1"
              )}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm shrink-0"
            onClick={onClose}
            aria-label={ariaLabelClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
