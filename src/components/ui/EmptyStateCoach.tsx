"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import type { SpineObjectKind } from "@/lib/sttns/iconVocabulary";
import { cn } from "@/lib/utils";

interface Props {
  type: SpineObjectKind;
  title?: string;
  explanation: string;
  actionLabel: string;
  /** Lien navigation (legacy). Ignoré si `onAction` est fourni. */
  actionHref?: string;
  /** CTA principal (ex. ouvrir un Slide-over) — préféré au lien. */
  onAction?: () => void;
  /** Densité cellule / colonne — sans max-width ni marge page. */
  compact?: boolean;
}

export function EmptyStateCoach({
  type,
  title = "Section vide",
  explanation,
  actionLabel,
  actionHref,
  onAction,
  compact = false,
}: Props) {
  const ctaClass = compact
    ? "sttns-btn-secondary sttns-btn-sm"
    : "sttns-btn-primary sttns-btn-md";

  return (
    <div
      className={cn(
        "sttns-card space-y-3 border-dashed text-center",
        compact
          ? "!p-3 my-0 max-w-none shadow-none"
          : "mx-auto my-6 max-w-xl space-y-4 !py-10"
      )}
    >
      <div
        className={cn(
          "inline-flex rounded-full border border-border bg-card",
          compact ? "p-2" : "p-3 shadow-sm"
        )}
      >
        <SpineObjectIcon type={type} size={compact ? "sm" : "md"} />
      </div>
      <div className="space-y-1">
        <h3
          className="font-semibold text-foreground"
          style={{ fontSize: "var(--sttns-text-body)" }}
        >
          {title}
        </h3>
        <p
          className={cn(
            "text-xs leading-relaxed text-muted-foreground",
            !compact && "mx-auto max-w-sm"
          )}
        >
          {explanation}
        </p>
      </div>
      <div className={compact ? "pt-0.5" : "pt-2"}>
        {onAction ? (
          <button type="button" onClick={onAction} className={ctaClass}>
            <Plus className="h-5 w-5" />
            {actionLabel}
          </button>
        ) : actionHref ? (
          <Link href={actionHref} className={ctaClass}>
            <Plus className="h-5 w-5" />
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
