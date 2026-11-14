"use client";

import type { SttnsInitiative } from "@/types/sttns";

interface Props {
  feature: SttnsInitiative;
  index: number;
  projectId: string;
  projectSlug: string;
  onClick?: () => void;
}

export function ExecutionQueueFeatureCard({
  feature,
  onClick,
}: Props) {
  return (
    <div
      onClick={onClick}
      className="rounded border border-zinc-200 bg-white p-3 shadow-sm cursor-pointer hover:border-zinc-300 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-900">
          {feature.feature_name || "Feature sans nom"}
        </span>
        {feature.feature_code && (
          <span className="text-xs text-zinc-500">{feature.feature_code}</span>
        )}
      </div>
    </div>
  );
}
