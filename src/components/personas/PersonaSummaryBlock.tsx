import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
}

/** Résumé persona affiché en tête de fiche (liste, vue d'ensemble, édition). */
export function PersonaSummaryBlock({ text, className }: Props) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-emerald-200/80 bg-white px-4 py-3 shadow-sm",
        className
      )}
    >
      <p className="text-sm leading-relaxed text-zinc-700">
        <span className="font-bold text-emerald-900">Résumé :</span> {trimmed}
      </p>
    </div>
  );
}
