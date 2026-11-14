"use client";

import Link from "next/link";
import type { SttnsEpic } from "@/types/sttns";
import { EmptyStateCoach } from "@/components/ui/EmptyStateCoach";
import { StatusPill, type StatusType } from "@/components/ui/StatusPill";

interface Props {
  epics: SttnsEpic[];
  projectSlug: string;
}

export function EpicsCatalog({ epics, projectSlug }: Props) {
  if (epics.length === 0) {
    return (
      <EmptyStateCoach
        type="epic"
        title="Section vide"
        explanation="Pour construire votre Spine, cette section a besoin d'Epics."
        actionLabel="Créer votre premier Epic"
        actionHref={`/projects/${projectSlug}/epics/new`}
      />
    );
  }

  return (
    <div className="space-y-2">
      {epics.map((epic) => (
        <Link
          key={epic.id}
          href={`/projects/${projectSlug}/epics/${epic.id}`}
          className="block rounded border border-zinc-200 bg-white p-4 hover:border-zinc-300"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-900">{epic.title}</span>
            <StatusPill
              status={
                epic.status === "in_progress"
                  ? "in_progress"
                  : epic.status === "done"
                  ? "done"
                  : "todo"
              }
            />
          </div>
          {epic.objective && (
            <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{epic.objective}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
