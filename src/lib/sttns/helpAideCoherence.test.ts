/**
 * Cohérence technique Playbook Aide + export docs/aide/sttns-aide-*.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  frameworkSectionToMarkdown,
  helpChapterMarkdownFilename,
} from "@/lib/sttns/helpMarkdownExport";
import {
  getApplicationHelpSection,
  getFrameworkHelpSection,
  getParcoursHelpSection,
  getScoringHelpSection,
} from "@/lib/sttns/helpPlaybook";

const AIDE_DIR = path.resolve(__dirname, "../../../docs/aide");

const CHAPTERS = [
  { slug: "scoring" as const, section: getScoringHelpSection() },
  { slug: "parcours" as const, section: getParcoursHelpSection() },
  { slug: "framework" as const, section: getFrameworkHelpSection() },
  {
    slug: "application" as const,
    section: getApplicationHelpSection("Projet"),
    filenameSlug: "application",
  },
];

describe("help Aide — cohérence technique", () => {
  it("n'expose que la triade V/E et les 4 statuts Spine", () => {
    for (const { section } of CHAPTERS) {
      const md = frameworkSectionToMarkdown(section);
      expect(md).toMatch(/todo/);
      expect(md).toMatch(/in_progress/);
      expect(md).toMatch(/review/);
      expect(md).toMatch(/done/);
      expect(md).not.toMatch(/\bRICE\b/);
      expect(md).not.toMatch(/BUILD\s*[·/]\s*LEARN\s*[·/]\s*KILL/);
      expect(md).not.toMatch(/À faire\s*→\s*En cours/);
    }
  });

  it("affirme legacy /personas → /why et les hard blocks codés", () => {
    const corpus = CHAPTERS.map(({ section }) =>
      frameworkSectionToMarkdown(section)
    ).join("\n");

    expect(corpus).toMatch(/\/personas/);
    expect(corpus).toMatch(/\/why/);
    expect(corpus).toMatch(/redirig/);
    expect(corpus).toMatch(/gel/);
    expect(corpus).toMatch(/context_type:\s*job/);
    expect(corpus).toMatch(/I:0/);
    expect(corpus).toMatch(/in_progress/);
  });

  it("écrit docs/aide/sttns-aide-*.md", () => {
    mkdirSync(AIDE_DIR, { recursive: true });
    for (const { slug, section } of CHAPTERS) {
      const filename = helpChapterMarkdownFilename(slug);
      const target = path.join(AIDE_DIR, filename);
      writeFileSync(target, frameworkSectionToMarkdown(section), "utf8");
      expect(target).toContain("sttns-aide-");
    }
  });
});
