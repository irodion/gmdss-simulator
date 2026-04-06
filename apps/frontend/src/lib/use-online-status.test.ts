import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";

import { useOnlineStatus } from "./use-online-status.ts";

describe("useOnlineStatus", () => {
  test("returns true when navigator.onLine is true", () => {
    const { result } = renderHook(() => useOnlineStatus());
    // happy-dom defaults navigator.onLine to true
    expect(result.current).toBe(true);
  });
});
