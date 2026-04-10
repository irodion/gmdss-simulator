import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionResult {
  transcript: string;
  alternatives: readonly string[];
  listening: boolean;
  supported: boolean;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionAPI = new () => {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onresult: ((e: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

interface SpeechRecognitionResultList {
  readonly length: number;
  item: (i: number) => {
    readonly isFinal: boolean;
    readonly length: number;
    item: (j: number) => { readonly transcript: string };
  };
}

function getSpeechRecognition(): SpeechRecognitionAPI | null {
  const w = globalThis as Record<string, unknown>;
  return (w["SpeechRecognition"] ??
    w["webkitSpeechRecognition"] ??
    null) as SpeechRecognitionAPI | null;
}

const MAX_ALTERNATIVES = 3;

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [transcript, setTranscript] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionAPI> | null>(null);
  const accumulatedRef = useRef("");
  const prevAltsRef = useRef("");

  const Ctor = getSpeechRecognition();
  const supported = Ctor !== null;

  const start = useCallback(() => {
    if (!Ctor || recognitionRef.current) return;

    accumulatedRef.current = "";
    prevAltsRef.current = "";
    setTranscript("");
    setAlternatives([]);

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = MAX_ALTERNATIVES;
    recognition.lang = "en-GB";

    recognition.onresult = (event) => {
      const results = event.results;
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < results.length; i++) {
        const result = results.item(i);
        const text = result.item(0).transcript;
        if (result.isFinal) {
          finalText += text + " ";
        } else {
          interimText += text;
        }
      }

      if (finalText) {
        accumulatedRef.current = finalText.trim();
      }

      const full = (accumulatedRef.current + " " + interimText).trim();
      setTranscript(full.toUpperCase());

      // Build alternative transcripts (indices 1..N) from final results
      const alts: string[] = [];
      for (let alt = 1; alt < MAX_ALTERNATIVES; alt++) {
        let altFinal = "";
        for (let i = 0; i < results.length; i++) {
          const result = results.item(i);
          if (!result.isFinal) continue;
          const idx = alt < result.length ? alt : 0;
          altFinal += result.item(idx).transcript + " ";
        }
        const altFull = (altFinal.trim() || accumulatedRef.current).trim();
        if (altFull && altFull.toUpperCase() !== full.toUpperCase()) {
          alts.push(altFull.toUpperCase());
        }
      }
      // Only update state when alternatives actually changed
      const altsKey = alts.join("\0");
      if (altsKey !== prevAltsRef.current) {
        prevAltsRef.current = altsKey;
        setAlternatives(alts);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [Ctor]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { transcript, alternatives, listening, supported, start, stop };
}
