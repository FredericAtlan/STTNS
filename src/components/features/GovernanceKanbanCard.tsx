import type { SttnsInitiative } from "@/types/sttns";

interface Props {
  projectId: string;
  projectSlug: string;
  feature: SttnsInitiative;
  dragHandleProps?: unknown;
}

export function GovernanceKanbanCard({ feature }: Props) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-zinc-900">
        {feature.feature_name || "Feature sans nom"}
      </p>
      {feature.feature_code && (
        <p className="text-xs text-zinc-500">{feature.feature_code}</p>
      )}
    </div>
  );
}
