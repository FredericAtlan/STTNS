import type { SttnsInitiative } from "@/types/sttns";

interface Props {
  feature: SttnsInitiative;
}

export function FeatureLifecycleBadges({ feature }: Props) {
  return (
    <div className="flex gap-2">
      <span className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
        {feature.status}
      </span>
      {feature.final_decision && (
        <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
          {feature.final_decision.toUpperCase()}
        </span>
      )}
    </div>
  );
}
