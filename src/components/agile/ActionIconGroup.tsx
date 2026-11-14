import { cn } from "@/lib/utils";

/** Emplacement uniforme dans un ActionIconGroup (hauteur harmonisée desktop). */
export const actionGroupSlotClass =
  "flex h-8 w-8 shrink-0 items-center justify-center";

/** Liseré fin autour des contrôles d'une même action (ⓘ + icône + case, etc.). */
export function ActionIconGroup({
  children,
  active,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-0.5 rounded-lg border px-1",
        active
          ? "border-emerald-200/90 bg-emerald-50/30"
          : "border-zinc-200/90 bg-white/50",
        className
      )}
    >
      {children}
    </div>
  );
}
