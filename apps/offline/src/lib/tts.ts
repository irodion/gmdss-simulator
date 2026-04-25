/**
 * Web Speech API wrapper. All calls must originate from a user gesture on iOS.
 */

export function isSupported(): boolean {
  return typeof window !== "undefined" && Boolean(window.speechSynthesis);
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

  voicesReadyPromise = new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      cachedVoice = pickEnglishVoice();
      resolve();
    }, 1000);
    synth.addEventListener(
      "voiceschanged",
      () => {
        clearTimeout(timer);
        cachedVoice = pickEnglishVoice();
        resolve();
      },
      { once: true },
    );
  });
  return voicesReadyPromise;
}

/** Speak a single phrase. Resolves when speech finishes or errors. */
export async function speak(text: string, rate = 0.9): Promise<void> {
  if (!isSupported() || text.trim() === "") return;
  await ensureVoiceReady();

  const synth = window.speechSynthesis;
  synth.cancel();

  return new Promise<void>((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    if (cachedVoice) utter.voice = cachedVoice;
    utter.lang = cachedVoice?.lang ?? "en-US";
    utter.rate = rate;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
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
