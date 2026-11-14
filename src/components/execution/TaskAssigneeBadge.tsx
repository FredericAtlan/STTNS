import { User } from "lucide-react";
import { memberInitialsFromNames } from "@/lib/sttns/memberDisplay";
import { cn } from "@/lib/utils";

type MemberLike = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

function displayName(member: MemberLike): string {
  return member.full_name?.trim() || member.email?.split("@")[0] || "Membre";
}

function initials(member: MemberLike): string {
  return memberInitialsFromNames(member.full_name, member.email);
}

interface Props {
  assigneeId: string | null;
  members: MemberLike[];
  size?: "xs" | "sm";
  className?: string;
}

export function TaskAssigneeBadge({
  assigneeId,
  members,
  size = "sm",
  className,
}: Props) {
  const assignee = assigneeId ? members.find((m) => m.user_id === assigneeId) ?? null : null;
  const dim = size === "xs" ? "h-5 w-5 text-[8px]" : "h-6 w-6 text-[9px]";

  if (!assignee) {
    return (
      <span
        title="Non assigné"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400",
          dim,
          className
        )}
      >
        <User className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} aria-hidden />
      </span>
    );
  }

  return (
    <span
      title={displayName(assignee)}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-emerald-500 bg-emerald-50 font-bold uppercase tracking-tight text-emerald-900",
        dim,
        className
      )}
    >
      {initials(assignee)}
    </span>
  );
}
