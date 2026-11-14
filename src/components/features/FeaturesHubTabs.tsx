"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FEATURES_HUB_TABS, featuresHubPath, type FeaturesHubTab } from "@/lib/sttns/featuresHub";
import { cn } from "@/lib/utils";
import { Columns3, LayoutGrid, Table2 } from "lucide-react";

const TAB_ICONS: Record<FeaturesHubTab, typeof Table2> = {
  board: Columns3,
  registry: Table2,
  arbitrage: LayoutGrid,
};

export function FeaturesHubTabs({ slug, activeTab }: { slug: string; activeTab: FeaturesHubTab }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDetail =
    pathname.startsWith(`/projects/${slug}/features/`) &&
    !pathname.endsWith("/new") &&
    pathname !== `/projects/${slug}/features`;

  if (isDetail) {
    const from = searchParams.get("from");
    const inferred: FeaturesHubTab =
      from === "arbitrage" ? "arbitrage" : from === "registry" ? "registry" : "board";
    return (
      <nav
        className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200/80 bg-white p-1.5 shadow-sm"
        aria-label="Onglets Features"
      >
        {FEATURES_HUB_TABS.map(({ id, label }) => {
          const Icon = TAB_ICONS[id];
          const active = id === inferred;
          return (
            <Link
              key={id}
              href={featuresHubPath(slug, id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
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

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200/80 bg-white p-1.5 shadow-sm"
      aria-label="Onglets Features"
    >
      {FEATURES_HUB_TABS.map(({ id, label }) => {
        const Icon = TAB_ICONS[id];
        const active = id === activeTab;
        return (
          <Link
            key={id}
            href={featuresHubPath(slug, id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
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
