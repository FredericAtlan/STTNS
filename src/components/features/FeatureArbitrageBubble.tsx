"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, MouseEventHandler } from "react";

/**
 * Navigation vers une fiche feature sans prefetch Link (évite les erreurs
 * vendor-chunks/@supabase en dev quand le cache .next est instable).
 */
export function FeatureArbitrageBubble({
  href,
  title,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
}: {
  href: string;
  title: string;
  className?: string;
  style?: CSSProperties;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => {
        if (href && href !== "#") router.push(href);
      }}
    />
  );
}
