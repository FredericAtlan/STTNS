"use client";

import {
  SpineInspector,
  type SpineInspectorFrame,
} from "@/components/spine/SpineInspector";
import type { SpineEpicEditData } from "@/app/projects/[slug]/spine/actions";
import type { SpineEditContext } from "@/lib/sttns/spineEditContext";

interface Props {
  open: boolean;
  epic: SpineEpicEditData | null;
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

/** @deprecated Prefer SpineInspector directly — thin wrapper for Epic entry. */
export function EpicEditSlideOver({
  open,
  epic,
  projectId,
  projectSlug,
  editContext,
  featureExecutionMode,
  epicEqualsCycle,
  onClose,
  onSaved,
  variant = "slide-over",
  defaultTab,
}: Props) {
  const initial: SpineInspectorFrame | null = epic
    ? { kind: "epic", data: epic }
    : null;

  return (
    <SpineInspector
      open={open && !!epic}
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
