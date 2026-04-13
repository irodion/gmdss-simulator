/**
 * AI Pipeline — orchestrates a single simulator turn:
 * audio/text → STT → rubric scoring → LLM response → TTS audio
 */

import {
  scoreTranscript,
  type RubricDefinition,
  type ScoreBreakdown,
  type Turn,
} from "@gmdss-simulator/utils";

import type { AdapterSet, LlmMessage, PersonaContext, StationPersona } from "./ai/types.ts";
import { buildSystemPrompt, turnsToLlmMessages } from "./ai/personas.ts";

export interface TurnInput {
  readonly turnId: number;
  /** Raw audio buffer (mutually exclusive with text) */
  readonly audio?: Buffer;
  readonly audioMimeType?: string;
  /** Text input — typed fallback (mutually exclusive with audio) */
  readonly text?: string;
}

export interface TurnContext {
  readonly persona: StationPersona;
  readonly personaContext: PersonaContext;
  readonly rubric: RubricDefinition;
  readonly requiredChannel: number;
  readonly allowedChannels?: readonly number[];
  readonly currentChannel: number;
  readonly previousTurns: readonly Turn[];
}

export interface TurnResult {
  readonly turnId: number;
  readonly transcript: string;
  readonly sttConfidence: number;
  readonly score: ScoreBreakdown;
  readonly responseText: string;
  readonly responseAudio: Buffer;
  readonly responseAudioMimeType: string;
  readonly sttProvider: string;
  readonly llmProvider: string;
  readonly llmPromptHash: string;
  readonly ttsProvider: string;
}

/**
 * Process a single simulator turn through the full AI pipeline.
 * Supports cancellation via AbortSignal.
 */
export async function processTurn(
  input: TurnInput,
  context: TurnContext,
  adapters: AdapterSet,
  signal?: AbortSignal,
): Promise<TurnResult> {
  // 1. STT — transcribe audio to text (skip if typed input)
  let transcript: string;
  let sttConfidence: number;
  let sttProvider: string;

  if (input.text) {
    transcript = input.text.toUpperCase();
    sttConfidence = 1;
    sttProvider = "text-input";
  } else if (input.audio) {
    throwIfAborted(signal);
    const sttResult = await adapters.stt.transcribe(input.audio, {
      mimeType: input.audioMimeType ?? "audio/webm",
      language: "en",
    });
    transcript = sttResult.text;
    sttConfidence = sttResult.confidence;
    sttProvider = sttResult.provider;
  } else {
    throw new Error("Turn must have either audio or text input");
  }

  // 2. Score — deterministic rubric scoring
  throwIfAborted(signal);
  const allTurns: Turn[] = [
    ...context.previousTurns,
    {
      index: context.previousTurns.length,
      speaker: "student",
      text: transcript,
      timestamp: Date.now(),
      channel: context.currentChannel,
      durationMs: 0,
    },
  ];
  const score = scoreTranscript(
    allTurns,
    context.rubric,
    context.requiredChannel,
    context.allowedChannels,
  );

  // 3. LLM — generate station response
  throwIfAborted(signal);
  const systemPrompt = buildSystemPrompt(context.persona, context.personaContext);
  const messages: LlmMessage[] = [
    ...turnsToLlmMessages(context.previousTurns),
    { role: "user", content: transcript },
  ];

  const llmResult = await raceAbort(
    adapters.llm.generateResponse({ systemPrompt, messages, maxTokens: 300 }),
    signal,
  );

  // 4. TTS — synthesize response audio
  throwIfAborted(signal);
  const ttsResult = await raceAbort(
    adapters.tts.synthesize(llmResult.text, { voiceId: context.persona.voiceId }),
    signal,
  );

  return {
    turnId: input.turnId,
    transcript,
    sttConfidence,
    score,
    responseText: llmResult.text,
    responseAudio: ttsResult.audio,
    responseAudioMimeType: ttsResult.mimeType,
    sttProvider,
    llmProvider: llmResult.provider,
    llmPromptHash: llmResult.promptHash,
    ttsProvider: ttsResult.provider,
  };
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Turn cancelled");
  }
}

/** Race a promise against an AbortSignal so hung providers don't block forever. */
function raceAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(new Error("Turn cancelled"));
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      signal.addEventListener("abort", () => reject(new Error("Turn cancelled")), { once: true });
    }),
  ]);
}
