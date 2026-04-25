import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { useSpeechRecognition } from "./stt.ts";

interface FakeRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: FakeResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
}

interface FakeResult {
  readonly isFinal: boolean;
  readonly length: number;
  item: (i: number) => { readonly transcript: string };
}
interface FakeResultList {
  readonly length: number;
  item: (i: number) => FakeResult;
}

let lastInstance: FakeRecognition | null = null;
const captureInstance = (inst: FakeRecognition) => {
  lastInstance = inst;
};

class FakeRecognitionCtor implements FakeRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  onresult: FakeRecognition["onresult"] = null;
  onerror: FakeRecognition["onerror"] = null;
  onend: FakeRecognition["onend"] = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    captureInstance(this);
  }
}

function makeResult(transcript: string, isFinal: boolean): FakeResult {
  return {
    isFinal,
    length: 1,
    item: () => ({ transcript }),
  };
}

function makeResultList(...results: FakeResult[]): FakeResultList {
  return {
    length: results.length,
    item: (i: number) => results[i]!,
  };
}

beforeEach(() => {
  lastInstance = null;
  vi.stubGlobal("SpeechRecognition", FakeRecognitionCtor);
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useSpeechRecognition", () => {
  test("supported is true when window has SpeechRecognition", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.supported).toBe(true);
    expect(result.current.available).toBe(true);
  });

  test("supported is false when SpeechRecognition is missing", () => {
    vi.unstubAllGlobals();
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.supported).toBe(false);
    expect(result.current.available).toBe(false);
  });

  test("available is false when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.supported).toBe(true);
    expect(result.current.available).toBe(false);
  });

  test("start() configures recognition and emits transcripts as interim then final", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.start());

    expect(lastInstance).not.toBeNull();
    expect(lastInstance!.start).toHaveBeenCalled();
    expect(lastInstance!.interimResults).toBe(true);
    expect(lastInstance!.continuous).toBe(true);
    expect(lastInstance!.lang).toBe("en-US");
    expect(result.current.listening).toBe(true);

    act(() => {
      lastInstance!.onresult!({ results: makeResultList(makeResult("alfa bra", false)) });
    });
    expect(result.current.transcript).toBe("alfa bra");

    act(() => {
      lastInstance!.onresult!({ results: makeResultList(makeResult("alfa bravo", true)) });
    });
    expect(result.current.transcript).toBe("alfa bravo");

    act(() => {
      lastInstance!.onresult!({
        results: makeResultList(makeResult("alfa bravo", true), makeResult("char", false)),
      });
    });
    expect(result.current.transcript).toBe("alfa bravo char");
  });

  test("onerror with 'not-allowed' sets permissionDenied and stops listening", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());

    act(() => lastInstance!.onerror!({ error: "not-allowed" }));

    expect(result.current.permissionDenied).toBe(true);
    expect(result.current.listening).toBe(false);
    expect(result.current.available).toBe(false);
  });

  test("onend flips listening to false", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());
    expect(result.current.listening).toBe(true);

    act(() => lastInstance!.onend!());
    expect(result.current.listening).toBe(false);
  });

  test("stop() calls recognition.stop on the active instance", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(lastInstance!.stop).toHaveBeenCalled();
  });

  test("unmount aborts in-flight recognition", () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());
    unmount();
    expect(lastInstance!.abort).toHaveBeenCalled();
  });
});
