import { useEffect, useRef, useState } from "react";
import { displayLines, type RadioState } from "@gmdss-simulator/utils";

interface RadioDisplayProps {
  state: RadioState;
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
      </div>
      {showCoverWarning && (
        <div className="sim-lcd-warning" aria-live="polite">
          DISTRESS COVER OPEN
        </div>
      )}
    </div>
  );
}
