"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertTriangle, Ghost } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import type { DependencyHealth, DependencyNodeKind } from "@/lib/sttns/dependencyGraph";
import { cn } from "@/lib/utils";

export type DependencyFlowNodeData = {
  title: string;
  kind: DependencyNodeKind;
  personaTitle?: string | null;
  epicTitle?: string | null;
  degree: number;
  impact?: 0 | 1 | 2 | 3 | null;
  health: DependencyHealth;
};

function healthBadge(health: DependencyHealth): { label: string; className: string } | null {
  if (health === "ghost") {
    return {
      label: "Fantôme",
      className: "border-warning/40 bg-warning/10 text-warning",
    };
  }
  if (health === "orphan") {
    return {
      label: "Sans JTBD",
      className: "border-destructive/40 bg-destructive/10 text-destructive",
    };
  }
  return null;
}

const KIND_STYLES: Record<DependencyNodeKind, { border: string; bg: string; caption: string }> = {
  jtbd: {
    border: "border-sky-300",
    bg: "bg-sky-50",
    caption: "JTBD",
  },
  feature: {
    border: "border-teal-300",
    bg: "bg-teal-50",
    caption: "Feature",
  },
};

function BaseNode({
  data,
  handleSide,
}: {
  data: DependencyFlowNodeData;
  handleSide: "left" | "right" | "both";
}) {
  const style = KIND_STYLES[data.kind];
  const badge = healthBadge(data.health);
  const impact0 = data.kind === "feature" && data.impact === 0;

  return (
    <div
      className={cn(
        "relative w-[220px] rounded-lg border bg-card p-2.5 shadow-sm",
        style.border,
        style.bg,
        impact0 && "ring-1 ring-destructive/40"
      )}
      title={data.title}
    >
      {(handleSide === "left" || handleSide === "both") && (
        <Handle type="target" position={Position.Left} className="!bg-muted-foreground/40" />
      )}
      {(handleSide === "right" || handleSide === "both") && (
        <Handle type="source" position={Position.Right} className="!bg-muted-foreground/40" />
      )}

      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <SpineObjectIcon type={data.kind} size="xs" />
          {style.caption}
        </span>
        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
          {data.kind === "jtbd" ? "→" : "←"} {data.degree}
        </span>
      </div>

      <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
        {data.title}
      </p>

      {(data.personaTitle || data.epicTitle) && (
        <p className="mt-1 truncate text-[10px] text-muted-foreground">
          {data.personaTitle
            ? `Persona · ${data.personaTitle}`
            : `Epic · ${data.epicTitle}`}
        </p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {badge && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
              badge.className
            )}
          >
            {data.health === "ghost" ? (
              <Ghost className="h-3 w-3" aria-hidden />
            ) : (
              <AlertTriangle className="h-3 w-3" aria-hidden />
            )}
            {badge.label}
          </span>
        )}
        {impact0 && (
          <span className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
            Impact 0
          </span>
        )}
      </div>
    </div>
  );
}

export const JtbdDependencyNode = memo(function JtbdDependencyNode(
  props: NodeProps
) {
  return <BaseNode data={props.data as DependencyFlowNodeData} handleSide="right" />;
});

export const FeatureDependencyNode = memo(function FeatureDependencyNode(
  props: NodeProps
) {
  return <BaseNode data={props.data as DependencyFlowNodeData} handleSide="left" />;
});
