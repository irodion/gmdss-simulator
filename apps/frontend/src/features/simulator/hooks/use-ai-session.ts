import { useCallback, useEffect, useRef, useState } from "react";
import type { ScoreBreakdown, SessionCommand, SessionState } from "@gmdss-simulator/utils";

import { WsClient, type WsStatus } from "../transport/ws-client.ts";
import { TurnManager } from "../transport/turn-manager.ts";
import type { ServerMessage, TurnStatus } from "../transport/transport-types.ts";
import { VOICE_TRANSMISSION_PLACEHOLDER } from "../constants.ts";
import type { UseAudioResult } from "./use-audio.ts";
import type { UseRadioResult } from "./use-radio.ts";

export interface AiSessionState {
  /** WebSocket connection status */
  wsStatus: WsStatus;
  /** Whether AI mode is active (connected and session started) */
  aiActive: boolean;
  /** Current turn processing status */
  turnStatus: TurnStatus | "idle" | "complete";
  /** Session ID assigned by server */
  sessionId: string | null;
  /** Number of consecutive STT failures (for typed fallback) */
  sttFailureCount: number;
  /** Saved attempt ID */
  savedAttemptId: string | null;
  /** Last error message */
  lastError: string | null;
  /** Latest score from AI pipeline */
  latestScore: ScoreBreakdown | null;
}

const INITIAL_STATE: AiSessionState = {
  wsStatus: "disconnected",
  aiActive: false,
  turnStatus: "idle",
  sessionId: null,
  sttFailureCount: 0,
  savedAttemptId: null,
  lastError: null,
  latestScore: null,
};

interface Options {
  session: { state: SessionState; dispatch: (cmd: SessionCommand) => void };
  radio: UseRadioResult;
  audio: UseAudioResult;
  apiUrl: string;
  enabled: boolean;
}

export interface UseAiSessionResult {
  state: AiSessionState;
  /** Connect to the AI server and start a session for the current scenario */
  startAiSession: () => void;
  /** Send a student text transmission via the AI pipeline */
  sendTextTurn: (text: string, channel: number) => void;
  /** Send recorded audio via the AI pipeline */
  sendAudioTurn: (audioBlob: Blob, channel: number) => void;
  /** End the session and save the attempt */
  endAiSession: () => void;
  /** Disconnect from the server */
  disconnect: () => void;
}

