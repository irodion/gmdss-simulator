/**
 * Playback Queue — plays station response audio through the radio DSP chain.
 * For Phase 3: uses browser SpeechSynthesis API for pre-scripted text responses.
 */

import { createRadioDspChain } from "./radio-effects.ts";

interface QueueItem {
  text: string;
  resolve: () => void;
}

export class PlaybackQueue {
  private queue: QueueItem[] = [];
  private playing = false;
  private ctx: AudioContext;
  private destination: AudioNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destination = destination;
  }

  /**
   * Enqueue text for speech synthesis playback through radio effects.
   * Returns a promise that resolves when playback completes.
   */
  speak(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.queue.push({ text, resolve });
      if (!this.playing) {
        void this.playNext();
      }
    });
  }

  /**
   * Enqueue raw audio data (ArrayBuffer) for playback through radio DSP.
   * Returns a promise that resolves when playback completes.
   */
  async playAudio(audioData: ArrayBuffer): Promise<void> {
    const audioBuffer = await this.ctx.decodeAudioData(audioData);
    return new Promise<void>((resolve) => {
      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;

      const dsp = createRadioDspChain(this.ctx);
      source.connect(dsp.input);
      dsp.output.connect(this.destination);

      source.onended = () => {
        dsp.input.disconnect();
        dsp.output.disconnect();
        resolve();
      };

      source.start();
    });
  }

  /**
   * Whether audio is currently being played.
   */
  isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Clear any pending items from the queue.
   */
  clear(): void {
    for (const item of this.queue) {
      item.resolve();
    }
    this.queue = [];
    this.playing = false;
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
    }
  }

  private async playNext(): Promise<void> {
    this.playing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      if (typeof speechSynthesis !== "undefined") {
        await this.speakViaSynthesis(item.text);
      }

      item.resolve();
    }

    this.playing = false;
  }

  private speakViaSynthesis(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // slightly slower for radio clarity
      utterance.pitch = 0.95;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // don't block queue on error
      speechSynthesis.speak(utterance);
    });
  }
}
