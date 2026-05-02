import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { cancel, isSupported, speak, speakSequence } from "./tts.ts";

class FakeUtterance {
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  lang = "";
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

interface FakeSynth {
  spoken: string[];
  cancelled: number;
  voices: SpeechSynthesisVoice[];
  speak(u: FakeUtterance): void;
  cancel(): void;
  getVoices(): SpeechSynthesisVoice[];
  addEventListener(): void;
}

let fakeSynth: FakeSynth;

beforeEach(() => {
  const voice = { lang: "en-US", name: "Test Voice" } as SpeechSynthesisVoice;
  fakeSynth = {
    spoken: [],
    cancelled: 0,
    voices: [voice],
    speak(u: FakeUtterance) {
      this.spoken.push(u.text);
      // Simulate async end
      queueMicrotask(() => u.onend?.());
    },
    cancel() {
      this.cancelled++;
    },
    getVoices() {
      return this.voices;
    },
    addEventListener() {
      // voices already populated → never fires
    },
  };
  vi.stubGlobal("speechSynthesis", fakeSynth);
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    FakeUtterance as unknown as typeof SpeechSynthesisUtterance,
  );
  // happy-dom: window is the same as globalThis, but we still need
  // speechSynthesis ON window for isSupported() to return true.
  Object.defineProperty(window, "speechSynthesis", {
    value: fakeSynth,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isSupported", () => {
  test("returns true when speechSynthesis is on window", () => {
    expect(isSupported()).toBe(true);
  });
});

describe("speak", () => {
  test("speaks the given text", async () => {
    await speak("Alfa Bravo");
    expect(fakeSynth.spoken).toEqual(["Alfa Bravo"]);
  });

  test("cancels any in-flight utterance before speaking", async () => {
    await speak("first");
    await speak("second");
    expect(fakeSynth.cancelled).toBeGreaterThanOrEqual(1);
  });

  test("ignores empty text", async () => {
    await speak("   ");
    expect(fakeSynth.spoken).toHaveLength(0);
  });

  test("returns without enqueueing when the signal is already aborted", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await speak("hello", 0.9, ctrl.signal);
    expect(fakeSynth.spoken).toHaveLength(0);
  });

  test("aborting after enqueue cancels the in-flight utterance and resolves", async () => {
    let pendingUtter: FakeUtterance | null = null;
    fakeSynth.speak = function (u: FakeUtterance) {
      this.spoken.push(u.text);
      pendingUtter = u; // hold; let abort drive the resolve via cancel→onerror
    };
    fakeSynth.cancel = function () {
      this.cancelled++;
      pendingUtter?.onerror?.();
      pendingUtter = null;
    };
    const ctrl = new AbortController();
    const promise = speak("hello", 0.9, ctrl.signal);
    await Promise.resolve(); // let ensureVoiceReady + synth.speak run
    expect(fakeSynth.spoken).toEqual(["hello"]);
    ctrl.abort();
    await promise;
    expect(fakeSynth.cancelled).toBeGreaterThanOrEqual(1);
  });
});

describe("speakSequence", () => {
  test("speaks each word in order", async () => {
    await speakSequence(["ALFA", "BRAVO", "CHARLIE"], 0);
    expect(fakeSynth.spoken).toEqual(["ALFA", "BRAVO", "CHARLIE"]);
  });

  test("skips empty entries", async () => {
    await speakSequence(["ALFA", "", "BRAVO"], 0);
    expect(fakeSynth.spoken).toEqual(["ALFA", "BRAVO"]);
  });

  test("schedules the inter-word gap via setTimeout", async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    await speakSequence(["A", "B"], 250);
    const gaps = setTimeoutSpy.mock.calls.filter(([, ms]) => ms === 250);
    expect(gaps.length).toBeGreaterThanOrEqual(1);
    setTimeoutSpy.mockRestore();
  });
});

describe("cancel", () => {
  test("calls speechSynthesis.cancel", () => {
    cancel();
    expect(fakeSynth.cancelled).toBe(1);
  });

  test("is a no-op when speechSynthesis is missing", () => {
    Object.defineProperty(window, "speechSynthesis", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(() => cancel()).not.toThrow();
  });
});

describe("when speechSynthesis is unavailable", () => {
  test("isSupported returns false and speak/speakSequence are no-ops", async () => {
    Object.defineProperty(window, "speechSynthesis", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    expect(isSupported()).toBe(false);
    await speak("anything");
    await speakSequence(["A", "B"]);
  });
});
