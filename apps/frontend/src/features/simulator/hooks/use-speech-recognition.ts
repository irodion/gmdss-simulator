import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionResult {
  transcript: string;
  listening: boolean;
  supported: boolean;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionAPI = new () => {
  continuous: boolean;
  interimResults: boolean;
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
    item: (j: number) => { readonly transcript: string };
  };
}

function getSpeechRecognition(): SpeechRecognitionAPI | null {
  const w = globalThis as Record<string, unknown>;
  return (w["SpeechRecognition"] ??
    w["webkitSpeechRecognition"] ??
    null) as SpeechRecognitionAPI | null;
}

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionAPI> | null>(null);
  const accumulatedRef = useRef("");

  const Ctor = getSpeechRecognition();
  const supported = Ctor !== null;

  const start = useCallback(() => {
    if (!Ctor || recognitionRef.current) return;

    accumulatedRef.current = "";
    setTranscript("");

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

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

  return { transcript, listening, supported, start, stop };
}
