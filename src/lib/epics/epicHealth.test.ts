import { describe, expect, it } from "vitest";
import { computeEpicDoR, countGhostEpics } from "@/lib/epics/epicHealth";

describe("computeEpicDoR", () => {
  it("requires title, definition and stories for proposed", () => {
    const incomplete = computeEpicDoR({
      title: "",
      objective: "",
      linkedStoryCount: 0,
    });
    expect(incomplete.readyForProposed).toBe(false);
    expect(incomplete.isGhost).toBe(true);
    expect(incomplete.gaps).toHaveLength(3);

    const complete = computeEpicDoR({
      title: "E1 — Smart Audit",
      objective: "Réduire le temps de collecte des pièces",
      linkedStoryCount: 2,
    });
    expect(complete.readyForProposed).toBe(true);
    expect(complete.isGhost).toBe(false);
  });
});

describe("countGhostEpics", () => {
  it("counts epics with zero linked stories", () => {
    const map = new Map([
      ["e1", 2],
      ["e2", 0],
      ["e3", 1],
    ]);
    expect(countGhostEpics([{ id: "e1" }, { id: "e2" }, { id: "e3" }], map)).toBe(1);
  });
});
