import { describe, expect, test, vi, beforeEach, afterEach } from "vite-plus/test";
import { PlaybackQueue } from "./playback-queue.ts";

// Mock SpeechSynthesis
const mockSpeak = vi.fn((utterance: SpeechSynthesisUtterance) => {
  // Simulate async speech completion
  setTimeout(() => {
    utterance.onend?.(new Event("end") as SpeechSynthesisEvent);
  }, 10);
});

beforeEach(() => {
  vi.stubGlobal("speechSynthesis", { speak: mockSpeak, cancel: vi.fn() });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text: string;
      rate = 1;
      pitch = 1;
      onend: ((e: Event) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    },
  );
  mockSpeak.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Minimal mock AudioContext for PlaybackQueue constructor
function createMockCtx() {
  return {
    decodeAudioData: vi.fn(),
    createBufferSource: vi.fn(),
    createBiquadFilter: vi.fn(() => ({
      type: "bandpass",
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    createWaveShaper: vi.fn(() => ({
      curve: null,
      oversample: "none",
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    createDynamicsCompressor: vi.fn(() => ({
      threshold: { value: 0 },
      ratio: { value: 0 },
      knee: { value: 0 },
      attack: { value: 0 },
      release: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
  } as unknown as AudioContext;
}

describe("PlaybackQueue", () => {
  test("speak enqueues and plays via SpeechSynthesis", async () => {
    const queue = new PlaybackQueue(createMockCtx(), {} as AudioNode);
    await queue.speak("HELLO WORLD");
    expect(mockSpeak).toHaveBeenCalledOnce();
  });

  test("plays items sequentially", async () => {
    const queue = new PlaybackQueue(createMockCtx(), {} as AudioNode);

    const order: string[] = [];
    const p1 = queue.speak("FIRST").then(() => order.push("FIRST"));
    const p2 = queue.speak("SECOND").then(() => order.push("SECOND"));

    await Promise.all([p1, p2]);
    expect(order).toEqual(["FIRST", "SECOND"]);
  });

  test("isPlaying returns false when idle", () => {
    const queue = new PlaybackQueue(createMockCtx(), {} as AudioNode);
    expect(queue.isPlaying()).toBe(false);
  });

  test("clear resolves pending items", async () => {
    const queue = new PlaybackQueue(createMockCtx(), {} as AudioNode);
    const p1 = queue.speak("WILL BE CLEARED");
    queue.clear();
    // Should resolve without error
    await p1;
  });
});
