"use client";

import {
  iconSizeClass,
  normalizeSpineObjectKind,
  SPINE_OBJECT_VOCAB,
  type SpineObjectKind,
} from "@/lib/sttns/iconVocabulary";
import { cn } from "@/lib/utils";

type Props = {
  type: SpineObjectKind | string;
  size?: "xs" | "sm" | "md";
  className?: string;
  /** Applique la teinte métier par défaut (indigo persona, violet epic, etc.). */
  colored?: boolean;
  "aria-label"?: string;
};

export function SpineObjectIcon({
  type,
  size = "sm",
  className,
  colored = true,
  "aria-label": ariaLabel,
}: Props) {
  const kind = normalizeSpineObjectKind(type);
  if (!kind) return null;

  const entry = SPINE_OBJECT_VOCAB[kind];
  const Icon = entry.icon;

  return (
    <Icon
      className={cn(
        iconSizeClass(size),
        "shrink-0",
        colored ? entry.toneClass : "text-zinc-500",
        className
      )}
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
    />
  );
}

/** Icône + libellé court (toolbars, onglets). */
export function SpineObjectLabel({
  type,
  size = "sm",
  colored = true,
  className,
}: Props & { showLabel?: boolean }) {
  const kind = normalizeSpineObjectKind(type);
  if (!kind) return null;

  const entry = SPINE_OBJECT_VOCAB[kind];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <SpineObjectIcon type={kind} size={size} colored={colored} />
      <span className="text-sm font-medium text-zinc-800">{entry.label}</span>
    </span>
  );
}
