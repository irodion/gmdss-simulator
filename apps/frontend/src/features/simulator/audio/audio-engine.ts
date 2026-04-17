/**
 * Audio Engine — manages AudioContext lifecycle, ambient noise, and volume.
 * Lazily initializes on first user gesture (required by browsers).
 */

import { createNoiseGenerator, squelchToNoiseGain } from "./radio-effects.ts";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private started = false;
  /** Squelch-derived noise level, remembered so we can restore it after TX. */
  private squelchNoiseLevel = 0;

  /**
   * Initialize the AudioContext (must be called from a user gesture handler).
   * Safe to call multiple times — only initializes once.
   */
  async init(): Promise<AudioContext> {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
      return this.ctx;
    }

    this.ctx = new AudioContext();

    // Master gain node for volume control
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.75;
    this.masterGain.connect(this.ctx.destination);

    // Start ambient noise
    const noise = createNoiseGenerator(this.ctx);
    this.noiseSource = noise.source;
    this.noiseGain = noise.gain;
    noise.gain.connect(this.masterGain);
    noise.source.start();
    this.started = true;

    return this.ctx;
  }

  /**
   * Get the current AudioContext, or null if not initialized.
   */
  getContext(): AudioContext | null {
    return this.ctx;
  }

  /**
   * Get the master gain node (connect playback through this).
   */
  getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  /**
   * Whether the engine has been initialized and started.
   */
  isStarted(): boolean {
    return this.started;
  }

  /**
   * Update the squelch level. Higher squelch = less static noise.
   */
  setSquelchLevel(squelch: number): void {
    this.squelchNoiseLevel = squelchToNoiseGain(squelch);
    if (!this.noiseGain) return;
    this.noiseGain.gain.value = this.squelchNoiseLevel;
  }

  /**
   * Mute ambient noise (during TX) or restore it to the current squelch level.
   */
  setNoiseMuted(muted: boolean): void {
    if (!this.noiseGain) return;
    this.noiseGain.gain.value = muted ? 0 : this.squelchNoiseLevel;
  }

  /**
   * Update the master volume (0–100 mapped to gain 0–1).
   */
  setVolume(volume: number): void {
    if (!this.masterGain) return;
    this.masterGain.gain.value = volume / 100;
  }

  /**
   * Tear down the audio engine and release resources.
   */
  destroy(): void {
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
      } catch {
        // Already stopped
      }
      this.noiseSource = null;
    }
    this.noiseGain = null;
    this.masterGain = null;
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.started = false;
  }
}
