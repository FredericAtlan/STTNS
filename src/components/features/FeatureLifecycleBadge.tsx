import type { SttnsFeatureLifecycleStatus } from "@/types/sttns";
import { LIFECYCLE_STATUS_LABELS } from "@/lib/sttns/releases";
import { cn } from "@/lib/utils";

const STYLES: Record<SttnsFeatureLifecycleStatus, string> = {
  planned: "border-zinc-200 bg-zinc-50 text-zinc-700",
  live: "border-emerald-200 bg-emerald-50 text-emerald-900",
  deprecated: "border-zinc-200 bg-zinc-100 text-zinc-500 line-through",
};

export function FeatureLifecycleBadge({
  status,
  className,
}: {
  status: SttnsFeatureLifecycleStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        STYLES[status],
        className
      )}
    >
      {LIFECYCLE_STATUS_LABELS[status]}
    </span>
  );
}
