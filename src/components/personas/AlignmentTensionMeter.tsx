"use client";

import { motion } from "framer-motion";
import { useId, useState } from "react";
import {
  computeAlignmentTension,
  formatTensionRatio,
  type AlignmentTensionStatus,
} from "@/lib/personas/alignmentTension";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<
  AlignmentTensionStatus,
  { label: string; badge: string; glow: string; border: string }
> = {
  CHIRURGICAL: {
    label: "Chirurgical",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    border: "border-emerald-400",
  },
  "SOUS-SPÉCIFIÉ": {
    label: "Sous-spécifié",
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.45)]",
    border: "border-amber-400",
  },
  SURCHARGE: {
    label: "Surcharge",
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    glow: "shadow-[0_0_15px_rgba(244,63,94,0.45)]",
    border: "border-rose-400",
  },
};

function TensionHelpIcon() {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
        aria-describedby={tooltipId}
        aria-label="Aide : zones de densité"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <span className="text-xs font-serif leading-none">i</span>
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute right-0 top-full z-20 mt-1.5 w-56 rounded-lg border border-slate-200/80 bg-white/80 p-3 text-left shadow-lg backdrop-blur-sm transition-opacity duration-150",
          open ? "opacity-100" : "opacity-0"
        )}
      >
        <p className="text-[11px] font-semibold text-slate-800">Zones de tension</p>
        <ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-slate-600">
          <li>
            <span className="font-semibold text-emerald-700">Chirurgical</span> · 1,0–1,4
          </li>
          <li>
            <span className="font-semibold text-amber-700">Sous-spécifié</span> · &lt;1,0
          </li>
          <li>
            <span className="font-semibold text-rose-700">Surcharge</span> · &gt;1,4
          </li>
        </ul>
      </div>
    </span>
  );
}

interface Props {
  totalPP: number;
  totalJTBD: number;
  className?: string;
  /** Masquer l'icône d'aide si le parent fournit déjà un tooltip. */
  showHelp?: boolean;
  /** Format compact pour les widgets KPI du portefeuille personas. */
  compact?: boolean;
}

export function AlignmentTensionMeter({
  totalPP,
  totalJTBD,
  className,
  showHelp = true,
  compact = false,
}: Props) {
  if (totalPP === 0) {
    return (
      <div className={cn(compact ? "py-1 text-center" : "py-4 text-center", className)}>
        <p className={cn("font-light text-slate-400", compact ? "text-[10px]" : "text-sm")}>
          {compact ? "Sans PP" : "Ajoutez des frictions pour calculer la densité."}
        </p>
      </div>
    );
  }

  const { ratio, status, gaugePercent } = computeAlignmentTension(totalPP, totalJTBD);
  const styles = STATUS_STYLE[status];
  const displayRatio = formatTensionRatio(ratio);

  if (compact) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="relative px-1">
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="absolute inset-y-0 left-0 w-[49%] bg-amber-100/80" aria-hidden />
            <div className="absolute inset-y-0 left-[49%] w-[16%] bg-emerald-100/80" aria-hidden />
            <div className="absolute inset-y-0 left-[65%] right-0 bg-rose-100/80" aria-hidden />
          </div>
          <motion.div
            className={cn(
              "absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white",
              styles.border,
              styles.glow
            )}
            initial={false}
            animate={{ left: `${gaugePercent}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
            aria-hidden
          />
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="truncate font-mono text-[9px] font-medium uppercase tracking-wider text-slate-500">
            {styles.label}
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 rounded-full border px-1.5 py-px font-mono text-[10px] font-semibold tabular-nums",
              styles.badge
            )}
          >
            {displayRatio}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {showHelp ? (
        <div className="flex items-center justify-end">
          <TensionHelpIcon />
        </div>
      ) : null}

      <div className={cn("relative px-2", showHelp ? "pt-1" : "pt-0")}>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="absolute inset-y-0 left-0 w-[49%] bg-amber-100/80" aria-hidden />
          <div className="absolute inset-y-0 left-[49%] w-[16%] bg-emerald-100/80" aria-hidden />
          <div className="absolute inset-y-0 left-[65%] right-0 bg-rose-100/80" aria-hidden />
        </div>

        <motion.div
          className={cn(
            "absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white",
            styles.border,
            styles.glow
          )}
          initial={false}
          animate={{ left: `${gaugePercent}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          aria-hidden
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="font-mono text-xs font-medium uppercase tracking-widest text-slate-600">
          {styles.label}
        </span>
        <span
          className={cn(
            "inline-flex rounded-full border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
            styles.badge
          )}
        >
          {displayRatio}
        </span>
      </div>
    </div>
  );
}
