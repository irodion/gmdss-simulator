import { useEffect, useRef, useState } from "react";
import { displayLines, type RadioState } from "@gmdss-simulator/utils";

interface RadioDisplayProps {
  state: RadioState;
}

function GpsIcon() {
  return (
    <svg
      className="sim-lcd-gps__icon"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M2 10.5L6.5 6L9.5 9L14 4.5L15 5.5L9.5 11L6.5 8L3 11.5L2 10.5Z" fill="currentColor" />
      <path d="M6 12.5H10V14H6V12.5Z" fill="currentColor" />
    </svg>
  );
}

export function RadioDisplay({ state }: RadioDisplayProps) {
  const lines = displayLines(state);
  const prevFlipCover = useRef(state.flipCover);
  const [showCoverWarning, setShowCoverWarning] = useState(false);

  useEffect(() => {
    const wasOpen = prevFlipCover.current === "closed" && state.flipCover === "open";
    prevFlipCover.current = state.flipCover;
    if (wasOpen) {
      setShowCoverWarning(true);
      const id = setTimeout(() => setShowCoverWarning(false), 2000);
      return () => {
        clearTimeout(id);
        setShowCoverWarning(false);
      };
    }
  }, [state.flipCover]);

  return (
    <div className="sim-lcd" aria-label="Radio display" role="status">
      <div className="sim-lcd-main">{lines.main}</div>
      <div className="sim-lcd-line">{lines.sub}</div>
      <div className="sim-lcd-footer">
        <span>{lines.footer}</span>
        {(state.gpsLock || state.manualPosition) && (
          <span className="sim-lcd-gps">
            <GpsIcon />
            GPS
          </span>
        )}
      </div>
      {showCoverWarning && (
        <div className="sim-lcd-warning" aria-live="polite">
          DISTRESS COVER OPEN
        </div>
      )}
    </div>
  );
}
