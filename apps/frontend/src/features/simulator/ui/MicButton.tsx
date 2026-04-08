import { useEffect } from "react";
import { useSpeechRecognition } from "../hooks/use-speech-recognition.ts";

interface MicButtonProps {
  onTranscript: (text: string) => void;
}

export function MicButton({ onTranscript }: MicButtonProps) {
  const { transcript, listening, supported, start, stop } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`sim-mic-btn ${listening ? "sim-mic-btn--active" : ""}`}
      onClick={listening ? stop : start}
      aria-label={listening ? "Stop listening" : "Push to talk"}
      title={listening ? "Listening..." : "Push to talk"}
    >
      {/* Handheld radio / PTT icon */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {/* Radio body */}
        <rect x="7" y="8" width="10" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
        {/* Antenna */}
        <path d="M12 8V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="2" r="1" fill="currentColor" />
        {/* Speaker grille */}
        <line
          x1="9.5"
          y1="11.5"
          x2="14.5"
          y2="11.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
        <line
          x1="9.5"
          y1="13.5"
          x2="14.5"
          y2="13.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
        <line
          x1="9.5"
          y1="15.5"
          x2="14.5"
          y2="15.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* PTT side button */}
        <rect x="4.5" y="11" width="2.5" height="5" rx="1" fill="currentColor" opacity="0.7" />
        {/* Signal waves when active */}
        {listening && (
          <>
            <path
              d="M18 10C19 10.5 19.5 11.5 19.5 12.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M19 8C20.5 9 21.5 10.8 21.5 12.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.5"
            />
          </>
        )}
      </svg>
      <span className="sim-mic-btn__label">{listening ? "STOP" : "PTT"}</span>
    </button>
  );
}
