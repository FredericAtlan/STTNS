"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import {
  updateStoryAssignmentAction,
  type StoryTaskProjectMember,
} from "@/app/projects/[slug]/user-stories/actions";
import { memberInitialsFromNames } from "@/lib/sttns/memberDisplay";
import { TaskAssigneeBadge } from "@/components/execution/TaskAssigneeBadge";
import { cn } from "@/lib/utils";

function memberDisplayName(member: StoryTaskProjectMember): string {
  return member.full_name?.trim() || member.email?.split("@")[0] || "Membre";
}

function memberInitials(member: StoryTaskProjectMember): string {
  return memberInitialsFromNames(member.full_name, member.email);
}

interface Props {
  storyId: string;
  assigneeId: string | null;
  projectSlug: string;
  projectMembers: StoryTaskProjectMember[];
  readOnly?: boolean;
  size?: "xs" | "sm";
  onAssigned?: (assigneeId: string | null) => void;
  className?: string;
}

export function StoryAssigneePicker({
  storyId,
  assigneeId,
  projectSlug,
  projectMembers,
  readOnly = false,
  size = "sm",
  onAssigned,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [currentAssigneeId, setCurrentAssigneeId] = useState(assigneeId);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentAssigneeId(assigneeId);
  }, [assigneeId]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const assignee = currentAssigneeId
    ? projectMembers.find((m) => m.user_id === currentAssigneeId) ?? null
    : null;

  async function handleSelect(nextAssigneeId: string | null) {
    if (readOnly || busy) return;
    setBusy(true);
    setOpen(false);

    const result = await updateStoryAssignmentAction(storyId, nextAssigneeId, projectSlug);
    setBusy(false);

    if (result.ok) {
      setCurrentAssigneeId(nextAssigneeId);
      onAssigned?.(nextAssigneeId);
    }
  }

  if (readOnly) {
    return (
      <TaskAssigneeBadge
        assigneeId={currentAssigneeId}
        members={projectMembers}
        size={size}
        className={className}
      />
    );
  }

  const label = assignee ? memberDisplayName(assignee) : "Non assigné";
  const dim = size === "xs" ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[10px]";

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={label}
        aria-label={`Assigner la story — ${label}`}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition",
          busy && "opacity-60"
        )}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        ) : assignee ? (
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 font-bold uppercase tracking-tight text-emerald-900",
              dim
            )}
          >
            {memberInitials(assignee)}
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 hover:border-zinc-400 hover:bg-zinc-100",
              dim
            )}
          >
            <UserPlus className={size === "xs" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} aria-hidden />
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Assigner la story
          </p>
          {projectMembers.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500">Aucun membre sur le projet.</p>
          ) : (
            projectMembers.map((member) => (
              <button
                key={member.user_id}
                type="button"
                onClick={() => void handleSelect(member.user_id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50",
                  member.user_id === currentAssigneeId && "bg-emerald-50/80"
                )}
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500 bg-emerald-50 text-[9px] font-bold uppercase text-emerald-900">
                  {memberInitials(member)}
                </span>
                <span className="truncate">{memberDisplayName(member)}</span>
              </button>
            ))
          )}
          {currentAssigneeId && (
            <>
              <div className="my-1 border-t border-zinc-100" />
              <button
                type="button"
                onClick={() => void handleSelect(null)}
                className="w-full px-3 py-2 text-left text-xs text-zinc-500 hover:bg-zinc-50"
              >
                Retirer l&apos;assignation
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
