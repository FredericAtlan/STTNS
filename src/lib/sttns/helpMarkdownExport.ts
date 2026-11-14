/**
 * Export Markdown des chapitres Aide STTNS (Playbook).
 * Pur / client-safe — consommé par HelpSectionBody et HelpPlaybookNav.
 */

import type {
  FrameworkSection,
  FrameworkSubsection,
} from "@/lib/sttns/frameworkContent";
import type { HelpChapterSlug } from "@/lib/sttns/helpPlaybook";
import { STTNS_APP_VERSION_LABEL } from "@/lib/sttns/productVersion";

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
}

function subsectionToMarkdown(sub: FrameworkSubsection): string {
  const parts: string[] = [`## ${sub.title}`, ""];

  for (const p of sub.paragraphs ?? []) {
    parts.push(p.trim(), "");
  }

  for (const diagram of sub.mermaidDiagrams ?? []) {
    if (diagram.caption) {
      parts.push(`*${diagram.caption.trim()}*`, "");
    }
    parts.push("```mermaid", diagram.code.trim(), "```", "");
  }

  for (const callout of sub.callouts ?? []) {
    parts.push(`> **${callout.title}**`, `>`);
    for (const line of callout.body.trim().split("\n")) {
      parts.push(`> ${line}`);
    }
    parts.push("");
  }

  if (sub.bullets?.length) {
    for (const b of sub.bullets) {
      parts.push(`- ${b}`);
    }
    parts.push("");
  }

  if (sub.table) {
    const { headers, rows } = sub.table;
    parts.push(`| ${headers.map(escapeCell).join(" | ")} |`);
    parts.push(`| ${headers.map(() => "---").join(" | ")} |`);
    for (const row of rows) {
      parts.push(`| ${row.map(escapeCell).join(" | ")} |`);
    }
    parts.push("");
  }

  if (sub.funnelSteps?.length) {
    for (const step of sub.funnelSteps) {
      parts.push(`### ${step.number}. ${step.title}`, "", step.body.trim(), "");
      if (step.formula) {
        parts.push(step.formula.trim(), "");
      }
      if (step.bullets?.length) {
        for (const b of step.bullets) {
          parts.push(`- ${b}`);
        }
        parts.push("");
      }
    }
  }

  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Sérialise une section Playbook en Markdown (GFM + Mermaid + LaTeX). */
export function frameworkSectionToMarkdown(section: FrameworkSection): string {
  const parts: string[] = [
    `# ${section.title}`,
    "",
    `> Playbook STTNS ${STTNS_APP_VERSION_LABEL} — export Aide`,
    "",
  ];

  if (section.subtitle) {
    parts.push(section.subtitle.trim(), "");
  }

  for (const sub of section.subsections) {
    parts.push(subsectionToMarkdown(sub), "");
  }

  return `${parts.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

export function helpChapterMarkdownFilename(
  slug: HelpChapterSlug | string,
  projectSlug?: string
): string {
  const base = `sttns-aide-${slug}`;
  if (slug === "application" && projectSlug) {
    return `${base}-${projectSlug}.md`;
  }
  return `${base}.md`;
}

export function downloadMarkdownFile(filename: string, content: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadHelpChapterMarkdown(
  section: FrameworkSection,
  slug: HelpChapterSlug | string,
  projectSlug?: string
): void {
  downloadMarkdownFile(
    helpChapterMarkdownFilename(slug, projectSlug),
    frameworkSectionToMarkdown(section)
  );
}
