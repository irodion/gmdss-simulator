import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { useTtsSupported } from "./use-tts-supported.ts";

const isSupportedMock = vi.fn<() => boolean>();
const detectSupportMock = vi.fn<() => Promise<boolean>>();

let voicesChangedCb: (() => void) | null = null;
const onVoicesChangedMock = vi.fn((cb: () => void) => {
  voicesChangedCb = cb;
  return () => {
    voicesChangedCb = null;
  };
});

vi.mock("./tts.ts", () => ({
  isSupported: () => isSupportedMock(),
  detectSpeechSupport: () => detectSupportMock(),
  onVoicesChanged: (cb: () => void) => onVoicesChangedMock(cb),
}));

beforeEach(() => {
  isSupportedMock.mockReset();
  detectSupportMock.mockReset();
  onVoicesChangedMock.mockClear();
  voicesChangedCb = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useTtsSupported", () => {
  test("seeds synchronously from the API check, before the probe settles", () => {
    isSupportedMock.mockReturnValue(true);
    detectSupportMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTtsSupported());
    expect(result.current).toBe(true);
  });

  test("downgrades to false once the probe reports no usable voices", async () => {
    isSupportedMock.mockReturnValue(true);
    detectSupportMock.mockResolvedValue(false);
    const { result } = renderHook(() => useTtsSupported());
    expect(result.current).toBe(true);
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe(false);
  });

  test("stays false when the speech API is absent", async () => {
    isSupportedMock.mockReturnValue(false);
    detectSupportMock.mockResolvedValue(false);
    const { result } = renderHook(() => useTtsSupported());
    expect(result.current).toBe(false);
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe(false);
  });

  test("re-probes and upgrades when voices arrive after the first probe", async () => {
    isSupportedMock.mockReturnValue(true);
    detectSupportMock.mockResolvedValueOnce(false);
    const { result } = renderHook(() => useTtsSupported());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe(false);

    detectSupportMock.mockResolvedValue(true);
    await act(async () => {
      voicesChangedCb?.();
      await Promise.resolve();
    });
    expect(result.current).toBe(true);
  });
});
