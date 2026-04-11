import type { TtsAdapter, TtsOptions, TtsResult } from "./types.ts";

export interface MockTtsConfig {
  /** Simulated processing delay in ms */
  readonly delayMs?: number;
  /** If true, synthesize() rejects with an error */
  readonly shouldFail?: boolean;
  /** Custom error message when shouldFail is true */
  readonly errorMessage?: string;
  /** Size of the silence buffer in bytes (default: 1024) */
  readonly silenceBytes?: number;
}

const DEFAULTS: Required<MockTtsConfig> = {
  delayMs: 50,
  shouldFail: false,
  errorMessage: "Mock TTS failure",
  silenceBytes: 1024,
};

/**
 * Create a minimal valid WAV file header + silence.
 * 16-bit PCM mono 24000 Hz — matches typical TTS output format.
 */
function createSilenceWav(numSamples: number): Buffer {
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(24000, 24); // sample rate
  buffer.writeUInt32LE(48000, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk (all zeros = silence)
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

export class MockTtsAdapter implements TtsAdapter {
  private readonly config: Required<MockTtsConfig>;

  constructor(config: MockTtsConfig = {}) {
    this.config = { ...DEFAULTS, ...config };
  }

  async synthesize(_text: string, _opts: TtsOptions): Promise<TtsResult> {
    if (this.config.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delayMs));
    }

    if (this.config.shouldFail) {
      throw new Error(this.config.errorMessage);
    }

    const audio = createSilenceWav(this.config.silenceBytes);

    return {
      audio,
      mimeType: "audio/wav",
      provider: "mock",
      durationMs: this.config.delayMs,
    };
  }
}