export function useAiSession({
  session,
  radio,
  audio,
  apiUrl,
  enabled,
}: Options): UseAiSessionResult {
  const [state, setState] = useState<AiSessionState>(INITIAL_STATE);
  const wsRef = useRef<WsClient | null>(null);
  const turnMgrRef = useRef(new TurnManager());
  const sessionRef = useRef(session);
  const radioRef = useRef(radio);
  const audioRef = useRef(audio);

  sessionRef.current = session;
  radioRef.current = radio;
  audioRef.current = audio;

  const handleMessage = useCallback((msg: ServerMessage) => {
    const turnMgr = turnMgrRef.current;

    switch (msg.type) {
      case "session_ready":
        setState((s) => ({ ...s, aiActive: true, sessionId: msg.sessionId }));
        break;

      case "stt_result": {
        if (turnMgr.isStale(msg.turnId)) return;
        setState((s) => ({ ...s, sttFailureCount: 0 }));
        // Replace voice placeholder with the actual STT transcript
        const turns = sessionRef.current.state.turns;
        const lastStudentIdx = turns.findLastIndex(
          (t) => t.speaker === "student" && t.text === VOICE_TRANSMISSION_PLACEHOLDER,
        );
        if (lastStudentIdx >= 0) {
          sessionRef.current.dispatch({
            type: "UPDATE_TURN_TEXT",
            turnIndex: lastStudentIdx,
            text: msg.text,
          });
        }
        break;
      }

      case "score":
        if (turnMgr.isStale(msg.turnId)) return;
        setState((s) => ({ ...s, latestScore: msg.breakdown }));
        break;

      case "response_text":
        if (turnMgr.isStale(msg.turnId)) return;
        radioRef.current.send({ type: "BEGIN_RECEIVE" });
        sessionRef.current.dispatch({
          type: "ADD_STATION_TURN",
          text: msg.text,
          channel: sessionRef.current.state.scenario?.requiredChannel ?? 16,
        });
        break;

      case "response_audio":
        if (turnMgr.isStale(msg.turnId)) return;
        void playResponseAudio(msg.data).finally(() => {
          radioRef.current.send({ type: "END_RECEIVE" });
          setState((s) => ({ ...s, turnStatus: "complete" }));
        });
        break;

      case "turn_status":
        if (turnMgr.isStale(msg.turnId)) return;
        setState((s) => {
          // Track STT failures for typed fallback
          if (msg.status === "error") {
            return { ...s, turnStatus: msg.status, sttFailureCount: s.sttFailureCount + 1 };
          }
          return { ...s, turnStatus: msg.status };
        });
        // On fallback (no audio), end receive after a delay
        if (msg.status === "fallback") {
          setTimeout(() => {
            radioRef.current.send({ type: "END_RECEIVE" });
            setState((s) => ({ ...s, turnStatus: "complete" }));
          }, 800);
        }
        break;

      case "error":
        if (msg.turnId != null) {
          setState((s) => ({
            ...s,
            lastError: msg.message,
            turnStatus: "error",
            sttFailureCount: s.sttFailureCount + 1,
          }));
        } else {
          // Session-level error (e.g. SCENARIO_LOAD_FAILED) — disconnect so
          // SimulatorPage falls back to scripted mode instead of staying stuck
          wsRef.current?.disconnect();
          wsRef.current = null;
          setState((s) => ({
            ...s,
            lastError: msg.message,
            aiActive: false,
            wsStatus: "disconnected",
          }));
        }
        break;

      case "session_saved":
        setState((s) => ({ ...s, savedAttemptId: msg.attemptId }));
        break;
    }
  }, []);

  async function playResponseAudio(base64Data: string): Promise<void> {
    try {
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      await audioRef.current.playAudioBuffer(bytes.buffer as ArrayBuffer);
    } catch {
      // TTS playback failed — transcript already has the text response
    }
  }

  const startAiSession = useCallback(() => {
    if (!enabled || !session.state.scenario) return;

    const scenarioId = session.state.scenario.id;

    const ws = new WsClient({
      apiUrl,
      onMessage: handleMessage,
      onStatusChange: (status) => {
        setState((s) => ({
          ...s,
          wsStatus: status,
          aiActive: status === "connected" ? s.aiActive : false,
        }));

        // Send session_start as soon as connected
        if (status === "connected") {
          ws.send({ type: "session_start", scenarioId });
        }
      },
    });

    wsRef.current = ws;
    turnMgrRef.current.reset();
    ws.connect();
  }, [enabled, session.state.scenario, apiUrl, handleMessage]);

  const sendTextTurn = useCallback((text: string, channel: number) => {
    const ws = wsRef.current;
    if (!ws?.isConnected) return;

    const turnId = turnMgrRef.current.nextTurn();
    setState((s) => ({ ...s, turnStatus: "processing" }));
    ws.send({ type: "text_input", turnId, channel, text });
  }, []);

  const sendAudioTurn = useCallback((audioBlob: Blob, channel: number) => {
    const ws = wsRef.current;
    if (!ws?.isConnected) return;

    const turnId = turnMgrRef.current.nextTurn();
    setState((s) => ({ ...s, turnStatus: "processing" }));

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1] ?? "";
      ws.send({
        type: "audio_data",
        turnId,
        channel,
        data: base64,
        mimeType: audioBlob.type || "audio/webm",
      });
    };
    reader.readAsDataURL(audioBlob);
  }, []);

  const endAiSession = useCallback(() => {
    wsRef.current?.send({ type: "session_end" });
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setState(INITIAL_STATE);
    turnMgrRef.current.reset();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.disconnect();
      wsRef.current = null;
    };
  }, []);

  return {
    state,
    startAiSession,
    sendTextTurn,
    sendAudioTurn,
    endAiSession,
    disconnect,
  };
}
