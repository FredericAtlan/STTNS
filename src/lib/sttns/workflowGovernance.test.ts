import { describe, expect, it } from "vitest";
import {
  assertFeatureImpactAllowsExecution,
  FEATURE_JTBD_REQUIRED_MESSAGE,
  IMPACT_ZERO_BLOCK_MESSAGE,
} from "@/lib/sttns/workflowGovernance";

describe("workflowGovernance — Impact 0 absolu", () => {
  it("bloque Feature impact 0 en in_progress", () => {
    const gate = assertFeatureImpactAllowsExecution(0, "in_progress");
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.error).toBe(IMPACT_ZERO_BLOCK_MESSAGE);
  });

  it("autorise Impact 0 en todo", () => {
    expect(assertFeatureImpactAllowsExecution(0, "todo").ok).toBe(true);
  });

  it("autorise Impact ≥ 1 en in_progress", () => {
    expect(assertFeatureImpactAllowsExecution(2, "in_progress").ok).toBe(true);
  });
});

describe("FEATURE_JTBD_REQUIRED_MESSAGE", () => {
  it("expose le message Constitution Spine", () => {
    expect(FEATURE_JTBD_REQUIRED_MESSAGE).toMatch(/JTBD/);
  });
});
