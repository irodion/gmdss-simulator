/**
 * WebSocket protocol message types for the simulator voice loop.
 * Must stay in sync with server-side definitions in apps/api/src/routes/simulator/ws.ts.
 */

import type { ScoreBreakdown } from "@gmdss-simulator/utils";

// ── Client → Server ──────────────────────────────────────────────

export type ClientMessage =
  | { type: "session_start"; scenarioId: string }
  | { type: "audio_data"; turnId: number; channel: number; data: string; mimeType: string }
  | { type: "text_input"; turnId: number; channel: number; text: string }
  | { type: "cancel_turn"; turnId: number }
  | { type: "session_end" };

// ── Server → Client ──────────────────────────────────────────────

export type TurnStatus = "processing" | "slow" | "timeout" | "error" | "fallback";

export type ServerMessage =
  | { type: "session_ready"; sessionId: string }
  | { type: "stt_result"; turnId: number; text: string; confidence: number }
  | { type: "score"; turnId: number; breakdown: ScoreBreakdown }
  | { type: "response_text"; turnId: number; text: string; persona: string }
  | { type: "response_audio"; turnId: number; data: string; mimeType: string }
  | { type: "turn_status"; turnId: number; status: TurnStatus }
  | { type: "error"; turnId?: number; code: string; message: string }
  | { type: "session_saved"; attemptId: string };
