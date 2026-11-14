import type { SttnsInitiative } from "@/types/sttns";

interface Props {
  projectId: string;
  projectSlug: string;
  initiative: SttnsInitiative;
  members: { user_id: string; role: string }[];
}

export function FeatureExecutionPanel({ initiative }: Props) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4">
      <h3 className="font-medium text-zinc-900">Exécution</h3>
      <p className="mt-2 text-sm text-zinc-500">
        Feature: {initiative.feature_name || "Sans nom"}
      </p>
    </div>
  );
}
