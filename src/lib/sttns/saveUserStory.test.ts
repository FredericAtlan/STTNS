import { describe, expect, it } from "vitest";

import { assertStoryHasEpic } from "./storyEpicLink";

describe("saveUserStory epic guard", () => {
  it("rejects a missing epic with a French message", () => {
    const result = assertStoryHasEpic(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Sélectionnez une Epic pour cette user story.");
    }
  });

  it("rejects an empty epic id", () => {
    const result = assertStoryHasEpic("");
    expect(result.ok).toBe(false);
  });

  it("accepts a provided epic", () => {
    const result = assertStoryHasEpic("epic-id");
    expect(result.ok).toBe(true);
  });
});
