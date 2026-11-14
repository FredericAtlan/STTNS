"use client";

import { cn } from "@/lib/utils";

/** Statuts Spine officiels (Zod `workItemStatusSchema`) — pas de `blocked`. */
export type SpineStatus = "todo" | "in_progress" | "review" | "done";

/** @deprecated Préférer SpineStatus — alias de migration. */
export type StatusType = SpineStatus | "blocked";

interface Props {
  status: string;
  size?: "sm" | "md";
  className?: string;
  /** Libellé personnalisé (ex. rôles plateforme admin). */
  label?: string;
}

const STYLE: Record<SpineStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-info/10 text-info",
  review: "bg-violet-50 text-violet-700",
  done: "bg-success/10 text-success",
};

const LABEL: Record<SpineStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  review: "En revue",
  done: "Terminé",
};

/** Normalise tout statut legacy / hors schéma vers les 4 statuts Spine. */
export function normalizeSpineStatus(status: string): SpineStatus {
  if (
    status === "todo" ||
    status === "in_progress" ||
    status === "review" ||
    status === "done"
  ) {
    return status;
  }
  return "todo";
}

/**
 * Badge de statut clinique — `rounded-md`, compact, sémantique discrète.
 * `done` = success · `in_progress` = info · reste = muted / violet doux.
 */
export function StatusBadge({ status, size = "sm", className, label }: Props) {
  const normalized = normalizeSpineStatus(status);
  const sizeClass =
    size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-xs";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-semibold leading-none tracking-wide",
        STYLE[normalized],
        sizeClass,
        className
      )}
    >
      {label ?? LABEL[normalized]}
    </span>
  );
}

/** @deprecated Alias — utiliser StatusBadge. */
export const StatusPill = StatusBadge;
