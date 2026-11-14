"use client";

import { useRouter } from "next/navigation";
import {
  SpineInspector,
} from "@/components/spine/SpineInspector";
import type { SpineEpicEditData } from "@/app/projects/[slug]/spine/actions";
import type { SpineEditContext } from "@/lib/sttns/spineEditContext";

interface Props {
  projectId: string;
  projectSlug: string;
  epic: SpineEpicEditData;
  editContext: Pick<SpineEditContext, "epics" | "jtbdOptions" | "features" | "cycles">;
  featureExecutionMode?: boolean;
  epicEqualsCycle?: boolean;
}

/** Fiche Epic pleine page — Inspecteur en mode page. */
export function EpicInspectorPage({
  projectId,
  projectSlug,
  epic,
  editContext,
  featureExecutionMode,
  epicEqualsCycle,
}: Props) {
  const router = useRouter();

  return (
    <SpineInspector
      open
      variant="page"
      initial={{ kind: "epic", data: epic }}
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
