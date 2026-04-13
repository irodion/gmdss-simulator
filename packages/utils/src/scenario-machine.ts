import type { ScriptedResponse, SessionCommand, SessionState, Turn } from "./scenario-types.ts";

export const INITIAL_SESSION_STATE: SessionState = {
  phase: "loading",
  scenario: null,
  turns: [],
  currentTurnIndex: 0,
  startedAt: null,
  completedAt: null,
};

export function sessionReducer(state: SessionState, command: SessionCommand): SessionState {
  switch (command.type) {
    case "LOAD_SCENARIO": {
      if (state.phase !== "loading") return state;
      return {
        ...state,
        phase: "briefing",
        scenario: command.scenario,
        turns: [],
        currentTurnIndex: 0,
        startedAt: null,
        completedAt: null,
      };
    }

    case "START_SCENARIO": {
      if (state.phase !== "briefing") return state;
      return {
        ...state,
        phase: "active",
        startedAt: Date.now(),
      };
    }

    case "ADD_STUDENT_TURN": {
      if (state.phase !== "active") return state;
      const turn: Turn = {
        index: state.currentTurnIndex,
        speaker: "student",
        text: command.text,
        timestamp: Date.now(),
        channel: command.channel,
        durationMs: command.durationMs,
      };
      return {
        ...state,
        turns: [...state.turns, turn],
        currentTurnIndex: state.currentTurnIndex + 1,
      };
    }

    case "ADD_STATION_TURN": {
      if (state.phase !== "active") return state;
      const turn: Turn = {
        index: state.currentTurnIndex,
        speaker: "station",
        text: command.text,
        timestamp: Date.now(),
        channel: command.channel,
        durationMs: 0,
      };
      return {
        ...state,
        turns: [...state.turns, turn],
        currentTurnIndex: state.currentTurnIndex + 1,
      };
    }

    case "UPDATE_TURN_TEXT": {
      const turn = state.turns[command.turnIndex];
      if (!turn) return state;
      const updated: Turn = { ...turn, text: command.text };
      const turns = [...state.turns];
      turns[command.turnIndex] = updated;
      return { ...state, turns };
    }

    case "COMPLETE_SCENARIO": {
      if (state.phase !== "active") return state;
      return {
        ...state,
        phase: "debriefing",
        completedAt: Date.now(),
      };
    }

    case "RESET": {
      return INITIAL_SESSION_STATE;
    }

    default:
      return state;
  }
}

/**
 * Find the next scripted response that should be played, based on
 * the number of student turns completed so far.
 */
export function getNextScriptedResponse(state: SessionState): ScriptedResponse | null {
  if (state.phase !== "active" || !state.scenario) return null;

  const studentTurnCount = state.turns.filter((t) => t.speaker === "student").length;
  const lastStudentTurn = [...state.turns].reverse().find((t) => t.speaker === "student");

  for (const resp of state.scenario.scriptedResponses) {
    // Already played? Check if a station turn with this response's text exists
    const alreadyPlayed = state.turns.some((t) => t.speaker === "station" && t.text === resp.text);
    if (alreadyPlayed) continue;

    // Check trigger condition
    if (resp.triggerAfterTurnIndex >= studentTurnCount) continue;

    // Check optional condition
    if (resp.condition) {
      switch (resp.condition.type) {
        case "always":
          break;
        case "channel_is":
          if (!lastStudentTurn || lastStudentTurn.channel !== resp.condition.channel) continue;
          break;
        case "transcript_contains": {
          if (!lastStudentTurn) continue;
          try {
            // nosemgrep: detect-non-literal-regexp
            const re = new RegExp(resp.condition.pattern, "i");
            if (!re.test(lastStudentTurn.text)) continue;
          } catch {
            continue;
          }
          break;
        }
        default: {
          const _exhaustive: never = resp.condition;
          void _exhaustive;
        }
      }
    }

    return resp;
  }

  return null;
}
