import { describe, expect, it } from "vitest";
import { csvCell, neutralizeCsvFormula, restoreCsvFormula } from "./csvExport";

describe("injection de formules CSV", () => {
  it.each(["=HYPERLINK(\"http://x\")", "+1+1", "-cmd", "@SUM(A1)", "\tx"])("neutralise %j", (v) => {
    expect(neutralizeCsvFormula(v).startsWith("'")).toBe(true);
    expect(restoreCsvFormula(neutralizeCsvFormula(v))).toBe(v);
  });
  it("laisse les nombres et le texte ordinaire", () => {
    expect(neutralizeCsvFormula("-12.5")).toBe("-12.5");
    expect(neutralizeCsvFormula("Panier local")).toBe("Panier local");
    expect(csvCell(-3)).toBe('"-3"');
    expect(csvCell("=1+1")).toBe('"\'=1+1"');
  });
});
