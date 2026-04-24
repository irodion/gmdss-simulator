import { describe, expect, it, vi, afterEach } from "vite-plus/test";
import {
  sessionReducer,
  INITIAL_SESSION_STATE,
  getNextScriptedResponse,
} from "../src/scenario-machine.ts";
import type { ScenarioDefinition, SessionState } from "../src/scenario-types.ts";

const MOCK_SCENARIO: ScenarioDefinition = {
  id: "1.1",
  tier: 1,
  category: "routine",
  title: "Radio Check",
  description: "Perform a radio check.",
  stationPersona: "COAST_STATION",
  vessel: { name: "BLUE DUCK", callsign: "5BCD2", mmsi: "211239680" },
  requiredChannel: 16,
  task: "Perform a radio check on Channel 16.",
  scriptedResponses: [
    {
      id: "ack",
      speaker: "COAST_STATION",
      text: "READING YOU LOUD AND CLEAR, OVER.",
      triggerAfterTurnIndex: 0,
      condition: { type: "always" },
    },
    {
      id: "confirm",
      speaker: "COAST_STATION",
      text: "ROGER, OUT.",
      triggerAfterTurnIndex: 1,
      condition: { type: "always" },
    },
  ],
  rubricId: "v1/routine",
  hints: ["Call the station"],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sessionReducer", () => {
  describe("LOAD_SCENARIO", () => {
    it("transitions from loading to briefing", () => {
      const state = sessionReducer(INITIAL_SESSION_STATE, {
        type: "LOAD_SCENARIO",
        scenario: MOCK_SCENARIO,
      });
      expect(state.phase).toBe("briefing");
      expect(state.scenario).toBe(MOCK_SCENARIO);
      expect(state.turns).toHaveLength(0);
    });

    it("ignores LOAD_SCENARIO when not in loading phase", () => {
      const briefing: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "briefing",
        scenario: MOCK_SCENARIO,
      };
      const state = sessionReducer(briefing, {
        type: "LOAD_SCENARIO",
        scenario: MOCK_SCENARIO,
      });
      expect(state).toBe(briefing);
    });
  });

  describe("START_SCENARIO", () => {
    it("transitions from briefing to active", () => {
      vi.spyOn(Date, "now").mockReturnValue(5000);
      const briefing: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "briefing",
        scenario: MOCK_SCENARIO,
      };
      const state = sessionReducer(briefing, { type: "START_SCENARIO" });
      expect(state.phase).toBe("active");
      expect(state.startedAt).toBe(5000);
    });

    it("ignores START_SCENARIO when not in briefing phase", () => {
      const state = sessionReducer(INITIAL_SESSION_STATE, {
        type: "START_SCENARIO",
      });
      expect(state.phase).toBe("loading");
    });
  });

  describe("ADD_STUDENT_TURN", () => {
    it("adds a student turn during active phase", () => {
      vi.spyOn(Date, "now").mockReturnValue(6000);
      const active: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "active",
        scenario: MOCK_SCENARIO,
        startedAt: 5000,
      };
      const state = sessionReducer(active, {
        type: "ADD_STUDENT_TURN",
        text: "RADIO CHECK",
        channel: 16,
        durationMs: 3000,
      });
      expect(state.turns).toHaveLength(1);
      expect(state.turns[0]!.speaker).toBe("student");
      expect(state.turns[0]!.text).toBe("RADIO CHECK");
      expect(state.turns[0]!.channel).toBe(16);
      expect(state.turns[0]!.index).toBe(0);
      expect(state.currentTurnIndex).toBe(1);
    });

    it("ignores ADD_STUDENT_TURN when not active", () => {
      const state = sessionReducer(INITIAL_SESSION_STATE, {
        type: "ADD_STUDENT_TURN",
        text: "test",
        channel: 16,
        durationMs: 1000,
      });
      expect(state.turns).toHaveLength(0);
    });
  });

  describe("ADD_STATION_TURN", () => {
    it("adds a station turn during active phase", () => {
      vi.spyOn(Date, "now").mockReturnValue(7000);
      const active: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "active",
        scenario: MOCK_SCENARIO,
        currentTurnIndex: 1,
        turns: [
          {
            index: 0,
            speaker: "student",
            text: "RADIO CHECK",
            timestamp: 6000,
            channel: 16,
            durationMs: 3000,
          },
        ],
      };
      const state = sessionReducer(active, {
        type: "ADD_STATION_TURN",
        text: "LOUD AND CLEAR",
        channel: 16,
      });
      expect(state.turns).toHaveLength(2);
      expect(state.turns[1]!.speaker).toBe("station");
      expect(state.turns[1]!.index).toBe(1);
      expect(state.currentTurnIndex).toBe(2);
    });
  });

  describe("COMPLETE_SCENARIO", () => {
    it("transitions from active to debriefing", () => {
      vi.spyOn(Date, "now").mockReturnValue(10000);
      const active: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "active",
        scenario: MOCK_SCENARIO,
        startedAt: 5000,
      };
      const state = sessionReducer(active, { type: "COMPLETE_SCENARIO" });
      expect(state.phase).toBe("debriefing");
      expect(state.completedAt).toBe(10000);
    });

    it("ignores COMPLETE_SCENARIO when not active", () => {
      const state = sessionReducer(INITIAL_SESSION_STATE, {
        type: "COMPLETE_SCENARIO",
      });
      expect(state.phase).toBe("loading");
    });
  });

  describe("RESET", () => {
    it("returns to initial state", () => {
      const debriefing: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "debriefing",
        scenario: MOCK_SCENARIO,
        completedAt: 10000,
      };
      const state = sessionReducer(debriefing, { type: "RESET" });
      expect(state).toEqual(INITIAL_SESSION_STATE);
    });
  });

  describe("unknown command", () => {
    it("returns state unchanged", () => {
      const state = sessionReducer(INITIAL_SESSION_STATE, {
        type: "UNKNOWN",
      } as any);
      expect(state).toBe(INITIAL_SESSION_STATE);
    });
  });
});

