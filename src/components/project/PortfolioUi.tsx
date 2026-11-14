import { cn } from "@/lib/utils";
import { SttnsCard } from "@/components/layout/sttns-ui";

export type PortfolioTone = "neutral" | "emerald" | "rose" | "amber" | "sky";

function badgeTone(tone: PortfolioTone) {
  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rose":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "sky":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

export function PortfolioBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: PortfolioTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        badgeTone(tone),
        className
      )}
    >
      {children}
    </span>
  );
}

function StatBlock({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: PortfolioTone;
}) {
  return (
    <div className="flex-1 px-4 py-4 first:pl-5 last:pr-5">
      <p
        className={cn(
          "text-2xl font-semibold tracking-tight",
          tone === "rose"
            ? "text-rose-700"
            : tone === "emerald"
              ? "text-emerald-700"
              : tone === "amber"
                ? "text-amber-700"
                : tone === "sky"
                  ? "text-sky-700"
                  : "text-zinc-900"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{label}</p>
    </div>
  );
}

export function PortfolioMetricCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: { label: string; value: number | string; tone?: PortfolioTone }[];
}) {
  return (
    <SttnsCard className="overflow-hidden p-0">
      <div className="border-b border-zinc-100 px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">{title}</p>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      <div className="grid gap-px bg-zinc-100 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="bg-white">
            <StatBlock {...item} />
          </div>
        ))}
      </div>
    </SttnsCard>
  );
}

export function PortfolioDonut({
  value,
  label,
  subtitle,
}: {
  value: number;
  label: string;
  subtitle: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const angle = (safeValue / 100) * 360;
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#e11d48 ${angle}deg, #e4e4e7 0deg)`,
        }}
      />
      <div className="absolute inset-[12px] rounded-full bg-white" />
      <div className="relative text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">{safeValue}%</p>
        <p className="mt-1 max-w-[110px] text-[11px] leading-snug text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}
