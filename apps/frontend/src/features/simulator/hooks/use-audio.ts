import { useCallback, useEffect, useRef } from "react";
import { AudioEngine } from "../audio/audio-engine.ts";
import { PlaybackQueue } from "../audio/playback-queue.ts";

export interface UseAudioResult {
  /** Init audio on user gesture. Optionally apply current knob values. */
  init: (opts?: { volume?: number; squelch?: number }) => Promise<void>;
  /** Speak text through radio DSP (station response). */
  speak: (text: string) => Promise<void>;
  /** Update squelch (ambient noise level). */
  setSquelch: (value: number) => void;
  /** Update volume. */
  setVolume: (value: number) => void;
  /** Clean up. */
  destroy: () => void;
}

export function useAudio(): UseAudioResult {
  const engineRef = useRef<AudioEngine | null>(null);
  const queueRef = useRef<PlaybackQueue | null>(null);
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

  const setSquelch = useCallback((value: number) => {
    engineRef.current?.setSquelchLevel(value);
  }, []);

  const setVolume = useCallback((value: number) => {
    engineRef.current?.setVolume(value);
  }, []);

  const destroy = useCallback(() => {
    queueRef.current?.clear();
    queueRef.current = null;
    engineRef.current?.destroy();
    engineRef.current = null;
  }, []);

  useEffect(() => {
    return () => destroy();
  }, [destroy]);

  return { init, speak, setSquelch, setVolume, destroy };
}
