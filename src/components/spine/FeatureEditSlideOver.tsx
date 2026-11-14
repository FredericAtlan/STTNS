"use client";

import {
  SpineInspector,
  type SpineInspectorFrame,
} from "@/components/spine/SpineInspector";
import type { SpineFeatureEditData } from "@/app/projects/[slug]/spine/actions";
import type { SpineEditContext } from "@/lib/sttns/spineEditContext";

interface Props {
  open: boolean;
  feature: SpineFeatureEditData | null;
  projectId: string;
  projectSlug: string;
  editContext: Pick<SpineEditContext, "epics" | "jtbdOptions" | "features" | "cycles">;
  featureExecutionMode?: boolean;
  epicEqualsCycle?: boolean;
  onClose: () => void;
  onSaved: () => void;
  variant?: "slide-over" | "page";
  defaultTab?: "edit" | "structure" | "health";
}

/** @deprecated Prefer SpineInspector directly — thin wrapper for Feature entry. */
export function FeatureEditSlideOver({
  open,
  feature,
  projectId,
  projectSlug,
  editContext,
  featureExecutionMode = false,
  epicEqualsCycle = false,
  onClose,
  onSaved,
  variant = "slide-over",
  defaultTab,
}: Props) {
  const initial: SpineInspectorFrame | null = feature
    ? { kind: "feature", data: feature }
    : null;

  return (
    <SpineInspector
      open={open && !!feature}
      initial={initial}
      projectId={projectId}
      projectSlug={projectSlug}
      editContext={editContext}
      featureExecutionMode={featureExecutionMode}
      epicEqualsCycle={epicEqualsCycle}
      onClose={onClose}
      onSaved={onSaved}
      variant={variant}
      defaultTab={defaultTab}
    />
  );
}
