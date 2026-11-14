import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SttnsContextHelp,
  type SttnsContextHelpContent,
} from "@/components/ui/SttnsContextHelp";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";

export function SttnsCard({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={cn("sttns-card", className)}>
      {children}
    </div>
  );
}

export function SttnsPageHero({
  eyebrow,
  title,
  description,
  contextHelp,
  actions,
  children,
  count,
}: {
  /** Fil d’Ariane — une fois au-dessus du H1 (ex. Projet · slug). */
  eyebrow?: string;
  /** H1 de page — source unique du titre ; les cartes enfants n’ont pas de second H1. */
  title: ReactNode;
  /** Sous-titre de rôle (une phrase), pas un titre bis. */
  description?: ReactNode;
  /** Aide « ? » collée au H1. */
  contextHelp?: SttnsContextHelpContent;
  actions?: ReactNode;
  children?: ReactNode;
  /** Compteur optionnel affiché à côté du titre */
  count?: number | string;
}) {
  return (
    <section
      data-sttns-page-hero=""
      className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3"
    >
      {eyebrow ? (
        <p className="w-full text-xs font-medium uppercase tracking-wide text-primary">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1
          className="truncate font-semibold tracking-tight text-foreground"
          style={{ fontSize: "var(--sttns-text-page-title)" }}
        >
          {title}
          {count !== undefined && (
            <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">· {count}</span>
          )}
        </h1>
        {contextHelp ? <SttnsContextHelp {...contextHelp} size="md" /> : null}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
      {children ? <div className="w-full min-w-0 lg:w-auto">{children}</div> : null}
      {description && (
        <p className="w-full text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
    </section>
  );
}

export function SttnsSidebarLink({
  href,
  icon,
  label,
  active = false,
  onClick,
  compact = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const link = (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex items-center rounded-md text-xs font-medium transition-colors gap-1.5 px-2 py-1.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active
          ? "bg-primary/10 text-primary ring-1 ring-primary/25"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "shrink-0 w-6 h-6 flex items-center justify-center",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {icon}
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight whitespace-normal break-words">{label}</span>
      )}
    </Link>
  );

  if (compact) {
    return (
      <SttnsIconTip label={label} placement="right">
        {link}
      </SttnsIconTip>
    );
  }

  return link;
}

export function SttnsButton({
  href,
  variant = "primary",
  children,
  className,
  tip,
}: {
  href: string;
  variant?: "primary" | "secondary" | "outline";
  children: ReactNode;
  className?: string;
  tip?: string;
}) {
  const styles =
    variant === "primary"
      ? "sttns-btn-primary"
      : variant === "outline"
        ? "sttns-btn-secondary"
        : "sttns-btn-secondary bg-foreground text-background hover:bg-foreground/90 border-foreground";

  const inner = (
    <Link
      href={href}
      aria-label={tip}
      className={cn(styles, className)}
    >
      {children}
    </Link>
  );

  if (tip) {
    return (
      <SttnsIconTip label={tip} placement="bottom">
        {inner}
      </SttnsIconTip>
    );
  }

  return inner;
}

export function SttnsPanel({
  title,
  subtitle,
  help,
  count,
  headerAction,
  children,
  className,
  id,
}: {
  title: string;
  subtitle?: string;
  help?: SttnsContextHelpContent;
  count?: number;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <SttnsCard id={id} className={cn("flex flex-col", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {typeof count === "number" && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-muted px-1.5 text-[10px] font-bold tabular-nums text-muted-foreground">
              {count}
            </span>
          )}
          {headerAction}
        </div>
      </div>
      {children}
    </SttnsCard>
  );
}

/** Séparateur de phase sidebar — icône + tooltip */
export function SttnsPhaseDivider({
  icon,
  label,
  compact = true,
}: {
  icon: ReactNode;
  label: string;
  compact?: boolean;
}) {
  if (!compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 pb-0.5 pt-3">
        <span className="text-muted-foreground">{icon}</span>
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-2">
      <SttnsIconTip label={label} placement="right">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground"
          aria-label={label}
        >
          {icon}
        </span>
      </SttnsIconTip>
    </div>
  );
}

export const STTNS_SIDEBAR_WIDTH = "var(--sttns-sidebar-w)";
