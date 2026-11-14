import { describe, expect, it } from "vitest";
import {
  buildWhyCsvBundle,
  isUuid,
  normalizeWhyCsvBundle,
  parseSolvedPainPointIds,
} from "@/lib/sttns/whyCsv";

describe("whyCsv", () => {
  it("sépare Pain Points et JTBD dans le bundle", () => {
    const bundle = buildWhyCsvBundle(
      [
        {
          id: "p1",
          title: "Yao",
          code: "YAO",
          status: "todo",
          metadata: { segment: "PME", description: "Marchand" },
        },
      ],
      [
        {
          id: "pp1",
          title: "Cash flow",
          parent_id: "p1",
          status: "todo",
          metadata: { spine_role: "pain_point", severity: "high", label: "Cash flow" },
        },
        {
          id: "j1",
          title: "Quand [soir], je veux [encaisser] afin de [dormir]",
          parent_id: "p1",
          status: "todo",
          metadata: { spine_role: "jtbd" },
        },
      ],
      [{ source_id: "j1", target_id: "pp1" }]
    );

    expect(bundle.personas).toHaveLength(1);
    expect(bundle.personas[0].segment).toBe("PME");
    expect(bundle.pain_points).toHaveLength(1);
    expect(bundle.pain_points[0].severity).toBe("high");
    expect(bundle.jtbd).toHaveLength(1);
    expect(bundle.jtbd[0].solved_pain_point_ids).toBe("pp1");
  });

  it("parse solved ids avec ; ou ,", () => {
    expect(parseSolvedPainPointIds("a;b,c")).toEqual(["a", "b", "c"]);
    expect(parseSolvedPainPointIds("")).toEqual([]);
  });

  it("normalise name → title sur personas", () => {
    const bundle = normalizeWhyCsvBundle({
      personas: [{ id: "x", name: "Laura", code: "LAU" }],
      pain_points: [],
      jtbd: [],
    });
    expect(bundle.personas[0].title).toBe("Laura");
  });

  it("détecte UUID", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});
