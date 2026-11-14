"use client";

import { useEffect, useState } from "react";
import {
  fetchProjectSquadMembersAction,
  type ProjectSquadMemberPreview,
} from "@/app/projects/actions";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 5;

interface Props {
  projectId: string;
  members?: ProjectSquadMemberPreview[];
  /** Masque le libellé « Squad » (barre d'en-tête). */
  compact?: boolean;
  className?: string;
}

export function ProjectSquadStrip({ projectId, members: initialMembers, compact = false, className }: Props) {
  const [members, setMembers] = useState<ProjectSquadMemberPreview[]>(initialMembers ?? []);
  const [loaded, setLoaded] = useState(Boolean(initialMembers?.length));

  useEffect(() => {
    if (initialMembers !== undefined) {
      setMembers(initialMembers);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    void fetchProjectSquadMembersAction(projectId).then((result) => {
      if (cancelled) return;
      if (result.ok) setMembers(result.members);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [projectId, initialMembers]);

  if (!loaded && !compact) {
    return (
      <div className={cn("flex items-center gap-1.5", className)} aria-hidden>
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "inline-flex shrink-0 rounded-full border-2 border-white bg-zinc-100",
              compact ? "h-6 w-6" : "h-6 w-6",
              i > 0 && "-ml-1.5"
            )}
          />
        ))}
      </div>
    );
  }

  if (members.length === 0) return null;

  const visible = members.slice(0, MAX_VISIBLE);
  const overflow = members.length - visible.length;

  return (
    <div
      className={cn("flex min-w-0 shrink-0 items-center gap-1.5", className)}
      aria-label={`Squad du projet, ${members.length} membre${members.length > 1 ? "s" : ""}`}
    >
      {!compact && (
        <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">
          Squad
        </span>
      )}
      <div className="flex min-w-0 items-center">
        {visible.map((member, index) => (
          <MemberAvatar
            key={member.user_id}
            member={member}
            size="sm"
            className={cn(index > 0 && "-ml-1.5")}
            style={{ zIndex: visible.length - index }}
          />
        ))}
        {overflow > 0 && (
          <span
            className="-ml-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-[9px] font-bold text-zinc-600 shadow-sm"
            title={`${overflow} autre${overflow > 1 ? "s" : ""} membre${overflow > 1 ? "s" : ""}`}
          >
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}
