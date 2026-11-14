"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type Placement = "top" | "bottom" | "right" | "left";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
  tipClassName?: string;
  placement?: Placement;
  /** Texte long — retour à la ligne et largeur max */
  multiline?: boolean;
  /** Délai implicite via transition — affichage au hover/focus du wrapper */
  as?: "span" | "div";
};

const placementClass: Record<Placement, string> = {
  top: "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  bottom: "left-1/2 top-full mt-1.5 -translate-x-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
};

/**
 * Tooltip court desktop — libellé au survol / focus.
 * Pour l'aide métier riche, utiliser SttnsContextHelp (ⓘ).
 */
export function SttnsIconTip({
  label,
  children,
  className,
  tipClassName,
  placement = "right",
  multiline = false,
  as: Tag = "span",
}: Props) {
  const tipId = useId();
  const [pinned, setPinned] = useState(false);

  return (
    <Tag
      className={cn("relative inline-flex", className)}
      onMouseLeave={() => setPinned(false)}
    >
      <span
        className="inline-flex peer"
        aria-describedby={tipId}
        onFocus={() => setPinned(true)}
        onBlur={() => setPinned(false)}
      >
        {children}
      </span>
      <span
        id={tipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[100] rounded-md border border-zinc-200/90 bg-zinc-900 px-2 py-1 text-[11px] font-medium normal-case tracking-normal text-white shadow-md",
          multiline ? "max-w-[220px] whitespace-normal text-left leading-snug" : "whitespace-nowrap",
          "opacity-0 transition-opacity duration-150",
          "peer-hover:opacity-100 peer-focus-within:opacity-100",
          pinned && "opacity-100",
          placementClass[placement],
          tipClassName
        )}
      >
        {label}
      </span>
    </Tag>
  );
}
