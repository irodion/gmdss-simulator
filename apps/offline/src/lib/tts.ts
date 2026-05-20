/**
 * Web Speech API wrapper. All calls must originate from a user gesture on iOS.
 */

export function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.speechSynthesis) &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesReadyPromise: Promise<void> | null = null;

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const en = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  return en ?? voices[0] ?? null;
}

function ensureVoiceReady(): Promise<void> {
  if (!isSupported() || cachedVoice) return Promise.resolve();
  if (voicesReadyPromise) return voicesReadyPromise;

  const synth = window.speechSynthesis;
  const initial = synth.getVoices();
  if (initial.length > 0) {
    cachedVoice = pickEnglishVoice();
    return Promise.resolve();
  }

  // Clear voicesReadyPromise on a no-voice resolve so the next call retries
  // instead of replaying a stale empty result.
  const finalize = (resolve: () => void) => {
    cachedVoice = pickEnglishVoice();
    if (!cachedVoice) voicesReadyPromise = null;
    resolve();
  };

  voicesReadyPromise = new Promise<void>((resolve) => {
    const timer = setTimeout(() => finalize(resolve), 1000);
    synth.addEventListener(
      "voiceschanged",
      () => {
        clearTimeout(timer);
        finalize(resolve);
      },
      { once: true },
    );
  });
  return voicesReadyPromise;
}

/**
 * Resolves true only when speech synthesis is present AND at least one voice is
 * installed. Some browsers expose speechSynthesis yet ship no usable voices
 * (privacy-hardened builds, minimal Linux installs), where speak() produces no
 * audible output. Voices load asynchronously, so callers must await this before
 * deciding whether to surface a "play" control.
 */
export async function detectSpeechSupport(): Promise<boolean> {
  if (!isSupported()) return false;
  await ensureVoiceReady();
  return window.speechSynthesis.getVoices().length > 0;
}

/**
 * Subscribe to voice-list changes. Browsers populate getVoices() asynchronously
 * and fire `voiceschanged` as voices load — sometimes after a fixed support
 * probe has already settled — so callers re-evaluate on each change. Returns an
 * unsubscribe function.
 */
export function onVoicesChanged(listener: () => void): () => void {
  if (!isSupported()) return () => {};
  const synth = window.speechSynthesis;
  synth.addEventListener("voiceschanged", listener);
  return () => synth.removeEventListener("voiceschanged", listener);
}

/**
 * Speak a single phrase. Resolves when speech finishes, errors, or is aborted.
 * Pass an AbortSignal to cancel cooperatively — important during the
 * voice-loading wait on the first call, when synth.cancel() alone has nothing
 * to cancel and a quick Stop click would otherwise still let speech start.
 */
export async function speak(text: string, rate = 0.9, signal?: AbortSignal): Promise<void> {
  if (!isSupported() || text.trim() === "") return;
  if (signal?.aborted) return;
  await ensureVoiceReady();
  if (signal?.aborted) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  return new Promise<void>((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    if (cachedVoice) utter.voice = cachedVoice;
    utter.lang = cachedVoice?.lang ?? "en-US";
    utter.rate = rate;
    const onAbort = () => synth.cancel();
    const finish = () => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    };
    utter.onend = finish;
    utter.onerror = finish;
    signal?.addEventListener("abort", onAbort, { once: true });
    synth.speak(utter);
  });
}

/** Speak a sequence of words with a small pause between them, for clarity. */
export async function speakSequence(words: readonly string[], gapMs = 250): Promise<void> {
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w) continue;
    await speak(w);
    if (i < words.length - 1 && gapMs > 0) {
      await new Promise((r) => setTimeout(r, gapMs));
    }
  }
}

/** Cancel any in-flight speech. */
export function cancel(): void {
  if (isSupported()) window.speechSynthesis.cancel();
}
