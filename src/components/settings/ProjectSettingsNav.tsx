"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Settings2, Users, AlertTriangle, Scale, Archive } from "lucide-react";

export type ProjectSettingsTab = "general" | "governance" | "team" | "danger" | "archives";

const TABS: { id: ProjectSettingsTab; label: string; icon: typeof Settings2 }[] = [
  { id: "general", label: "Général", icon: Settings2 },
  { id: "governance", label: "Règles du workflow", icon: Scale },
  { id: "team", label: "Équipe", icon: Users },
  { id: "archives", label: "Archives", icon: Archive },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

export function ProjectSettingsNav({
  projectSlug,
  activeTab,
}: {
  projectSlug: string;
  activeTab: ProjectSettingsTab;
}) {
  const base = `/projects/${projectSlug}/settings`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 pb-px">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <Link
            key={id}
            href={`${base}?tab=${id}`}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition",
              active
                ? "border-b-2 border-emerald-600 text-emerald-800"
                : "text-zinc-500 hover:text-zinc-900",
              id === "danger" && !active && "text-red-500 hover:text-red-700",
              id === "danger" && active && "border-red-600 text-red-700"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
