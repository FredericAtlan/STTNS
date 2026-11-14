import { describe, expect, it } from "vitest";
import {
  getSimplifiedModeVariant,
  isEpicEqualsCycle,
  isFeatureExecutionMode,
  isShapeUpMode,
  isStoryExecutionMode,
} from "@/lib/sttns/projectExecutionMode";

const defaults = {
  executionUnit: "story" as const,
  epicEqualsCycle: false,
};

describe("projectExecutionMode", () => {
  it("détecte le mode story par défaut", () => {
    expect(isStoryExecutionMode(defaults)).toBe(true);
    expect(isFeatureExecutionMode(defaults)).toBe(false);
    expect(getSimplifiedModeVariant(defaults)).toBeNull();
  });

  it("détecte feature-only", () => {
    const settings = { ...defaults, executionUnit: "feature" as const };
    expect(isFeatureExecutionMode(settings)).toBe(true);
    expect(getSimplifiedModeVariant(settings)).toBe("feature_only");
    expect(isShapeUpMode(settings)).toBe(false);
  });

  it("détecte epic=cycle seul", () => {
    const settings = { ...defaults, epicEqualsCycle: true };
    expect(isEpicEqualsCycle(settings)).toBe(true);
    expect(getSimplifiedModeVariant(settings)).toBe("epic_cycle");
  });

  it("détecte Shape Up (les deux options)", () => {
    const settings = { executionUnit: "feature" as const, epicEqualsCycle: true };
    expect(isShapeUpMode(settings)).toBe(true);
    expect(getSimplifiedModeVariant(settings)).toBe("shape_up");
  });
});
