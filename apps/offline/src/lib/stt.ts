import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  item: (index: number) => SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  item: (index: number) => SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  readonly error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, SpeechRecognitionConstructor | undefined>;
  return w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null;
}

export interface SpeechRecognitionState {
  readonly supported: boolean;
  readonly available: boolean;
  readonly listening: boolean;
  readonly interimTranscript: string;
  readonly finalTranscript: string;
  readonly permissionDenied: boolean;
  readonly start: () => void;
  readonly stop: () => void;
}

export function useSpeechRecognition(): SpeechRecognitionState {
  const [Ctor] = useState<SpeechRecognitionConstructor | null>(() => getSpeechRecognition());
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterim] = useState("");
  const [finalTranscript, setFinal] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const supported = Ctor !== null;
  const available = supported && online && !permissionDenied;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const start = useCallback(() => {
    if (!Ctor || recognitionRef.current) return;
    setInterim("");
    setFinal("");

    const recognition = new Ctor();
    // Continuous: stay open until the user manually stops, so multi-word
    // dictation isn't cut off after the first phrase.
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let finalChunk = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results.item(i);
        const text = result.length > 0 ? result.item(0).transcript : "";
        if (result.isFinal) finalChunk += `${text} `;
        else interim += text;
      }
      setInterim(interim.trim());
      if (finalChunk.trim() !== "") {
        setFinal(finalChunk.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setPermissionDenied(true);
      }
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

  return {
    supported,
    available,
    listening,
    interimTranscript,
    finalTranscript,
    permissionDenied,
    start,
    stop,
  };
}
