import { EPIC_STATUS_LABELS } from "@/lib/sttns/epics";
import { EPIC_STATUS_BADGE } from "@/lib/sttns/epicCatalog";
import type { SttnsEpicStatus } from "@/types/sttns";
import { cn } from "@/lib/utils";

export function SttnsEpicStatusBadge({
  status,
  className,
}: {
  status: SttnsEpicStatus;
  className?: string;
}) {
  const label = EPIC_STATUS_LABELS[status] ?? status;
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        EPIC_STATUS_BADGE[status] ?? EPIC_STATUS_BADGE.draft,
        className
      )}
    >
      {label}
    </span>
  );
}
