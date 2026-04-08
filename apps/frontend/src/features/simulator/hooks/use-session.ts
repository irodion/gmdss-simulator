import { useReducer } from "react";
import {
  sessionReducer,
  INITIAL_SESSION_STATE,
  type SessionCommand,
  type SessionState,
} from "@gmdss-simulator/utils";

export interface UseSessionResult {
  state: SessionState;
  dispatch: (command: SessionCommand) => void;
}

export function useSession(): UseSessionResult {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_SESSION_STATE);
  return { state, dispatch };
}
