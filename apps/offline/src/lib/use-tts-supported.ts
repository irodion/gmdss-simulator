import { useEffect, useState } from "react";
import { detectSpeechSupport, isSupported, onVoicesChanged } from "./tts.ts";

/** Tracks whether TTS playback will produce audible sound (speech API present and a voice installed). */
export function useTtsSupported(): boolean {
  // Seed from the synchronous API check so controls aren't hidden for a frame
  // on capable browsers, then correct once the async voice probe settles.
  const [supported, setSupported] = useState<boolean>(() => isSupported());

  useEffect(() => {
    let active = true;
    const probe = () => {
      void detectSpeechSupport().then((ok) => {
        if (active) setSupported(ok);
      });
    };
    probe();
    // Voices can finish loading after the first probe settles; re-probe on each
    // change so a slow voice list doesn't leave TTS controls permanently hidden.
    const unsubscribe = onVoicesChanged(probe);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return supported;
}
