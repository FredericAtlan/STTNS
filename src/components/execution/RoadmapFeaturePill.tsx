import type { SttnsInitiative } from "@/types/sttns";

interface Props {
  feature: SttnsInitiative;
  releaseLabel?: string | null;
}

export function RoadmapFeaturePill({ feature, releaseLabel }: Props) {
  return (
    <div className="inline-flex items-center gap-2 rounded border border-zinc-200 bg-white px-2 py-1 text-xs">
      <span className="font-medium text-zinc-700">
        {feature.feature_name || "Feature"}
      </span>
      {releaseLabel && (
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-500">
          {releaseLabel}
        </span>
      )}
      {feature.feature_code && (
        <span className="text-zinc-400">{feature.feature_code}</span>
      )}
    </div>
  );
}
