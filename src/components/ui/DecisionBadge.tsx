import type { SttnsDecision } from "@/types/sttns";
import { DECISION_COLORS, DECISION_LABELS } from "@/lib/sttns/constants";
import { cn } from "@/lib/utils";

export function DecisionBadge({
  decision,
  className,
}: {
  decision: SttnsDecision | null;
  className?: string;
}) {
  if (!decision) {
    return (
      <span
        className={cn(
          "inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold uppercase",
          className
        )}
      >
        En attente
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase",
        DECISION_COLORS[decision],
        className
      )}
    >
      {DECISION_LABELS[decision]}
    </span>
  );
}
