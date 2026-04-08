import { useEffect, useRef } from "react";
import {
  getNextScriptedResponse,
  type SessionState,
  type SessionCommand,
} from "@gmdss-simulator/utils";
import type { UseAudioResult } from "./use-audio.ts";
import type { UseRadioResult } from "./use-radio.ts";

const RADIO_DELAY_MS = 800;

interface Options {
  session: { state: SessionState; dispatch: (cmd: SessionCommand) => void };
  radio: UseRadioResult;
  audio: UseAudioResult;
}

export function useScriptedResponses({ session, radio, audio }: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(session);
  const radioRef = useRef(radio);
  const audioRef = useRef(audio);
  const mountedRef = useRef(true);

  sessionRef.current = session;
  radioRef.current = radio;
  audioRef.current = audio;

  const turnCount = session.state.turns.length;
  const phase = session.state.phase;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== "active") return;

    const s = sessionRef.current;
    const resp = getNextScriptedResponse(s.state);
    if (!resp) return;

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      radioRef.current.send({ type: "BEGIN_RECEIVE" });
      sessionRef.current.dispatch({
        type: "ADD_STATION_TURN",
        text: resp.text,
        channel: sessionRef.current.state.scenario?.requiredChannel ?? 16,
      });
      void audioRef.current
        .speak(resp.text)
        .catch(() => {})
        .finally(() => {
          if (mountedRef.current) {
            radioRef.current.send({ type: "END_RECEIVE" });
          }
        });
    }, RADIO_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [turnCount, phase]);
}
