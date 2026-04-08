import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import { AudioEngine } from "./audio-engine.ts";

// Mock AudioContext and related APIs
function createMockGain() {
  return {
    gain: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockFilter() {
  return {
    type: "bandpass",
    frequency: { value: 0 },
    Q: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockBufferSource() {
  return {
    buffer: null,
    loop: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

class MockAudioContext {
  state = "running" as AudioContextState;
  sampleRate = 44100;
  destination = {};

  createGain = vi.fn(() => createMockGain());
  createBiquadFilter = vi.fn(() => createMockFilter());
  createBufferSource = vi.fn(() => createMockBufferSource());
  createBuffer = vi.fn((_channels: number, length: number, sampleRate: number) => ({
    getChannelData: () => new Float32Array(length),
    sampleRate,
    length,
  }));
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

beforeEach(() => {
  vi.stubGlobal("AudioContext", MockAudioContext);
});

describe("AudioEngine", () => {
  test("init creates AudioContext and starts noise", async () => {
    const engine = new AudioEngine();
    const ctx = await engine.init();

    expect(ctx).toBeInstanceOf(MockAudioContext);
    expect(engine.isStarted()).toBe(true);
    expect(engine.getContext()).toBe(ctx);
    expect(engine.getMasterGain()).not.toBeNull();

    engine.destroy();
  });

  test("init is idempotent — second call returns same context", async () => {
    const engine = new AudioEngine();
    const ctx1 = await engine.init();
    const ctx2 = await engine.init();
    expect(ctx1).toBe(ctx2);
    engine.destroy();
  });

  test("init resumes suspended context", async () => {
    const engine = new AudioEngine();
    const ctx = await engine.init();
    (ctx as unknown as MockAudioContext).state = "suspended" as AudioContextState;
    await engine.init();
    expect((ctx as unknown as MockAudioContext).resume).toHaveBeenCalled();
    engine.destroy();
  });

  test("setSquelchLevel adjusts noise gain", async () => {
    const engine = new AudioEngine();
    await engine.init();

    engine.setSquelchLevel(0);
    // noiseGain.gain.value should be ~0.15

    engine.setSquelchLevel(100);
    // noiseGain.gain.value should be ~0

    engine.destroy();
  });

  test("setVolume adjusts master gain", async () => {
    const engine = new AudioEngine();
    await engine.init();

    const masterGain = engine.getMasterGain()!;
    engine.setVolume(50);
    expect(masterGain.gain.value).toBeCloseTo(0.5);

    engine.setVolume(100);
    expect(masterGain.gain.value).toBeCloseTo(1.0);

    engine.setVolume(0);
    expect(masterGain.gain.value).toBeCloseTo(0);

    engine.destroy();
  });

  test("destroy cleans up resources", async () => {
    const engine = new AudioEngine();
    await engine.init();

    engine.destroy();

    expect(engine.isStarted()).toBe(false);
    expect(engine.getContext()).toBeNull();
    expect(engine.getMasterGain()).toBeNull();
  });

  test("setSquelchLevel is safe before init", () => {
    const engine = new AudioEngine();
    expect(() => engine.setSquelchLevel(50)).not.toThrow();
  });

  test("setVolume is safe before init", () => {
    const engine = new AudioEngine();
    expect(() => engine.setVolume(50)).not.toThrow();
  });
});
