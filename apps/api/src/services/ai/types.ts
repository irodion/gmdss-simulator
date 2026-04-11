/**
 * AI Adapter interfaces for the GMDSS simulator voice loop.
 *
 * All AI provider interactions go through these interfaces, enabling:
 * - Provider swapping (OpenAI, OpenRouter, self-hosted, mock)
 * - Fallback chains (primary fails → fallback provider)
 * - Deterministic testing with mock adapters
 */

// ── STT (Speech-to-Text) ────────────────────────────────────────

export interface SttOptions {
  readonly mimeType: string;
  readonly language: string;
  /** Maritime vocabulary hint for accuracy (e.g. "MAYDAY, PAN PAN, SECURITE") */
  readonly prompt?: string;
}

export interface SttResult {
  readonly text: string;
  /** 0–1 confidence score (if available from provider, else 1) */
  readonly confidence: number;
  readonly provider: string;
  readonly durationMs: number;
}

export interface SttAdapter {
  transcribe(audio: Buffer, opts: SttOptions): Promise<SttResult>;
}

// ── LLM (Large Language Model) ───────────────────────────────────

export interface LlmMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface LlmPrompt {
  readonly systemPrompt: string;
  readonly messages: readonly LlmMessage[];
  readonly maxTokens?: number;
}

export interface LlmResult {
  readonly text: string;
  readonly provider: string;
  /** SHA-256 hex hash of the system prompt (for attempt record auditability) */
  readonly promptHash: string;
  readonly durationMs: number;
}

export interface LlmAdapter {
  generateResponse(prompt: LlmPrompt): Promise<LlmResult>;
}

// ── TTS (Text-to-Speech) ─────────────────────────────────────────

export interface TtsOptions {
  readonly voiceId: string;
  readonly speed?: number;
}

export interface TtsResult {
  readonly audio: Buffer;
  readonly mimeType: string;
  readonly provider: string;
  readonly durationMs: number;
}

export interface TtsAdapter {
  synthesize(text: string, opts: TtsOptions): Promise<TtsResult>;
}

// ── Adapter Set ──────────────────────────────────────────────────

export interface AdapterSet {
  readonly stt: SttAdapter;
  readonly llm: LlmAdapter;
  readonly tts: TtsAdapter;
}

// ── Station Persona ──────────────────────────────────────────────

export type StationPersonaId =
  | "COAST_GUARD_MRCC"
  | "PORT_CONTROL_VTS"
  | "VESSEL"
  | "COAST_STATION"
  | "FISHING_VESSEL";

export interface StationPersona {
  readonly id: StationPersonaId;
  readonly label: string;
  readonly defaultCallsign: string;
  readonly defaultMmsi: string;
  readonly roleDescription: string;
  /** TTS voice ID mapped to this persona */
  readonly voiceId: string;
}

export interface PersonaContext {
  readonly stationName: string;
  readonly callsign: string;
  readonly mmsi: string;
  readonly scenarioDescription: string;
  readonly vesselName: string;
  readonly vesselCallsign?: string;
  readonly vesselMmsi?: string;
}
