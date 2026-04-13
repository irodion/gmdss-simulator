import type { SttAdapter, SttOptions, SttResult } from "./types.ts";

export interface MockSttConfig {
  /** Text to return for all transcriptions */
  readonly text?: string;
  /** Confidence score to return (0–1) */
  readonly confidence?: number;
  /** Simulated processing delay in ms */
  readonly delayMs?: number;
  /** If true, transcribe() rejects with an error */
  readonly shouldFail?: boolean;
  /** Custom error message when shouldFail is true */
  readonly errorMessage?: string;
}

const DEFAULTS: Required<MockSttConfig> = {
  text: "ANYTOWN RADIO ANYTOWN RADIO ANYTOWN RADIO THIS IS BLUE DUCK BLUE DUCK BLUE DUCK RADIO CHECK ON CHANNEL ONE SIX OVER",
  confidence: 0.92,
  delayMs: 50,
  shouldFail: false,
  errorMessage: "Mock STT failure",
};

export class MockSttAdapter implements SttAdapter {
  private readonly config: Required<MockSttConfig>;

  constructor(config: MockSttConfig = {}) {
    this.config = { ...DEFAULTS, ...config };
  }

  async transcribe(_audio: Buffer, _opts: SttOptions): Promise<SttResult> {
    if (this.config.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delayMs));
    }

    if (this.config.shouldFail) {
      throw new Error(this.config.errorMessage);
    }

    return {
      text: this.config.text,
      confidence: this.config.confidence,
      provider: "mock",
      durationMs: this.config.delayMs,
    };
  }
}
