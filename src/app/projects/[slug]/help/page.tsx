import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Route, Scale } from "lucide-react";
import { HELP_CHAPTERS, helpChapterPath, type HelpChapterSlug } from "@/lib/sttns/helpPlaybook";

interface Props {
  params: Promise<{ slug: string }>;
}

const CHAPTER_ICONS: Record<HelpChapterSlug, React.ComponentType<{ className?: string }>> = {
  scoring: Scale,
  parcours: Route,
  framework: BookOpen,
  application: Layers,
};

export default async function HelpHubPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Quatre chapitres alignent Produit, Tech et Système autour d&apos;un même vocabulaire. Le
        scoring Valeur / Effort reste la source de vérité pour la notation.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {HELP_CHAPTERS.map((chapter, index) => {
          const Icon = CHAPTER_ICONS[chapter.slug];
          return (
            <Link
              key={chapter.slug}
              href={helpChapterPath(slug, chapter.slug)}
              className="sttns-card group flex flex-col gap-3 !p-5 transition hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Chapitre {index + 1}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-foreground">{chapter.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {chapter.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
