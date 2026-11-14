"use client";

import { useRouter } from "next/navigation";
import { SpineInspector } from "@/components/spine/SpineInspector";
import type { SpineFeatureEditData } from "@/app/projects/[slug]/spine/actions";
import type { SpineEditContext } from "@/lib/sttns/spineEditContext";

interface Props {
  projectId: string;
  projectSlug: string;
  feature: SpineFeatureEditData;
  editContext: Pick<SpineEditContext, "epics" | "jtbdOptions" | "features" | "cycles">;
  featureExecutionMode?: boolean;
  epicEqualsCycle?: boolean;
}

export function FeatureInspectorPage({
  projectId,
  projectSlug,
  feature,
  editContext,
  featureExecutionMode,
  epicEqualsCycle,
}: Props) {
  const router = useRouter();

  return (
    <SpineInspector
      open
      variant="page"
      initial={{ kind: "feature", data: feature }}
      projectId={projectId}
      projectSlug={projectSlug}
      editContext={editContext}
      featureExecutionMode={featureExecutionMode}
      epicEqualsCycle={epicEqualsCycle}
      onClose={() => router.push(`/projects/${projectSlug}/portfolio`)}
      onSaved={() => router.refresh()}
      defaultTab="structure"
    />
  );
}
