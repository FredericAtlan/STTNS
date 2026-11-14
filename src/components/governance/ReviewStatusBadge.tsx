import { REVIEW_STATUS_LABELS } from "@/lib/sttns/governance";
import type { SttnsReviewStatus } from "@/types/sttns";
import { cn } from "@/lib/utils";

const STYLES: Record<SttnsReviewStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  in_review: "bg-blue-100 text-blue-800 border-blue-200",
  validated: "bg-emerald-100 text-emerald-800 border-emerald-200",
  changes_requested: "bg-amber-100 text-amber-800 border-amber-200",
  aligned: "bg-emerald-100 text-emerald-800 border-emerald-200",
  needs_ceo_decision: "bg-orange-100 text-orange-800 border-orange-200",
};

export function ReviewStatusBadge({
  status,
  className,
}: {
  status: SttnsReviewStatus | undefined;
  className?: string;
}) {
  const s = status ?? "draft";
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase",
        STYLES[s],
        className
      )}
    >
      {REVIEW_STATUS_LABELS[s]}
    </span>
  );
}
