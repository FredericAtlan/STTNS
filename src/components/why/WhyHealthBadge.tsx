"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "orphan" | "ghost";

/** Orphelin = warning (PP sans JTBD) · Fantôme = muted (JTBD sans PP). */
const STYLE: Record<Variant, string> = {
  orphan: "border-warning/20 bg-warning/10 text-warning",
  ghost: "border-border bg-muted/60 text-muted-foreground",
};

const LABEL: Record<Variant, string> = {
  orphan: "Orphelin",
  ghost: "Fantôme",
};

const TITLE: Record<Variant, string> = {
  orphan: "Pain Point sans JTBD qui le résout (lien solves)",
  ghost: "JTBD sans Pain Point lié (lien solves)",
};

/**
 * Indicateur santé Why — Orphelin (warning) vs Fantôme (muted).
 * `onClick` : rend un bouton (légende cliquable en bas de matrice).
 */
export function WhyHealthBadge({
  variant,
  className,
  onClick,
}: {
  variant: Variant;
  className?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {LABEL[variant]}
    </>
  );

  const styles = cn(
    "inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[10px] font-semibold leading-none",
    STYLE[variant],
    onClick &&
      "cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={styles}
        title={TITLE[variant]}
        aria-label={`${LABEL[variant]} — expliquer`}
      >
        {body}
      </button>
    );
  }

  return (
    <span className={styles} title={TITLE[variant]}>
      {body}
    </span>
  );
}
