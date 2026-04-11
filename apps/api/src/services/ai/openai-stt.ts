/**
 * OpenAI-compatible STT adapter.
 * Works with OpenAI Whisper API, OpenRouter, Groq, or any OpenAI-compatible proxy.
 */

import OpenAI from "openai";

import type { SttAdapter, SttOptions, SttResult } from "./types.ts";

export interface OpenAiSttConfig {
  readonly baseUrl?: string;
  readonly apiKey: string;
  readonly model?: string;
}

/** Maritime vocabulary hint to improve STT accuracy */
const MARITIME_PROMPT =
  "MAYDAY, PAN PAN, SECURITE, OVER, OUT, ROGER, SAY AGAIN, CORRECTION, THIS IS, " +
  "Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliet, Kilo, Lima, " +
  "Mike, November, Oscar, Papa, Quebec, Romeo, Sierra, Tango, Uniform, Victor, Whiskey, " +
  "X-ray, Yankee, Zulu, MMSI, DSC, VHF, Channel, latitude, longitude, degrees, minutes, " +
  "north, south, east, west, knots, nautical miles, port, starboard";

export class OpenAiSttAdapter implements SttAdapter {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: OpenAiSttConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseUrl ? { baseURL: config.baseUrl } : {}),
    });
    this.model = config.model ?? "whisper-1";
  }

  async transcribe(audio: Buffer, opts: SttOptions): Promise<SttResult> {
    const start = Date.now();

    // Determine file extension from MIME type for the API
    const ext = mimeToExt(opts.mimeType);
    const file = new File([new Uint8Array(audio)], `audio.${ext}`, { type: opts.mimeType });

    const response = await this.client.audio.transcriptions.create({
      file,
      model: this.model,
      language: opts.language,
      prompt: opts.prompt ?? MARITIME_PROMPT,
      response_format: "verbose_json",
    });

    const durationMs = Date.now() - start;

    // verbose_json returns segments with avg_logprob, use as confidence proxy
    const segments = "segments" in response ? (response.segments as SegmentInfo[] | undefined) : [];
    const avgLogProb =
      segments && segments.length > 0
        ? segments.reduce((sum, s) => sum + s.avg_logprob, 0) / segments.length
        : 0;
    // Convert log probability to 0-1 confidence (logprob is negative, closer to 0 = more confident)
    const confidence = Math.min(1, Math.max(0, 1 + avgLogProb));

    return {
      text: response.text.trim().toUpperCase(),
      confidence,
      provider: `openai/${this.model}`,
      durationMs,
    };
  }
}

interface SegmentInfo {
  avg_logprob: number;
}

function mimeToExt(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  return "webm"; // default
}
