import { describe, expect, it } from "vitest";
import { isHttpUrl, safeHref, safeInternalPath } from "./urls";

describe("safeInternalPath", () => {
  it("garde les chemins internes", () => {
    expect(safeInternalPath("/projects/demo?tab=1#x")).toBe("/projects/demo?tab=1#x");
  });
  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "evil.com", "/\tevil", ""])(
    "refuse %j",
    (v) => expect(safeInternalPath(v)).toBe("/")
  );
});

describe("safeHref / isHttpUrl", () => {
  it("accepte http(s) et mailto", () => {
    expect(safeHref("https://notion.so/x")).toBe("https://notion.so/x");
    expect(safeHref("mailto:a@b.c")).toBe("mailto:a@b.c");
    expect(isHttpUrl("http://x.y")).toBe(true);
  });
  it.each(["javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,x", "notion.so"])(
    "refuse %j",
    (v) => {
      expect(safeHref(v)).toBeUndefined();
      expect(isHttpUrl(v)).toBe(false);
    }
  );
});
