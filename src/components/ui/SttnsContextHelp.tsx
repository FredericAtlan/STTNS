"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";
import {
  STTNS_CONTEXT_HELP_KIND,
  type SttnsContextHelpContent,
  type SttnsContextHelpKind,
} from "@/lib/sttns/sttnsContext";
import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import { cn } from "@/lib/utils";

export type Props = SttnsContextHelpContent & {
  className?: string;
  /** Taille de l'icône — défaut compact pour titres de section */
  size?: "sm" | "md";
  /** Position du panneau par rapport à l'icône */
  placement?: "top" | "bottom" | "right" | "left" | "bottom-start" | "bottom-end";
  /** Mode guide: tooltip compact ou drawer plein écran */
  mode?: "tooltip" | "drawer";
  /** Libellé du bouton en mode drawer */
  buttonLabel?: string;
  /** Classe optionnelle pour décaler le panneau (ex: mt-12) */
  offsetClass?: string;
};

function WireframeInfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1" />
      <circle cx="8" cy="5.15" r="0.65" fill="currentColor" />
      <path
        d="M8 7.1v3.9"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SttnsContextHelp({
  kind,
  title,
  body,
  href,
  hrefLabel = "En savoir plus",
  className,
  size = "sm",
  placement = "bottom",
  mode = "tooltip",
  buttonLabel = "Aide",
  offsetClass,
}: Props) {
  const tooltipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const [pinned, setPinned] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const meta = STTNS_CONTEXT_HELP_KIND[kind];
  const iconSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  const panelPosition =
    placement === "top"
      ? "bottom-full left-1/2 mb-1.5 -translate-x-1/2"
      : placement === "bottom"
        ? "top-full left-1/2 mt-1.5 -translate-x-1/2"
        : placement === "bottom-start"
          ? "top-full left-0 mt-1.5"
          : placement === "bottom-end"
            ? "top-full right-0 mt-1.5"
            : placement === "right"
              ? "left-full top-1/2 ml-1.5 -translate-y-1/2"
              : placement === "left"
                ? "right-full top-1/2 mr-1.5 -translate-y-1/2"
                : "top-full left-1/2 mt-1.5 -translate-x-1/2";

  if (mode === "drawer") {
    return (
      <>
        <button
          type="button"
          className={cn("sttns-btn-secondary text-sm", className)}
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
        >
          {buttonLabel}
        </button>

        <SttnsSlideOver
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          eyebrow={meta.label}
          title={title}
          ariaLabelClose={`Fermer ${buttonLabel.toLowerCase()}`}
        >
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{body}</p>
            {href && (
              <Link
                href={href}
                className="inline-flex text-sm font-semibold text-primary hover:text-primary/80 hover:underline"
              >
                {hrefLabel} →
              </Link>
            )}
          </div>
        </SttnsSlideOver>
      </>
    );
  }

  return (
    <span
      ref={rootRef}
      className={cn("relative inline-flex align-middle", className)}
      onMouseLeave={() => setPinned(false)}
    >
      <button
        type="button"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
          "peer"
        )}
        aria-describedby={tooltipId}
        aria-label={`Aide : ${title}`}
        onFocus={() => setPinned(true)}
        onBlur={() => setPinned(false)}
        onClick={() => setPinned((v) => !v)}
      >
        <WireframeInfoIcon className={iconSize} />
      </button>

      <div
        id={tooltipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[70] w-[min(calc(100vw-1.25rem),15rem)] opacity-0 transition-opacity duration-150",
          "peer-hover:pointer-events-auto peer-hover:opacity-100 peer-focus-visible:pointer-events-auto peer-focus-visible:opacity-100",
          pinned && "pointer-events-auto opacity-100",
          panelPosition,
          offsetClass
        )}
      >
        <div
          className={cn(
            "overflow-hidden rounded-md border border-border bg-card/95 shadow-elevated backdrop-blur-sm",
            "border-l-2",
            meta.accentClass
          )}
        >
          <div className="space-y-1 px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-1">
              <span
                className={cn(
                  "rounded px-1 py-px text-[8px] font-bold uppercase tracking-[0.12em] ring-1 ring-inset",
                  meta.chipClass
                )}
              >
                {meta.label}
              </span>
              <p className="min-w-0 flex-1 text-[11px] font-semibold leading-tight text-foreground">{title}</p>
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground whitespace-pre-line">{body}</p>
            {href && (
              <Link
                href={href}
                className="pointer-events-auto inline-flex text-[10px] font-semibold leading-none text-primary hover:text-primary/80 hover:underline"
              >
                {hrefLabel} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </span>
  );
}

/** Titre de section + icône d'aide alignée — pattern desktop standard STTNS */
export function SttnsSectionTitle({
  children,
  help,
  as: Tag = "h2",
  className,
}: {
  children: React.ReactNode;
  help?: SttnsContextHelpContent;
  as?: "h2" | "h3" | "h4";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Tag
        className={cn(
          "font-semibold text-foreground",
          Tag === "h2" ? "text-base" : Tag === "h3" ? "text-sm" : "text-xs"
        )}
      >
        {children}
      </Tag>
    </div>
  );
}

export type { SttnsContextHelpKind, SttnsContextHelpContent };
