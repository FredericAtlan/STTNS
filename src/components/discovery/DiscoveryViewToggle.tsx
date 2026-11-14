"use client";

import { GitBranch, Network, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type DiscoveryViewMode = "table" | "tree" | "mindmap";

const OPTIONS: {
  id: DiscoveryViewMode;
  label: string;
  icon: typeof Table2;
  title: string;
}[] = [
  {
    id: "table",
    label: "Tableau",
    icon: Table2,
    title: "Saisie réunion",
  },
  {
    id: "tree",
    label: "Carte",
    icon: GitBranch,
    title: "Arbre hiérarchique Epic → Feature → Story",
  },
  {
    id: "mindmap",
    label: "Mind Map",
    icon: Network,
    title: "Canvas Mind Map (structure visuelle)",
  },
];

type Props = {
  value: DiscoveryViewMode;
  onChange: (mode: DiscoveryViewMode) => void;
  className?: string;
};

export function DiscoveryViewToggle({ value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Vue Discovery"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5",
        className
      )}
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            title={opt.title}
            onClick={() => onChange(opt.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Migre d’anciennes clés localStorage (map / zen purgé → table). */
export function parseDiscoveryViewMode(raw: string | null): DiscoveryViewMode {
  if (raw === "table" || raw === "tree" || raw === "mindmap") return raw;
  if (raw === "map") return "tree";
  // Legacy « zen » split-screen : abandonné — repli Tableau.
  if (raw === "zen") return "table";
  return "table";
}
