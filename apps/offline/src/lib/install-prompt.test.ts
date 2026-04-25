import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { setMatchMedia, setUserAgent } from "../test-utils.ts";
import { usePwaInstall } from "./install-prompt.ts";

interface FakePromptEvent extends Event {
  prompt: ReturnType<typeof vi.fn>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function makePromptEvent(outcome: "accepted" | "dismissed" = "accepted"): FakePromptEvent {
  const ev = new Event("beforeinstallprompt") as FakePromptEvent;
  ev.prompt = vi.fn(() => Promise.resolve());
  ev.userChoice = Promise.resolve({ outcome, platform: "web" });
  return ev;
}

beforeEach(() => {
  setUserAgent("Mozilla/5.0 (X11; Linux x86_64) Chrome/120");
  setMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePwaInstall", () => {
  test("starts in 'none' mode before any event fires", () => {
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.mode).toBe("none");
  });

  test("flips to 'prompt' mode when beforeinstallprompt fires", () => {
    const { result } = renderHook(() => usePwaInstall());
    act(() => {
      window.dispatchEvent(makePromptEvent());
    });
    expect(result.current.mode).toBe("prompt");
  });

  test("install() calls the deferred prompt and clears it on accept", async () => {
    const { result } = renderHook(() => usePwaInstall());
    const ev = makePromptEvent("accepted");
    act(() => {
      window.dispatchEvent(ev);
    });

    let outcome: string = "";
    await act(async () => {
      outcome = await result.current.install();
    });

    expect(ev.prompt).toHaveBeenCalled();
    expect(outcome).toBe("accepted");
    expect(result.current.mode).toBe("none");
  });

  test("install() returns 'unavailable' if no event was captured", async () => {
    const { result } = renderHook(() => usePwaInstall());
    let outcome: string = "";
    await act(async () => {
      outcome = await result.current.install();
    });
    expect(outcome).toBe("unavailable");
  });

  test("appinstalled event clears the prompt and stays in 'none'", () => {
    const { result } = renderHook(() => usePwaInstall());
    act(() => {
      window.dispatchEvent(makePromptEvent());
    });
    expect(result.current.mode).toBe("prompt");

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(result.current.mode).toBe("none");
  });

  test("iOS Safari shows 'ios-instructions' mode without an event", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17.0 Mobile/15E148 Safari",
    );
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.mode).toBe("ios-instructions");
  });

  test("standalone display-mode hides the affordance", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17.0 Mobile/15E148 Safari",
    );
    setMatchMedia(true);
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.mode).toBe("none");
  });
});
