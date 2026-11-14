import { describe, expect, it } from "vitest";
import {
  comparePersonaCode,
  normalizePersonaCode,
  suggestNextPersonaCode,
} from "./personaCodes";

describe("personaCodes", () => {
  it("normalizes P codes", () => {
    expect(normalizePersonaCode("p10")).toBe("P10");
    expect(normalizePersonaCode("P01")).toBe("P1");
  });

  it("sorts alphanumerically", () => {
    expect(comparePersonaCode("P2", "P10")).toBeLessThan(0);
    expect(comparePersonaCode("P10", "P2")).toBeGreaterThan(0);
  });

  it("suggests next code", () => {
    expect(suggestNextPersonaCode(["P1", "P3", "P10"])).toBe("P11");
    expect(suggestNextPersonaCode([])).toBe("P1");
  });
});
