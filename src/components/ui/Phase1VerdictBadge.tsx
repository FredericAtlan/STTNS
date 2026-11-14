import { PHASE1_VERDICT_LABELS, parsePhase1Status } from "@/lib/sttns/arbitrage";
import { cn } from "@/lib/utils";

const STYLES = {
  kill: "bg-red-100 text-red-800 border-red-200",
  ok_phase2: "bg-emerald-100 text-emerald-800 border-emerald-200",
  expert_review: "bg-orange-100 text-orange-800 border-orange-200",
};

export function Phase1VerdictBadge({
  phase1Status,
  className,
}: {
  phase1Status: string | null | undefined;
  className?: string;
}) {
  const verdict = parsePhase1Status(phase1Status);
  if (!verdict) {
    return (
      <span
        className={cn(
          "inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold uppercase",
          className
        )}
      >
        Pending
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase",
        STYLES[verdict],
        className
      )}
    >
      {PHASE1_VERDICT_LABELS[verdict]}
    </span>
  );
}
