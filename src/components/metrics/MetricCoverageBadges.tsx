"use client";

import { cn } from "@/lib/utils";

export type MetricCoverageBadgeCorner = "left" | "right";

interface Props {
  epicCount: number;
  storyCount: number;
  corner: MetricCoverageBadgeCorner;
  metricLabel: string;
  onEpicClick: () => void;
  onStoryClick: () => void;
  className?: string;
}

function CoverageCircle({
  prefix,
  count,
  label,
  onClick,
  empty,
}: {
  prefix: "E" | "U";
  count: number;
  label: string;
  onClick: () => void;
  empty: boolean;
}) {
  const display = count > 99 ? "99+" : String(count);

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${prefix}${display} · ${label} — voir le détail`}
      className={cn(
        "flex h-8 min-w-8 items-center justify-center rounded-full border px-1.5 text-[10px] font-bold leading-none tabular-nums transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600",
        empty
          ? "border-dashed border-slate-200 bg-slate-50/80 text-slate-400 hover:border-slate-300 hover:bg-white"
          : "border-emerald-200/90 bg-white/95 text-emerald-900 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
      )}
    >
      <span className="sr-only">
        {prefix}
        {display} {label}
      </span>
      <span>
        <span className={cn("font-extrabold", empty ? "text-slate-400" : "text-emerald-700")}>
          {prefix}
        </span>
        <span>{display}</span>
      </span>
    </button>
  );
}

export function MetricCoverageBadges({
  epicCount,
  storyCount,
  corner,
  metricLabel,
  onEpicClick,
  onStoryClick,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "absolute top-3 z-10 flex gap-1",
        corner === "left" ? "left-3" : "right-3",
        className
      )}
      aria-label={`Couverture ${metricLabel}`}
    >
      <CoverageCircle
        prefix="E"
        count={epicCount}
        label="epics"
        onClick={onEpicClick}
        empty={epicCount === 0}
      />
      <CoverageCircle
        prefix="U"
        count={storyCount}
        label="user stories"
        onClick={onStoryClick}
        empty={storyCount === 0}
      />
    </div>
  );
}
