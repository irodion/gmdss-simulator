import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vite-plus/test";
import { useTtsEnabled } from "./use-tts-enabled.ts";

const STORAGE_KEY = "gmdss-offline:procedures:tts-enabled";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useTtsEnabled", () => {
  test("defaults to false when storage is empty", () => {
    const { result } = renderHook(() => useTtsEnabled());
    expect(result.current[0]).toBe(false);
  });

  test("reads 'true' from storage on mount", () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    const { result } = renderHook(() => useTtsEnabled());
    expect(result.current[0]).toBe(true);
  });

  test("setter flips state and writes 'true' to storage", () => {
    const { result } = renderHook(() => useTtsEnabled());
    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  test("setter writes 'false' when toggled off", () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    const { result } = renderHook(() => useTtsEnabled());
    act(() => {
      result.current[1](false);
    });
    expect(result.current[0]).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  test("malformed value defaults to false", () => {
    window.localStorage.setItem(STORAGE_KEY, "yes");
    const { result } = renderHook(() => useTtsEnabled());
    expect(result.current[0]).toBe(false);
  });
});
