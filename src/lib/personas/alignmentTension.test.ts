import { describe, expect, it } from "vitest";
import {
  computeAlignmentTension,
  ratioToGaugePercent,
  resolveTensionStatus,
} from "./alignmentTension";

describe("resolveTensionStatus", () => {
  it("classifies surgical zone", () => {
    expect(resolveTensionStatus(1.0)).toBe("CHIRURGICAL");
    expect(resolveTensionStatus(1.3)).toBe("CHIRURGICAL");
    expect(resolveTensionStatus(1.4)).toBe("CHIRURGICAL");
  });

  it("classifies under-specified", () => {
    expect(resolveTensionStatus(0.5)).toBe("SOUS-SPÉCIFIÉ");
  });

  it("classifies overload", () => {
    expect(resolveTensionStatus(1.41)).toBe("SURCHARGE");
  });
});

describe("ratioToGaugePercent", () => {
  it("maps ratio zones to gauge segments", () => {
    expect(ratioToGaugePercent(0)).toBe(0);
    expect(ratioToGaugePercent(1.0)).toBe(50);
    expect(ratioToGaugePercent(1.4)).toBe(65);
    expect(ratioToGaugePercent(1.4)).toBeLessThan(ratioToGaugePercent(2.0));
  });
});

describe("computeAlignmentTension", () => {
  it("computes ratio from PP and JTBD counts", () => {
    const result = computeAlignmentTension(4, 5);
    expect(result.ratio).toBe(1.25);
    expect(result.status).toBe("CHIRURGICAL");
  });

  it("returns zero ratio when no PP", () => {
    const result = computeAlignmentTension(0, 3);
    expect(result.ratio).toBe(0);
    expect(result.status).toBe("SOUS-SPÉCIFIÉ");
  });
});
