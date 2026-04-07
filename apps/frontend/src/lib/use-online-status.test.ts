import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";

describe("useOnlineStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function loadHook() {
    const mod = await import("./use-online-status.ts");
    return mod.useOnlineStatus;
  }

  test("returns true when API health check succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ status: "ok" }) }),
    );

    const useOnlineStatus = await loadHook();
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);

    await vi.runOnlyPendingTimersAsync();

    expect(result.current).toBe(true);
  });

  test("returns false when API health check fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const useOnlineStatus = await loadHook();
    const { result } = renderHook(() => useOnlineStatus());

    await vi.runOnlyPendingTimersAsync();

    expect(result.current).toBe(false);
  });

  test("returns false when fetch throws (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const useOnlineStatus = await loadHook();
    const { result } = renderHook(() => useOnlineStatus());

    await vi.runOnlyPendingTimersAsync();

    expect(result.current).toBe(false);
  });

  test("re-polls on browser online/offline events", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);

    const useOnlineStatus = await loadHook();
    const { result } = renderHook(() => useOnlineStatus());

    await vi.runOnlyPendingTimersAsync();
    expect(result.current).toBe(false);

    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ status: "ok" }) });

    window.dispatchEvent(new Event("online"));
    await vi.runOnlyPendingTimersAsync();

    expect(result.current).toBe(true);
  });
});
