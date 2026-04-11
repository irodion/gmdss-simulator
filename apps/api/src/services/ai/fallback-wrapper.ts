/**
 * Fallback adapter wrapper.
 * Tries the primary adapter; on failure, falls back to the secondary.
 * Records which adapter was used for auditability.
 */

import type { SttAdapter, SttOptions, SttResult } from "./types.ts";
import type { LlmAdapter, LlmPrompt, LlmResult } from "./types.ts";
import type { TtsAdapter, TtsOptions, TtsResult } from "./types.ts";

export class FallbackSttAdapter implements SttAdapter {
  readonly primary: SttAdapter;
  readonly fallback: SttAdapter;

  constructor(primary: SttAdapter, fallback: SttAdapter) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async transcribe(audio: Buffer, opts: SttOptions): Promise<SttResult> {
    try {
      return await this.primary.transcribe(audio, opts);
    } catch {
      const result = await this.fallback.transcribe(audio, opts);
      return { ...result, provider: `${result.provider} (fallback)` };
    }
  }
}

export class FallbackLlmAdapter implements LlmAdapter {
  readonly primary: LlmAdapter;
  readonly fallback: LlmAdapter;

  constructor(primary: LlmAdapter, fallback: LlmAdapter) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async generateResponse(prompt: LlmPrompt): Promise<LlmResult> {
    try {
      return await this.primary.generateResponse(prompt);
    } catch {
      const result = await this.fallback.generateResponse(prompt);
      return { ...result, provider: `${result.provider} (fallback)` };
    }
  }
}

export class FallbackTtsAdapter implements TtsAdapter {
  readonly primary: TtsAdapter;
  readonly fallback: TtsAdapter;

  constructor(primary: TtsAdapter, fallback: TtsAdapter) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async synthesize(text: string, opts: TtsOptions): Promise<TtsResult> {
    try {
      return await this.primary.synthesize(text, opts);
    } catch {
      const result = await this.fallback.synthesize(text, opts);
      return { ...result, provider: `${result.provider} (fallback)` };
    }
  }
}