describe("getNextScriptedResponse", () => {
  it("returns null when not in active phase", () => {
    expect(getNextScriptedResponse(INITIAL_SESSION_STATE)).toBeNull();
  });

  it("returns null when no scenario loaded", () => {
    const active: SessionState = {
      ...INITIAL_SESSION_STATE,
      phase: "active",
      scenario: null,
    };
    expect(getNextScriptedResponse(active)).toBeNull();
  });

  it("returns first response after first student turn", () => {
    const active: SessionState = {
      ...INITIAL_SESSION_STATE,
      phase: "active",
      scenario: MOCK_SCENARIO,
      currentTurnIndex: 1,
      turns: [
        {
          index: 0,
          speaker: "student",
          text: "RADIO CHECK",
          timestamp: 1000,
          channel: 16,
          durationMs: 3000,
        },
      ],
    };
    const resp = getNextScriptedResponse(active);
    expect(resp).not.toBeNull();
    expect(resp!.id).toBe("ack");
  });

  it("skips already-played responses", () => {
    const active: SessionState = {
      ...INITIAL_SESSION_STATE,
      phase: "active",
      scenario: MOCK_SCENARIO,
      currentTurnIndex: 3,
      turns: [
        {
          index: 0,
          speaker: "student",
          text: "RADIO CHECK",
          timestamp: 1000,
          channel: 16,
          durationMs: 3000,
        },
        {
          index: 1,
          speaker: "station",
          text: "READING YOU LOUD AND CLEAR, OVER.",
          timestamp: 2000,
          channel: 16,
          durationMs: 0,
        },
        {
          index: 2,
          speaker: "student",
          text: "THANK YOU, OUT",
          timestamp: 3000,
          channel: 16,
          durationMs: 2000,
        },
      ],
    };
    const resp = getNextScriptedResponse(active);
    expect(resp).not.toBeNull();
    expect(resp!.id).toBe("confirm");
  });

  it("returns null when all responses have been played", () => {
    const active: SessionState = {
      ...INITIAL_SESSION_STATE,
      phase: "active",
      scenario: MOCK_SCENARIO,
      currentTurnIndex: 4,
      turns: [
        {
          index: 0,
          speaker: "student",
          text: "RADIO CHECK",
          timestamp: 1000,
          channel: 16,
          durationMs: 3000,
        },
        {
          index: 1,
          speaker: "station",
          text: "READING YOU LOUD AND CLEAR, OVER.",
          timestamp: 2000,
          channel: 16,
          durationMs: 0,
        },
        {
          index: 2,
          speaker: "student",
          text: "THANK YOU",
          timestamp: 3000,
          channel: 16,
          durationMs: 2000,
        },
        {
          index: 3,
          speaker: "station",
          text: "ROGER, OUT.",
          timestamp: 4000,
          channel: 16,
          durationMs: 0,
        },
      ],
    };
    const resp = getNextScriptedResponse(active);
    expect(resp).toBeNull();
  });

  it("respects channel_is condition", () => {
    const scenario: ScenarioDefinition = {
      ...MOCK_SCENARIO,
      scriptedResponses: [
        {
          id: "on-72",
          speaker: "COAST_STATION",
          text: "GO AHEAD",
          triggerAfterTurnIndex: 0,
          condition: { type: "channel_is", channel: 72 },
        },
      ],
    };
    const wrongChannel: SessionState = {
      ...INITIAL_SESSION_STATE,
      phase: "active",
      scenario,
      currentTurnIndex: 1,
      turns: [
        {
          index: 0,
          speaker: "student",
          text: "HELLO",
          timestamp: 1000,
          channel: 16,
          durationMs: 1000,
        },
      ],
    };
    expect(getNextScriptedResponse(wrongChannel)).toBeNull();

    const rightChannel: SessionState = {
      ...wrongChannel,
      turns: [
        {
          index: 0,
          speaker: "student",
          text: "HELLO",
          timestamp: 1000,
          channel: 72,
          durationMs: 1000,
        },
      ],
    };
    const resp = getNextScriptedResponse(rightChannel);
    expect(resp).not.toBeNull();
    expect(resp!.id).toBe("on-72");
  });

  describe("multi-step channel change flow", () => {
    const CHANNEL_CHANGE_SCENARIO: ScenarioDefinition = {
      ...MOCK_SCENARIO,
      id: "1.2",
      title: "Channel Change",
      requiredChannel: 16,
      allowedChannels: [16, 72],
      scriptedResponses: [
        {
          id: "instruct-channel-change",
          speaker: "COAST_STATION",
          text: "ADVISE YOU SWITCH TO CHANNEL SEVEN TWO, OVER.",
          triggerAfterTurnIndex: 0,
          condition: { type: "always" },
        },
        {
          id: "on-working-channel",
          speaker: "COAST_STATION",
          text: "ON CHANNEL SEVEN TWO, GO AHEAD, OVER.",
          triggerAfterTurnIndex: 2,
          condition: { type: "channel_is", channel: 72 },
        },
        {
          id: "closing",
          speaker: "COAST_STATION",
          text: "ROGER, OUT.",
          triggerAfterTurnIndex: 3,
          condition: { type: "always" },
        },
      ],
    };

    it("fires channel change instruction after first student turn", () => {
      const state: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "active",
        scenario: CHANNEL_CHANGE_SCENARIO,
        currentTurnIndex: 1,
        turns: [
          {
            index: 0,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK OVER",
            timestamp: 1000,
            channel: 16,
            durationMs: 3000,
          },
        ],
      };
      const resp = getNextScriptedResponse(state);
      expect(resp).not.toBeNull();
      expect(resp!.id).toBe("instruct-channel-change");
    });

    it("does not fire after acknowledgment on Ch.16 — student must switch channel", () => {
      const state: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "active",
        scenario: CHANNEL_CHANGE_SCENARIO,
        currentTurnIndex: 3,
        turns: [
          {
            index: 0,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK OVER",
            timestamp: 1000,
            channel: 16,
            durationMs: 3000,
          },
          {
            index: 1,
            speaker: "station",
            text: "ADVISE YOU SWITCH TO CHANNEL SEVEN TWO, OVER.",
            timestamp: 2000,
            channel: 16,
            durationMs: 0,
          },
          {
            index: 2,
            speaker: "student",
            text: "RECEIVED SWITCHING TO CHANNEL SEVEN TWO OUT",
            timestamp: 3000,
            channel: 16,
            durationMs: 3000,
          },
        ],
      };
      expect(getNextScriptedResponse(state)).toBeNull();
    });

    it("does not fire working-channel response if student re-hails on wrong channel", () => {
      const state: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "active",
        scenario: CHANNEL_CHANGE_SCENARIO,
        currentTurnIndex: 5,
        turns: [
          {
            index: 0,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK OVER",
            timestamp: 1000,
            channel: 16,
            durationMs: 3000,
          },
          {
            index: 1,
            speaker: "station",
            text: "ADVISE YOU SWITCH TO CHANNEL SEVEN TWO, OVER.",
            timestamp: 2000,
            channel: 16,
            durationMs: 0,
          },
          {
            index: 2,
            speaker: "student",
            text: "RECEIVED OUT",
            timestamp: 3000,
            channel: 16,
            durationMs: 2000,
          },
          {
            index: 3,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK ON CHANNEL SEVEN TWO OVER",
            timestamp: 4000,
            channel: 16,
            durationMs: 3000,
          },
        ],
      };
      expect(getNextScriptedResponse(state)).toBeNull();
    });

    it("fires working-channel response after student re-hails on Ch.72", () => {
      const state: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "active",
        scenario: CHANNEL_CHANGE_SCENARIO,
        currentTurnIndex: 5,
        turns: [
          {
            index: 0,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK OVER",
            timestamp: 1000,
            channel: 16,
            durationMs: 3000,
          },
          {
            index: 1,
            speaker: "station",
            text: "ADVISE YOU SWITCH TO CHANNEL SEVEN TWO, OVER.",
            timestamp: 2000,
            channel: 16,
            durationMs: 0,
          },
          {
            index: 2,
            speaker: "student",
            text: "RECEIVED OUT",
            timestamp: 3000,
            channel: 16,
            durationMs: 2000,
          },
          {
            index: 3,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK ON CHANNEL SEVEN TWO OVER",
            timestamp: 4000,
            channel: 72,
            durationMs: 3000,
          },
        ],
      };
      const resp = getNextScriptedResponse(state);
      expect(resp).not.toBeNull();
      expect(resp!.id).toBe("on-working-channel");
    });

    it("fires closing response after routine message on Ch.72", () => {
      const state: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "active",
        scenario: CHANNEL_CHANGE_SCENARIO,
        currentTurnIndex: 7,
        turns: [
          {
            index: 0,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK OVER",
            timestamp: 1000,
            channel: 16,
            durationMs: 3000,
          },
          {
            index: 1,
            speaker: "station",
            text: "ADVISE YOU SWITCH TO CHANNEL SEVEN TWO, OVER.",
            timestamp: 2000,
            channel: 16,
            durationMs: 0,
          },
          {
            index: 2,
            speaker: "student",
            text: "RECEIVED OUT",
            timestamp: 3000,
            channel: 16,
            durationMs: 2000,
          },
          {
            index: 3,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK ON CHANNEL SEVEN TWO OVER",
            timestamp: 4000,
            channel: 72,
            durationMs: 3000,
          },
          {
            index: 4,
            speaker: "station",
            text: "ON CHANNEL SEVEN TWO, GO AHEAD, OVER.",
            timestamp: 5000,
            channel: 72,
            durationMs: 0,
          },
          {
            index: 5,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK REQUEST WEATHER OVER",
            timestamp: 6000,
            channel: 72,
            durationMs: 3000,
          },
        ],
      };
      const resp = getNextScriptedResponse(state);
      expect(resp).not.toBeNull();
      expect(resp!.id).toBe("closing");
    });

    it("returns null after all responses have been played", () => {
      const state: SessionState = {
        ...INITIAL_SESSION_STATE,
        phase: "active",
        scenario: CHANNEL_CHANGE_SCENARIO,
        currentTurnIndex: 8,
        turns: [
          {
            index: 0,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK OVER",
            timestamp: 1000,
            channel: 16,
            durationMs: 3000,
          },
          {
            index: 1,
            speaker: "station",
            text: "ADVISE YOU SWITCH TO CHANNEL SEVEN TWO, OVER.",
            timestamp: 2000,
            channel: 16,
            durationMs: 0,
          },
          {
            index: 2,
            speaker: "student",
            text: "RECEIVED OUT",
            timestamp: 3000,
            channel: 16,
            durationMs: 2000,
          },
          {
            index: 3,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK ON CHANNEL SEVEN TWO OVER",
            timestamp: 4000,
            channel: 72,
            durationMs: 3000,
          },
          {
            index: 4,
            speaker: "station",
            text: "ON CHANNEL SEVEN TWO, GO AHEAD, OVER.",
            timestamp: 5000,
            channel: 72,
            durationMs: 0,
          },
          {
            index: 5,
            speaker: "student",
            text: "RCC HAIFA THIS IS BLUE DUCK REQUEST WEATHER OVER",
            timestamp: 6000,
            channel: 72,
            durationMs: 3000,
          },
          {
            index: 6,
            speaker: "station",
            text: "ROGER, OUT.",
            timestamp: 7000,
            channel: 72,
            durationMs: 0,
          },
        ],
      };
      expect(getNextScriptedResponse(state)).toBeNull();
    });
  });

  it("respects transcript_contains condition", () => {
    const scenario: ScenarioDefinition = {
      ...MOCK_SCENARIO,
      scriptedResponses: [
        {
          id: "heard-mayday",
          speaker: "COAST_STATION",
          text: "RECEIVED MAYDAY",
          triggerAfterTurnIndex: 0,
          condition: { type: "transcript_contains", pattern: "MAYDAY" },
        },
      ],
    };
    const noMatch: SessionState = {
      ...INITIAL_SESSION_STATE,
      phase: "active",
      scenario,
      currentTurnIndex: 1,
      turns: [
        {
          index: 0,
          speaker: "student",
          text: "HELLO",
          timestamp: 1000,
          channel: 16,
          durationMs: 1000,
        },
      ],
    };
    expect(getNextScriptedResponse(noMatch)).toBeNull();

    const match: SessionState = {
      ...noMatch,
      turns: [
        {
          index: 0,
          speaker: "student",
          text: "MAYDAY MAYDAY MAYDAY",
          timestamp: 1000,
          channel: 16,
          durationMs: 3000,
        },
      ],
    };
    expect(getNextScriptedResponse(match)).not.toBeNull();
  });
});
