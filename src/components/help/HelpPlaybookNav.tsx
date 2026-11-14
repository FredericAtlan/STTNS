"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpChapterDownloadButton } from "@/components/help/HelpChapterDownloadButton";
import {
  HELP_CHAPTERS,
  getApplicationHelpSection,
  getFrameworkHelpSection,
  getParcoursHelpSection,
  getScoringHelpSection,
  helpChapterPath,
  type HelpChapterSlug,
} from "@/lib/sttns/helpPlaybook";
import type { FrameworkSection } from "@/lib/sttns/frameworkContent";
import { cn } from "@/lib/utils";

function sectionForChapter(
  slug: HelpChapterSlug,
  projectName: string
): FrameworkSection {
  switch (slug) {
    case "scoring":
      return getScoringHelpSection();
    case "parcours":
      return getParcoursHelpSection();
    case "framework":
      return getFrameworkHelpSection();
    case "application":
      return getApplicationHelpSection(projectName);
  }
}

export function HelpPlaybookNav({
  projectSlug,
  projectName,
}: {
  projectSlug: string;
  projectName: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Chapitres du Playbook" className="space-y-1">
      <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
        Chapitres
      </p>
      {HELP_CHAPTERS.map((chapter, index) => {
        const href = helpChapterPath(projectSlug, chapter.slug);
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const section = sectionForChapter(chapter.slug, projectName);

        return (
          <div
            key={chapter.slug}
            className={cn(
              "flex items-start gap-0.5 rounded-lg transition",
              active
                ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            )}
          >
            <Link href={href} className="min-w-0 flex-1 px-3 py-2.5">
              <span className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold",
                    active ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-600"
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug">
                    {chapter.shortTitle}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                    {chapter.description}
                  </span>
                </span>
              </span>
            </Link>
            <div className="shrink-0 self-center pr-1.5">
              <HelpChapterDownloadButton
                section={section}
                chapterSlug={chapter.slug}
                projectSlug={projectSlug}
                className={cn(
                  "h-8 w-8",
                  active
                    ? "text-emerald-800 hover:bg-emerald-100"
                    : "text-zinc-400 hover:text-zinc-700"
                )}
              />
            </div>
          </div>
        );
      })}
    </nav>
  );
}
