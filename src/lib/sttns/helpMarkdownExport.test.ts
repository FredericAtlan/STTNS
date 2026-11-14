/**
 * Tests — export Markdown des chapitres Aide.
 */
import { describe, expect, it } from "vitest";
import type { FrameworkSection } from "@/lib/sttns/frameworkContent";
import {
  frameworkSectionToMarkdown,
  helpChapterMarkdownFilename,
} from "@/lib/sttns/helpMarkdownExport";

const SAMPLE: FrameworkSection = {
  id: "sample",
  title: "Chapitre test",
  subtitle: "Sous-titre",
  subsections: [
    {
      id: "s1",
      title: "Section une",
      paragraphs: ["Un paragraphe avec $$x=1$$."],
      callouts: [{ title: "Note", body: "Corps callout", variant: "emerald" }],
      bullets: ["Point A", "Point B"],
      table: {
        headers: ["Col", "Val"],
        rows: [["a", "1"]],
      },
      mermaidDiagrams: [
        {
          caption: "Flux",
          code: "flowchart TD\n  A --> B",
        },
      ],
    },
  ],
};

describe("helpMarkdownExport", () => {
  it("serializes title, subtitle, callout, table and mermaid", () => {
    const md = frameworkSectionToMarkdown(SAMPLE);
    expect(md).toContain("# Chapitre test");
    expect(md).toContain("Sous-titre");
    expect(md).toContain("## Section une");
    expect(md).toContain("> **Note**");
    expect(md).toContain("| Col | Val |");
    expect(md).toContain("```mermaid");
    expect(md).toContain("A --> B");
    expect(md).toContain("- Point A");
  });

  it("builds stable filenames", () => {
    expect(helpChapterMarkdownFilename("scoring")).toBe("sttns-aide-scoring.md");
    expect(helpChapterMarkdownFilename("application", "acme")).toBe(
      "sttns-aide-application-acme.md"
    );
  });
});
