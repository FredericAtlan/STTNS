import type { CSSProperties } from "react";
import { profileDisplayName, profileInitials } from "@/lib/sttns/memberDisplay";
import type { SttnsProfile } from "@/types/sttns";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface Props {
  profile: SttnsProfile | null | undefined;
  size?: "sm" | "md";
  /** Pilote feature vs responsable sous-étape. */
  emphasis?: "primary" | "part" | "default";
  className?: string;
  style?: CSSProperties;
}

export function AssigneeInitials({
  profile,
  size = "sm",
  emphasis = "default",
  className,
  style,
}: Props) {
  const assigned = Boolean(profile);
  const label = profileDisplayName(profile);
  const initials = profileInitials(profile);

  return (
    <span
      title={label}
      aria-label={assigned ? `Assigné à ${label}` : "Non assigné"}
      style={style}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 font-bold uppercase tracking-tight shadow-sm",
        size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs",
        !assigned && "border-dashed border-zinc-300 bg-zinc-50 text-zinc-400",
        assigned &&
          emphasis === "primary" &&
          "border-emerald-700 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200/80",
        assigned &&
          emphasis === "part" &&
          "border-orange-400/90 bg-orange-50/90 text-orange-950",
        assigned &&
          emphasis === "default" &&
          "border-emerald-500 bg-emerald-50 text-emerald-900",
        className
      )}
    >
      {assigned ? (
        initials
      ) : (
        <User
          className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")}
          aria-hidden
        />
      )}
    </span>
  );
}
