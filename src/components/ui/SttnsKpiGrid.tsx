"use client";

import type { CSSProperties } from "react";
import { SttnsCard } from "@/components/layout/sttns-ui";
import { SttnsContextHelp, type SttnsContextHelpContent } from "@/components/ui/SttnsContextHelp";
import { SttnsIconLabel } from "@/components/ui/SttnsIconLabel";
import { KPI_VOCAB, type KpiVocabKey } from "@/lib/sttns/iconVocabulary";
import { cn } from "@/lib/utils";

export type SttnsKpiItem = {
  /** Clé KPI — résolution icône + libellé côté client (safe depuis Server Components). */
  iconKey: KpiVocabKey;
  /** Surcharge du libellé tooltip (optionnel). */
  tip?: string;
  value: string | number;
  help?: SttnsContextHelpContent;
  detail?: string;
  /** Teinte alerte pour tuiles summary (CEO, comité…). */
  tone?: "rose" | "amber";
};

type SttnsKpiGridProps = {
  items: SttnsKpiItem[];
  /** Bande unique : une ligne, scroll horizontal sur mobile. */
  layout?: "wrap" | "strip";
};

export function SttnsKpiGrid({ items, layout = "wrap" }: SttnsKpiGridProps) {
  const isStrip = layout === "strip";

  return (
    <section
      style={isStrip ? ({ "--kpi-cols": items.length } as CSSProperties) : undefined}
      className={cn(
        isStrip
          ? "sttns-scroll-hidden flex snap-x snap-mandatory gap-2 overflow-x-scroll overscroll-x-contain pb-0.5 lg:grid lg:grid-cols-[repeat(var(--kpi-cols,5),minmax(0,1fr))] lg:overflow-visible"
          : "flex flex-wrap gap-2"
      )}
    >
      {items.map((item) => {
        const vocab = KPI_VOCAB[item.iconKey];
        const tip = item.tip ?? vocab.label;
        return (
          <SttnsCard
            key={tip}
            className={cn(
              "flex items-center gap-2 px-2.5 py-2 sm:gap-2.5 sm:px-3",
              isStrip
                ? "w-[7rem] shrink-0 snap-start sm:w-[7.5rem] lg:w-auto lg:shrink"
                : "min-w-[7.5rem] flex-1 sm:max-w-[12rem]",
              item.tone === "rose" && "border-rose-200 bg-rose-50",
              item.tone === "amber" && "border-amber-200 bg-amber-50"
            )}
          >
            <div className="flex shrink-0 items-center gap-px">
              <SttnsIconLabel icon={vocab.icon} label={tip} size="sm" placement="top" />
              {item.help && <SttnsContextHelp {...item.help} placement="bottom-end" size="sm" />}
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p
                className={
                  typeof item.value === "number"
                    ? cn(
                        "font-semibold tabular-nums tracking-tight text-zinc-900",
                        isStrip ? "text-lg" : "text-xl"
                      )
                    : "truncate text-xs font-semibold text-zinc-900"
                }
              >
                {item.value}
              </p>
              {item.detail && (
                <p className="truncate text-[10px] font-medium tabular-nums text-zinc-500">
                  {item.detail}
                </p>
              )}
            </div>
          </SttnsCard>
        );
      })}
    </section>
  );
}

/** @deprecated Utiliser SttnsKpiGrid */
export const FeatureDetailKpiGrid = SttnsKpiGrid;

export type { SttnsContextHelpContent };
