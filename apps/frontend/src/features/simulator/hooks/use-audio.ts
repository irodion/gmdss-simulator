import { useCallback, useEffect, useRef } from "react";
import { AudioEngine } from "../audio/audio-engine.ts";
import { PlaybackQueue } from "../audio/playback-queue.ts";
import { TxCapture } from "../audio/tx-capture.ts";

export interface UseAudioResult {
  /** Init audio on user gesture. Optionally apply current knob values. */
  init: (opts?: { volume?: number; squelch?: number }) => Promise<void>;
  /** Speak text through radio DSP (station response). */
  speak: (text: string) => Promise<void>;
  /** Play raw audio buffer through radio DSP (TTS response from server). */
  playAudioBuffer: (audioData: ArrayBuffer) => Promise<void>;
  /** Start mic capture (PTT pressed). Requires init() first. */
  startCapture: () => Promise<void>;
  /** Stop mic capture (PTT released). Returns the clean audio blob + duration. */
  stopCapture: () => Promise<{ cleanBlob: Blob; durationMs: number }>;
  /** Update squelch (ambient noise level). */
  setSquelch: (value: number) => void;
  /** Update volume. */
  setVolume: (value: number) => void;
  /** Mute ambient noise during TX (real radios go silent when transmitting). */
  setNoiseMuted: (muted: boolean) => void;
  /** Clean up. */
  destroy: () => void;
}

export function useAudio(): UseAudioResult {
  const engineRef = useRef<AudioEngine | null>(null);
  const queueRef = useRef<PlaybackQueue | null>(null);
  const captureRef = useRef<TxCapture | null>(null);
  const initingRef = useRef(false);

  const init = useCallback(async (opts?: { volume?: number; squelch?: number }) => {
    if (initingRef.current) return;
    initingRef.current = true;
    try {
      if (!engineRef.current) {
        engineRef.current = new AudioEngine();
      }
      const ctx = await engineRef.current.init();
      if (!queueRef.current) {
        const gain = engineRef.current.getMasterGain();
        if (gain) {
          queueRef.current = new PlaybackQueue(ctx, gain);
        }
      }
      if (opts?.volume != null) engineRef.current.setVolume(opts.volume);
      if (opts?.squelch != null) engineRef.current.setSquelchLevel(opts.squelch);
    } finally {
      initingRef.current = false;
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (queueRef.current) {
      await queueRef.current.speak(text);
    }
  }, []);

  const playAudioBuffer = useCallback(async (audioData: ArrayBuffer) => {
    if (queueRef.current) {
      await queueRef.current.playAudio(audioData);
    }
  }, []);

  // Track the pending startCapture promise so stopCapture can wait for it
  const captureStartRef = useRef<Promise<void> | null>(null);

  const startCapture = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const ctx = await engine.init();
    const gain = engine.getMasterGain();
    if (!gain) return;
    const capture = new TxCapture();
    const startPromise = capture.start(ctx, gain).then(() => {
      captureRef.current = capture;
    });
    captureStartRef.current = startPromise;
    await startPromise;
  }, []);

  const stopCapture = useCallback(async () => {
    // Wait for any pending startCapture to finish first
    if (captureStartRef.current) {
      await captureStartRef.current.catch(() => {});
      captureStartRef.current = null;
    }
    const capture = captureRef.current;
    if (!capture) return { cleanBlob: new Blob(), durationMs: 0 };
    captureRef.current = null;
    return capture.stop();
  }, []);

  const setSquelch = useCallback((value: number) => {
    engineRef.current?.setSquelchLevel(value);
  }, []);

  const setVolume = useCallback((value: number) => {
    engineRef.current?.setVolume(value);
  }, []);

  const setNoiseMuted = useCallback((muted: boolean) => {
    engineRef.current?.setNoiseMuted(muted);
  }, []);

  const destroy = useCallback(() => {
    // Always stop capture to release mic stream and audio nodes, even if
    // MediaRecorder was never created (no supported MIME type on this browser)
    if (captureRef.current) {
      void captureRef.current.stop();
    }
    captureRef.current = null;
    queueRef.current?.clear();
    queueRef.current = null;
    engineRef.current?.destroy();
    engineRef.current = null;
  }, []);

  useEffect(() => {
    return () => destroy();
  }, [destroy]);

  return {
    init,
    speak,
    playAudioBuffer,
    startCapture,
    stopCapture,
    setSquelch,
    setVolume,
    setNoiseMuted,
    destroy,
  };
}
