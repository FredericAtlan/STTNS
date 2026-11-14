import { describe, expect, it } from "vitest";
import {
  isJtbdJob,
  isPainPointJob,
  parsePainPointFields,
  splitWhyJobs,
  toWhyPainPointOptions,
} from "@/lib/sttns/whySpine";

describe("whySpine — typage Pain Point vs JTBD", () => {
  it("priorise metadata.spine_role sur le préfixe de titre", () => {
    expect(
      isPainPointJob({ spine_role: "pain_point", severity: "high", label: "Friction" }, "Autre titre")
    ).toBe(true);
    expect(isJtbdJob({ spine_role: "pain_point" }, "Autre titre")).toBe(false);
  });

  it("accepte le fallback legacy titre [Pain Point] sans spine_role", () => {
    expect(isPainPointJob({}, "[Pain Point: critical] Lenteur checkout")).toBe(true);
    expect(isPainPointJob(null, "[Pain Point: medium] Sans meta")).toBe(true);
  });

  it("classe un job sans rôle ni préfixe comme JTBD", () => {
    const title =
      "Quand [je paie], je veux [payer vite] afin de [conclure]";
    expect(isPainPointJob({}, title)).toBe(false);
    expect(isJtbdJob({ situation: "x" }, title)).toBe(true);
  });

  it("ne corrompt pas le parsing legacy (sévérité + label)", () => {
    expect(
      parsePainPointFields("[Pain Point: high] Manque de liquidité", null)
    ).toEqual({ severity: "high", label: "Manque de liquidité" });

    expect(
      parsePainPointFields("Titre DB", {
        spine_role: "pain_point",
        severity: "critical",
        label: "Label meta",
      })
    ).toEqual({ severity: "critical", label: "Label meta" });
  });

  it("splitWhyJobs sépare sans ambiguïté (rôle + legacy)", () => {
    const { painPoints, jtbds } = splitWhyJobs([
      {
        id: "1",
        title: "[Pain Point: low] Legacy only",
        parent_id: "p1",
        metadata: {},
      },
      {
        id: "2",
        title: "Titre libre",
        parent_id: "p1",
        metadata: { spine_role: "pain_point", severity: "medium", label: "Via rôle" },
      },
      {
        id: "3",
        title: "Quand [A], je veux [B] afin de [C]",
        parent_id: "p1",
        metadata: { situation: "A" },
      },
    ]);

    expect(painPoints.map((j) => j.id).sort()).toEqual(["1", "2"]);
    expect(jtbds.map((j) => j.id)).toEqual(["3"]);
  });

  it("toWhyPainPointOptions expose label lisible pour formulaires", () => {
    const options = toWhyPainPointOptions([
      {
        id: "pp1",
        title: "[Pain Point: high] Checkout lent",
        parent_id: "persona-1",
        metadata: { spine_role: "pain_point", severity: "high", label: "Checkout lent" },
      },
    ]);
    expect(options).toEqual([
      {
        id: "pp1",
        title: "[Pain Point: high] Checkout lent",
        persona_id: "persona-1",
        severity: "high",
        label: "Checkout lent",
      },
    ]);
  });
});
