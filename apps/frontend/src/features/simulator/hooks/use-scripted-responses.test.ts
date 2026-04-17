import { renderHook, act } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach, afterEach } from "vite-plus/test";
import {
  INITIAL_SESSION_STATE,
  type SessionState,
  type ScenarioDefinition,
} from "@gmdss-simulator/utils";
import { useScriptedResponses } from "./use-scripted-responses.ts";

const MOCK_SCENARIO: ScenarioDefinition = {
  id: "1.1",
  tier: 1,
  category: "routine",
  title: "Test",
  description: "Test",
  stationPersona: "COAST_STATION",
  vessel: { name: "BLUE DUCK" },
  requiredChannel: 16,
  task: "Test",
  scriptedResponses: [
    {
      id: "ack",
      speaker: "COAST_STATION",
      text: "RECEIVED",
      triggerAfterTurnIndex: 0,
      condition: { type: "always" },
    },
  ],
  rubricId: "v1/routine",
};

function makeActiveState(turns: SessionState["turns"]): SessionState {
  return {
    ...INITIAL_SESSION_STATE,
    phase: "active",
    scenario: MOCK_SCENARIO,
    turns,
    currentTurnIndex: turns.length,
    startedAt: 1000,
  };
}

describe("useScriptedResponses", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("does nothing when not in active phase", () => {
    const dispatch = vi.fn();
    const send = vi.fn();
    renderHook(() =>
      useScriptedResponses({
        session: { state: INITIAL_SESSION_STATE, dispatch },
        radio: { state: { txRx: "idle" } as any, send, reset: vi.fn(), events: [] },
        audio: {
          init: vi.fn(),
          speak: vi.fn().mockResolvedValue(undefined),
          playAudioBuffer: vi.fn(),
          startCapture: vi.fn(),
          stopCapture: vi.fn().mockResolvedValue({ cleanBlob: new Blob(), durationMs: 0 }),
          setSquelch: vi.fn(),
          setVolume: vi.fn(),
          setNoiseMuted: vi.fn(),
          destroy: vi.fn(),
        },
      }),
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(send).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  test("dispatches station turn after delay when student turn exists", () => {
    const dispatch = vi.fn();
    const send = vi.fn();
    const speak = vi.fn().mockResolvedValue(undefined);

    const state = makeActiveState([
      {
        index: 0,
        speaker: "student",
        text: "RADIO CHECK",
        timestamp: 1000,
        channel: 16,
        durationMs: 3000,
      },
    ]);

    renderHook(() =>
      useScriptedResponses({
        session: { state, dispatch },
        radio: { state: { txRx: "idle" } as any, send, reset: vi.fn(), events: [] },
        audio: {
          init: vi.fn(),
          speak,
          playAudioBuffer: vi.fn(),
          startCapture: vi.fn(),
          stopCapture: vi.fn().mockResolvedValue({ cleanBlob: new Blob(), durationMs: 0 }),
          setSquelch: vi.fn(),
          setVolume: vi.fn(),
          setNoiseMuted: vi.fn(),
          destroy: vi.fn(),
        },
      }),
    );

    // Before delay — nothing yet
    expect(send).not.toHaveBeenCalled();

    // After 800ms delay
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(send).toHaveBeenCalledWith({ type: "BEGIN_RECEIVE" });
    expect(dispatch).toHaveBeenCalledWith({
      type: "ADD_STATION_TURN",
      text: "RECEIVED",
      channel: 16,
    });
    expect(speak).toHaveBeenCalledWith("RECEIVED");
  });

  test("does not fire when no scripted response matches", () => {
    const dispatch = vi.fn();
    const send = vi.fn();

    // State with station response already played
    const state = makeActiveState([
      {
        index: 0,
        speaker: "student",
        text: "CHECK",
        timestamp: 1000,
        channel: 16,
        durationMs: 3000,
      },
      {
        index: 1,
        speaker: "station",
        text: "RECEIVED",
        timestamp: 2000,
        channel: 16,
        durationMs: 0,
      },
    ]);

    renderHook(() =>
      useScriptedResponses({
        session: { state, dispatch },
        radio: { state: { txRx: "idle" } as any, send, reset: vi.fn(), events: [] },
        audio: {
          init: vi.fn(),
          speak: vi.fn(),
          playAudioBuffer: vi.fn(),
          startCapture: vi.fn(),
          stopCapture: vi.fn().mockResolvedValue({ cleanBlob: new Blob(), durationMs: 0 }),
          setSquelch: vi.fn(),
          setVolume: vi.fn(),
          setNoiseMuted: vi.fn(),
          destroy: vi.fn(),
        },
      }),
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(send).not.toHaveBeenCalled();
  });
});
