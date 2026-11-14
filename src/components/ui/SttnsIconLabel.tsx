"use client";

import type { LucideIcon } from "lucide-react";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";
import { iconSizeClass } from "@/lib/sttns/iconVocabulary";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  className?: string;
  iconClassName?: string;
  size?: "xs" | "sm" | "md";
  placement?: "top" | "bottom" | "right" | "left";
  /** Afficher le texte à côté de l'icône (drawer mobile) */
  showLabel?: boolean;
};

export function SttnsIconLabel({
  icon: Icon,
  label,
  className,
  iconClassName,
  size = "sm",
  placement = "top",
  showLabel = false,
}: Props) {
  const inner = (
    <>
      <Icon className={cn(iconSizeClass(size), "shrink-0 text-zinc-500", iconClassName)} aria-hidden />
      {showLabel && <span className="text-xs font-medium text-zinc-700">{label}</span>}
    </>
  );

  if (showLabel) {
    return <span className={cn("inline-flex items-center gap-1.5", className)}>{inner}</span>;
  }

  return (
    <SttnsIconTip label={label} placement={placement} className={className}>
      <span className="inline-flex items-center justify-center" aria-label={label}>
        {inner}
      </span>
    </SttnsIconTip>
  );
}
