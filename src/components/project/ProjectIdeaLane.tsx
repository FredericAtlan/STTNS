import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

type ProjectIdeaLaneProps = {
  eyebrow: string;
  title: string;
  description: string;
  badgeLabel: string;
  badgeToneClassName: string;
  icon: ReactNode;
  containerClassName?: string;
  iconWrapClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  footerLinkClassName?: string;
  linkHref?: string;
  linkLabel?: string;
  children: ReactNode;
};

export function ProjectIdeaLane({
  eyebrow,
  title,
  description,
  badgeLabel,
  badgeToneClassName,
  icon,
  containerClassName,
  iconWrapClassName,
  titleClassName,
  descriptionClassName,
  footerLinkClassName,
  linkHref,
  linkLabel = "Voir tout",
  children,
}: ProjectIdeaLaneProps) {
  return (
    <div
      className={`flex min-h-[280px] flex-col rounded-2xl border bg-white p-5 shadow-sm ring-1 ${containerClassName ?? "border-slate-200 ring-slate-50"}`}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${iconWrapClassName ?? "bg-slate-50 text-slate-600 ring-slate-100"}`}
          >
            {icon}
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sttns-muted">{eyebrow}</p>
            <h3 className={`font-display text-lg font-bold tracking-tight ${titleClassName ?? "text-slate-900"}`}>
              {title}
            </h3>
            <p className={`text-xs leading-relaxed ${descriptionClassName ?? "text-sttns-muted"}`}>{description}</p>
          </div>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${badgeToneClassName}`}>
          {badgeLabel}
        </div>
      </div>

      <div className="flex-1 space-y-3">{children}</div>

      {linkHref && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Link
            href={linkHref}
            className={`inline-flex items-center gap-1 text-xs font-bold ${footerLinkClassName ?? "text-sttns-accent hover:text-emerald-900"}`}
          >
            {linkLabel}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
