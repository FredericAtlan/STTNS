"use client";

import type { SttnsInitiative } from "@/types/sttns";
import { StatusPill, type StatusType } from "@/components/ui/StatusPill";

interface Props {
  projectId: string;
  projectSlug: string;
  features: SttnsInitiative[];
}

export function GovernanceKanbanPanel({ features }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900">Gouvernance Features</h2>
      <p className="text-sm text-zinc-500">{features.length} features</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="rounded border border-zinc-200 bg-white p-4"
          >
            <p className="font-medium text-zinc-900">
              {feature.feature_name || "Feature sans nom"}
            </p>
            <div className="mt-2">
              <StatusPill status={feature.status as StatusType} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
