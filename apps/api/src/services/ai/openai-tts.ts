/**
 * OpenAI-compatible TTS adapter.
 * Works with OpenAI TTS API or any OpenAI-compatible speech endpoint.
 */

import OpenAI from "openai";

import type { TtsAdapter, TtsOptions, TtsResult } from "./types.ts";

export interface OpenAiTtsConfig {
  readonly baseUrl?: string;
  readonly apiKey: string;
  readonly model?: string;
}

export class OpenAiTtsAdapter implements TtsAdapter {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: OpenAiTtsConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
    });
    this.model = config.model ?? "tts-1";
  }

  async synthesize(text: string, opts: TtsOptions): Promise<TtsResult> {
    const start = Date.now();

    const response = await this.client.audio.speech.create({
      model: this.model,
      voice: opts.voiceId as OpenAI.Audio.SpeechCreateParams["voice"],
      input: text,
      speed: opts.speed ?? 1.0,
      response_format: "wav",
    });

    const arrayBuffer = await response.arrayBuffer();
    const audio = Buffer.from(arrayBuffer);
    const durationMs = Date.now() - start;

    return {
      audio,
      mimeType: "audio/wav",
      provider: `openai/${this.model}`,
      durationMs,
    };
  }
}
