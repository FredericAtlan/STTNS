import type { SttnsSquadProjectRole } from "@/types/sttns";
import { SQUAD_ROLE_BADGE_CLASS, SQUAD_ROLE_LABELS } from "@/lib/sttns/squadRoles";
import { cn } from "@/lib/utils";

export function SquadRoleBadge({
  role,
  className,
}: {
  role: SttnsSquadProjectRole;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        SQUAD_ROLE_BADGE_CLASS[role],
        className
      )}
    >
      {SQUAD_ROLE_LABELS[role]}
    </span>
  );
}
