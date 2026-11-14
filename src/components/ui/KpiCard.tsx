"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SttnsContextHelp } from "@/components/ui/SttnsContextHelp";
import type { SttnsContextHelpContent } from "@/components/ui/SttnsContextHelp";
import { motion, useReducedMotion } from "framer-motion";

export function KpiCard({
  icon,
  keyword,
  title,
  help,
  children,
  footer,
  className,
  helpPlacement = "bottom-start",
  helpOffsetClass,
}: {
  icon: ReactNode;
  keyword: string;
  title: string;
  help: SttnsContextHelpContent;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  helpPlacement?: "bottom-start" | "bottom-end";
  helpOffsetClass?: string;
}) {
  return (
    <article
      className={cn(
        "relative z-10 flex flex-col rounded-2xl border border-slate-100/80 bg-white/40 p-5 backdrop-blur-md transition-all duration-500 ease-out hover:z-50 focus-within:z-50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              {keyword}
            </p>
            <h3 className="mt-0.5 font-display text-sm font-light tracking-tight text-slate-800">
              {title}
            </h3>
          </div>
        </div>
        <SttnsContextHelp {...help} placement={helpPlacement} offsetClass={helpOffsetClass} size="sm" />
      </div>
      <div className="mt-4 flex-1">{children}</div>
      {footer && <div className="mt-auto">{footer}</div>}
    </article>
  );
}

export function DynamicBadge({
  tone,
  children,
}: {
  tone: "emerald" | "amber" | "rose" | "slate";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "mt-3 inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-900",
        tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700",
        tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {children}
    </span>
  );
}

export function HealthDonut({ pct }: { pct: number }) {
  const reduceMotion = useReducedMotion();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative mx-auto h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={radius} fill="none" className="stroke-slate-100" strokeWidth="3" />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className="stroke-emerald-500"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduceMotion ? { strokeDashoffset: targetOffset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-light tabular-nums tracking-tight text-slate-800">{pct}%</span>
      </div>
    </div>
  );
}
