import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { readAdaptivePreference, writeAdaptivePreference } from "./adaptive-prefs.ts";

const KEY = "roc-trainer:adaptive-enabled";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readAdaptivePreference", () => {
  test("defaults to true when nothing persisted", () => {
    expect(readAdaptivePreference()).toBe(true);
  });

  test("returns true when stored value is 'true'", () => {
    window.localStorage.setItem(KEY, "true");
    expect(readAdaptivePreference()).toBe(true);
  });

  test("returns false when stored value is 'false'", () => {
    window.localStorage.setItem(KEY, "false");
    expect(readAdaptivePreference()).toBe(false);
  });

  test("returns false for unrecognized values (anything not 'true')", () => {
    window.localStorage.setItem(KEY, "garbage");
    expect(readAdaptivePreference()).toBe(false);
  });

  test("returns true (default) when localStorage throws", () => {
    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readAdaptivePreference()).toBe(true);
  });
});

describe("writeAdaptivePreference", () => {
  test("writes 'true' / 'false' literals so the read side can parse them", () => {
    writeAdaptivePreference(true);
    expect(window.localStorage.getItem(KEY)).toBe("true");
    writeAdaptivePreference(false);
    expect(window.localStorage.getItem(KEY)).toBe("false");
  });

  test("survives a localStorage that throws on write", () => {
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => writeAdaptivePreference(false)).not.toThrow();
  });
});
