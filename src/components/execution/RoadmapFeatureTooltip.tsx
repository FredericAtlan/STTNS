import type { SttnsInitiative } from "@/types/sttns";
import { StatusPill, type StatusType } from "@/components/ui/StatusPill";

interface Props {
  feature: SttnsInitiative;
}

export function RoadmapFeatureTooltip({ feature }: Props) {
  return (
    <div className="max-w-xs text-sm space-y-1">
      <p className="font-medium text-zinc-900">{feature.feature_name || "Feature"}</p>
      <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
        <span>Statut :</span>
        <StatusPill status={feature.status as StatusType} />
      </div>
      {feature.feature_code && (
        <p className="text-zinc-400 text-xs">{feature.feature_code}</p>
      )}
    </div>
  );
}
