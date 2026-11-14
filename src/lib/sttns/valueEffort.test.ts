import { describe, expect, it } from "vitest";
import {
  calculateEpicRollup,
  calculateEpicValueEffortRatio,
  calculateFeatureDays,
  countRiskyUnits,
  formatEffortDays,
  formatImpactBadge,
  formatRiskBadge,
  formatValueEffortRatio,
  isEffortDays,
  isImpact,
  RISK_LABELS,
  sumActiveEffortDays,
} from "@/lib/sttns/valueEffort";

describe("valueEffort", () => {
  it("valide les échelles restreintes", () => {
    expect(isEffortDays(0.5)).toBe(true);
    expect(isEffortDays(8)).toBe(false);
    expect(isImpact(0)).toBe(true);
    expect(isImpact(4)).toBe(false);
  });

  it("somme les jours des stories", () => {
    expect(
      calculateFeatureDays({}, [{ effort_days: 1 }, { effort_days: 2 }, { effort_days: 0.5 }])
    ).toBe(3.5);
  });

  it("fallback Shape Up : jours sur la feature sans stories", () => {
    expect(calculateFeatureDays({ effort_days: 3 }, [])).toBe(3);
  });

  it("compte les unités risquées (R:3)", () => {
    expect(
      countRiskyUnits({}, [{ complexity: 3 }, { complexity: 1 }, { complexity: 3 }])
    ).toBe(2);
    expect(countRiskyUnits({ complexity: 3 }, [])).toBe(1);
  });

  it("calcule le roll-up Epic (∑Impact, ∑Jours, ratio)", () => {
    const rollup = calculateEpicRollup([
      { impact: 3, calculatedDays: 2 },
      { impact: 1, calculatedDays: 2 },
    ]);
    expect(rollup.totalImpact).toBe(4);
    expect(rollup.totalDays).toBe(4);
    expect(rollup.ratio).toBe(1);
    expect(calculateEpicValueEffortRatio([{ impact: 3, calculatedDays: 0 }])).toBeNull();
    expect(calculateEpicRollup([{ impact: 3, calculatedDays: 0 }]).totalImpact).toBe(3);
  });

  it("sumActiveEffortDays — exclut done et effort invalide", () => {
    expect(
      sumActiveEffortDays([
        { status: "todo", effortDays: 2, hasValidEffort: true },
        { status: "in_progress", effortDays: 3, hasValidEffort: true },
        { status: "done", effortDays: 5, hasValidEffort: true },
        { status: "todo", effortDays: 1, hasValidEffort: false },
        { status: "review", effortDays: 0.5, hasValidEffort: true },
      ])
    ).toBe(5.5);

    expect(
      sumActiveEffortDays([
        { status: "todo", effortDays: null, hasValidEffort: false },
        { status: "todo", effortDays: undefined },
      ])
    ).toBe(0);
  });

  it("formate badges Valeur / Effort / Risque", () => {
    expect(formatValueEffortRatio(null)).toBe("—");
    expect(formatValueEffortRatio(1.5)).toBe("1.50");
    expect(formatEffortDays(2)).toBe("2j");
    expect(formatEffortDays(0.5)).toBe("0.5j");
    expect(formatRiskBadge(3)).toBe("R:3");
    expect(formatRiskBadge(null)).toBe("—");
    expect(formatImpactBadge(2)).toBe("I:2");
    expect(formatImpactBadge(0, true)).toBe("I:0 Gaspillage");
    expect(RISK_LABELS[3]).toBe("Inconnu");
  });
});
