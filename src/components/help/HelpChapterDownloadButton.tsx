"use client";

import { Download } from "lucide-react";
import type { FrameworkSection } from "@/lib/sttns/frameworkContent";
import type { HelpChapterSlug } from "@/lib/sttns/helpPlaybook";
import { downloadHelpChapterMarkdown } from "@/lib/sttns/helpMarkdownExport";
import { cn } from "@/lib/utils";

type Props = {
  section: FrameworkSection;
  chapterSlug: HelpChapterSlug | string;
  projectSlug?: string;
  className?: string;
  /** icône seule (nav) vs bouton avec libellé (header chapitre) */
  label?: boolean;
};

export function HelpChapterDownloadButton({
  section,
  chapterSlug,
  projectSlug,
  className,
  label = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        downloadHelpChapterMarkdown(section, chapterSlug, projectSlug);
      }}
      title="Télécharger ce chapitre en Markdown (.md)"
      aria-label="Télécharger ce chapitre en Markdown"
      className={cn(
        label ? "sttns-btn-ghost sttns-btn-sm" : "sttns-btn-icon",
        className
      )}
    >
      <Download className="h-3.5 w-3.5" />
      {label ? <span className="hidden sm:inline">.md</span> : null}
    </button>
  );
}
