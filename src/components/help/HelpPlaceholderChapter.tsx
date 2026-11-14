import { SpineRichText } from "@/components/ui/SpineRichText";
import { HELP_PLACEHOLDER_BODY, type HelpChapterMeta } from "@/lib/sttns/helpPlaybook";
import Link from "next/link";

export function HelpPlaceholderChapter({
  chapter,
  scoringHref,
}: {
  chapter: HelpChapterMeta;
  scoringHref: string;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2 border-b border-zinc-200 pb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
          Contenu en cours de rédaction
        </p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
          {chapter.title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-500">{chapter.description}</p>
      </header>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-5 py-6">
        <SpineRichText content={HELP_PLACEHOLDER_BODY} />
        <p className="mt-4 text-sm text-zinc-600">
          <Link href={scoringHref} className="font-semibold text-emerald-800 hover:underline">
            Ouvrir le Scoring Valeur / Effort →
          </Link>
        </p>
      </div>
    </div>
  );
}
