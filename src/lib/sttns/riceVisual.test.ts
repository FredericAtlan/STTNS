import { describe, expect, it } from "vitest";
import {
  computeSttnsScore,
  computeSttnsScoreRaw,
  STTNS_SCORE_MAX,
  STTNS_SCORE_RAW_MAX,
} from "./riceVisual";

describe("computeSttnsScoreRaw", () => {
  it("returns 1000 at maximum RICE inputs", () => {
    expect(computeSttnsScoreRaw(10, 10, 10, 1)).toBe(STTNS_SCORE_RAW_MAX);
  });

  it("caps normalized score at 100 while raw can exceed", () => {
    const raw = computeSttnsScoreRaw(10, 10, 10, 1);
    const normalized = computeSttnsScore(10, 10, 10, 1);
    expect(raw).toBe(1000);
    expect(normalized).toBe(STTNS_SCORE_MAX);
  });

  it("computes a mid-range example", () => {
    // (8 × 7 × 0.8) / 3 × 10 ≈ 149.33
    const raw = computeSttnsScoreRaw(8, 7, 8, 3);
    expect(raw).not.toBeNull();
    expect(raw!).toBeCloseTo(149.33, 1);
    expect(computeSttnsScore(8, 7, 8, 3)).toBe(STTNS_SCORE_MAX);
  });
});
