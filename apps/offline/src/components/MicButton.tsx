import { useEffect, useRef, useState } from "react";
import { applyNormalization } from "../drills/stt-normalize.ts";
import { useSpeechRecognition } from "../lib/stt.ts";

interface MicButtonProps {
  readonly onTranscript: (text: string) => void;
  readonly onListeningChange?: (listening: boolean) => void;
  readonly disabled?: boolean;
}

// Module-scope so the privacy disclosure shows at most once per page load
// (DrillCard remounts MicButton on every challenge via key={challenge.id}).
let DISCLOSURE_SHOWN = false;

export function MicButton({ onTranscript, onListeningChange, disabled = false }: MicButtonProps) {
  const stt = useSpeechRecognition();
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const onListeningChangeRef = useRef(onListeningChange);
  onListeningChangeRef.current = onListeningChange;

  const [showDisclosure, setShowDisclosure] = useState(false);

  useEffect(() => {
    if (stt.transcript !== "") {
      onTranscriptRef.current(applyNormalization(stt.transcript));
    }
  }, [stt.transcript]);

  useEffect(() => {
    onListeningChangeRef.current?.(stt.listening);
  }, [stt.listening]);

  useEffect(() => {
    if (!showDisclosure) return;
    const timer = setTimeout(() => setShowDisclosure(false), 6000);
    return () => clearTimeout(timer);
  }, [showDisclosure]);

  if (!stt.supported) return null;

  const offline = stt.supported && !stt.available && !stt.permissionDenied;
  const buttonDisabled = disabled || offline || stt.permissionDenied;

  let title = "Start voice dictation";
  if (stt.listening) title = "Stop voice dictation";
  else if (stt.permissionDenied) title = "Microphone access blocked";
  else if (offline) title = "Voice input needs an internet connection";

  const handleClick = () => {
    if (stt.listening) {
      stt.stop();
      return;
    }
    if (!DISCLOSURE_SHOWN) {
      DISCLOSURE_SHOWN = true;
      setShowDisclosure(true);
    }
    stt.start();
  };

  const state = stt.listening ? "listening" : "idle";

  return (
    <>
      <button
        type="button"
        className="mic-floater"
        data-state={state}
        onClick={handleClick}
        disabled={buttonDisabled}
        title={title}
        aria-label={title}
        aria-pressed={stt.listening}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            className="mic-body"
            x="9"
            y="3"
            width="6"
            height="12"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M5 12a7 7 0 0 0 14 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line
            x1="12"
            y1="19"
            x2="12"
            y2="22"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <line
            x1="9"
            y1="22"
            x2="15"
            y2="22"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {showDisclosure ? (
        <div className="mic-disclosure" role="note">
          Audio is sent to your browser&rsquo;s speech service.
        </div>
      ) : null}
    </>
  );
}
