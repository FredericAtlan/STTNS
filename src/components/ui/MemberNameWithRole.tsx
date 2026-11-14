import type { SttnsProjectMember } from "@/types/sttns";
import { PROJECT_ROLE_LABELS, primaryRoleForMember } from "@/lib/sttns/governance";
import { cn } from "@/lib/utils";

export function memberRolesLabel(
  members: Pick<SttnsProjectMember, "user_id" | "role">[],
  userId: string
): string | null {
  const roles = members.filter((m) => m.user_id === userId).map((m) => m.role);
  if (!roles.length) return null;
  const unique = Array.from(new Set(roles.map((r) => PROJECT_ROLE_LABELS[r] ?? r)));
  return unique.join(" · ");
}

export function memberPrimaryRoleLabel(
  members: Pick<SttnsProjectMember, "user_id" | "role">[],
  userId: string
): string | null {
  const roles = members.filter((m) => m.user_id === userId).map((m) => m.role);
  if (!roles.length) return null;
  return primaryRoleForMember(roles);
}

export function MemberNameWithRole({
  name,
  userId,
  members,
  className,
  roleClassName,
}: {
  name: string;
  userId: string;
  members: Pick<SttnsProjectMember, "user_id" | "role">[];
  className?: string;
  roleClassName?: string;
}) {
  const role = memberRolesLabel(members, userId);
  return (
    <span className={className}>
      {name}
      {role && (
        <span className={cn("font-normal text-sttns-muted", roleClassName)}> ({role})</span>
      )}
    </span>
  );
}
