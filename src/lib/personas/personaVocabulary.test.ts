import { describe, expect, it } from "vitest";
import {
  fallbackPersonaVocabulary,
  mergePersonaVocabularyWithDefaults,
  resolveTierCode,
  resolveTierDisplay,
  vocabularyFromDefs,
} from "@/lib/personas/personaVocabulary";
import type { SttnsPersonaJobTypeDef, SttnsPersonaTierDef } from "@/types/sttns";

const tierRows: SttnsPersonaTierDef[] = [
  {
    id: "1",
    project_id: "p",
    code: "T1",
    title: "Décideur",
    description: null,
    sort_order: 1,
    archived_at: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    project_id: "p",
    code: "T2",
    title: "Opérationnel",
    description: null,
    sort_order: 2,
    archived_at: null,
    created_at: "",
    updated_at: "",
  },
];

describe("personaVocabulary", () => {
  it("resolveTierCode matches code and legacy label", () => {
    const codes = ["T1", "T2"];
    expect(resolveTierCode("T2", codes)).toBe("T2");
    expect(resolveTierCode("L'Artisane (Tier 1)", codes)).toBe("T1");
    expect(resolveTierCode(null, codes)).toBe("T1");
  });

  it("resolveTierDisplay uses vocabulary labels", () => {
    const vocabulary = vocabularyFromDefs(tierRows, []);
    expect(resolveTierDisplay("T2", vocabulary)).toBe("T2 — Opérationnel");
  });

  it("fallbackPersonaVocabulary has default tiers and job types", () => {
    const vocab = fallbackPersonaVocabulary();
    expect(vocab.tiers.length).toBeGreaterThanOrEqual(7);
    expect(vocab.jobTypes.length).toBeGreaterThanOrEqual(3);
  });

  it("mergePersonaVocabularyWithDefaults restores missing JTBD types", () => {
    const merged = mergePersonaVocabularyWithDefaults({
      tiers: vocabularyFromDefs(tierRows, []).tiers,
      jobTypes: [],
    });
    expect(merged.jobTypes.map((j) => j.code)).toEqual(
      expect.arrayContaining(["functional", "social", "emotional"])
    );
  });
});
