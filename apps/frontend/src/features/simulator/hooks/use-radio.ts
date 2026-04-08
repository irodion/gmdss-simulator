import { useCallback, useReducer } from "react";
import {
  radioReducer,
  INITIAL_RADIO_STATE,
  type RadioCommand,
  type RadioEvent,
  type RadioState,
} from "@gmdss-simulator/utils";

const MAX_EVENTS = 200;

export interface UseRadioResult {
  state: RadioState;
  send: (command: RadioCommand) => void;
  reset: () => void;
  events: readonly RadioEvent[];
}

type Action = { kind: "command"; command: RadioCommand } | { kind: "reset" };

function eventLoggingReducer(state: { radio: RadioState; events: RadioEvent[] }, action: Action) {
  if (action.kind === "reset") {
    return { radio: INITIAL_RADIO_STATE, events: [] as RadioEvent[] };
  }
  const next = radioReducer(state.radio, action.command);
  const event: RadioEvent = {
    timestamp: Date.now(),
    command: action.command,
    prevState: state.radio,
    nextState: next,
  };
  const events =
    state.events.length >= MAX_EVENTS
      ? [...state.events.slice(-MAX_EVENTS + 1), event]
      : [...state.events, event];
  return { radio: next, events };
}

const INITIAL = { radio: INITIAL_RADIO_STATE, events: [] as RadioEvent[] };

export function useRadio(): UseRadioResult {
  const [state, dispatch] = useReducer(eventLoggingReducer, INITIAL);

  const send = useCallback((command: RadioCommand) => {
    dispatch({ kind: "command", command });
  }, []);

  const reset = useCallback(() => {
    dispatch({ kind: "reset" });
  }, []);

  return { state: state.radio, send, reset, events: state.events };
}
