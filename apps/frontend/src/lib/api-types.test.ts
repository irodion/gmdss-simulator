import { describe, expect, test } from "vite-plus/test";
import { statusBadgeClass, progressPercent } from "./api-types.ts";

describe("statusBadgeClass", () => {
  test("locked", () => {
    expect(statusBadgeClass("locked")).toBe("badge badge--locked");
  });

  test("completed", () => {
    expect(statusBadgeClass("completed")).toBe("badge badge--complete");
  });

  test("in_progress", () => {
    expect(statusBadgeClass("in_progress")).toBe("badge badge--progress");
  });
});

describe("progressPercent", () => {
  test("returns percentage", () => {
    expect(progressPercent(3, 6)).toBe("50%");
  });

  test("returns 0% when total is 0", () => {
    expect(progressPercent(0, 0)).toBe("0%");
  });
});
