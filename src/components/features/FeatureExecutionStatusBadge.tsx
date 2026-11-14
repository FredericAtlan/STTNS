import {
  EXECUTION_STATUS_BADGE_CLASS,
  EXECUTION_STATUS_LABELS,
} from "@/lib/sttns/constants";
import type { SttnsInitiativeExecutionStatus } from "@/types/sttns";
import { cn } from "@/lib/utils";

export function FeatureExecutionStatusBadge({
  status,
  compact = false,
  className,
}: {
  status: SttnsInitiativeExecutionStatus | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  const key = (status ?? "pending") as SttnsInitiativeExecutionStatus;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        EXECUTION_STATUS_BADGE_CLASS[key],
        compact && "text-[9px]",
        className
      )}
    >
      {EXECUTION_STATUS_LABELS[key]}
    </span>
  );
}
