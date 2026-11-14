import { describe, expect, it } from "vitest";

import { epicHasCascadeInconsistency } from "./epicCatalog";

describe("epicHasCascadeInconsistency", () => {
  it("flags in_progress epic without validated story", () => {
    const inconsistent = epicHasCascadeInconsistency("in_progress", [{ status: "proposed" }]);
    expect(inconsistent).toBe(true);
  });

  it("accepts in_progress epic with at least one validated story", () => {
    const consistent = epicHasCascadeInconsistency("in_progress", [
      { status: "proposed" },
      { status: "validated" },
    ]);
    expect(consistent).toBe(false);
  });

  it("ignores draft epics", () => {
    const ignored = epicHasCascadeInconsistency("draft", []);
    expect(ignored).toBe(false);
  });
});
