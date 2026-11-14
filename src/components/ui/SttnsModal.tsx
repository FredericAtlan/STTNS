"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { STTNS_OVERLAY_SCRIM } from "@/components/ui/SttnsSlideOver";

export type SttnsModalSize = "sm" | "md";

const SIZE_CLASS: Record<SttnsModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
};

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** sm = max-w-sm · md = max-w-md (défaut) */
  size?: SttnsModalSize;
  eyebrow?: string;
  /** Pied d'actions optionnel (boutons) */
  footer?: ReactNode;
  /** Empêche la fermeture scrim / Esc (ex. opération en cours) */
  preventClose?: boolean;
  ariaLabelClose?: string;
  className?: string;
}

/**
 * Modal centré clinique — z-[70] (au-dessus des Slide-overs z-[60]).
 * Fermeture : Esc + clic scrim (sauf `preventClose`).
 */
export function SttnsModal({
  open,
  onClose,
  title,
  children,
  size = "md",
  eyebrow,
  footer,
  preventClose = false,
  ariaLabelClose = "Fermer",
  className,
}: Props) {
  useEffect(() => {
    if (!open || preventClose) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, preventClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
      data-sttns-overlay="modal"
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 animate-in fade-in duration-200",
          STTNS_OVERLAY_SCRIM
        )}
        aria-label={ariaLabelClose}
        onClick={preventClose ? undefined : onClose}
        disabled={preventClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        data-sttns-overlay="modal"
        aria-labelledby="sttns-modal-title"
        className={cn(
          "relative z-10 w-full rounded-xl border border-border bg-background shadow-elevated",
          "animate-in fade-in zoom-in-95 duration-200",
          SIZE_CLASS[size],
          className
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
              id="sttns-modal-title"
              className={cn("text-lg font-bold text-foreground", eyebrow && "mt-1")}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm shrink-0"
            onClick={onClose}
            disabled={preventClose}
            aria-label={ariaLabelClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
