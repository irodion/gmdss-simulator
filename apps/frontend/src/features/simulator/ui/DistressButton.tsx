import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RadioCommand, FlipCoverState } from "@gmdss-simulator/utils";

interface DistressButtonProps {
  flipCover: FlipCoverState;
  onCommand: (cmd: RadioCommand) => void;
}

const HOLD_DURATION_MS = 5000;

function DscStatusLine() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }),
      );
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sim-dsc-meta" aria-label="DSC status">
      MMSI 211239680 &nbsp; UTC {time} &nbsp; AUTO-SWITCH READY
    </div>
  );
}

export function DistressButton({ flipCover, onCommand }: DistressButtonProps) {
  const { t } = useTranslation("simulator");
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number | null>(null);

  const isOpen = flipCover === "open";

  const clearHoldTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
    setCountdown(null);
  }, []);

  const handleFlipCoverClick = useCallback(() => {
    onCommand({ type: isOpen ? "CLOSE_FLIP_COVER" : "OPEN_FLIP_COVER" });
  }, [isOpen, onCommand]);

  const handleDistressDown = useCallback(() => {
    if (!isOpen) return;
    onCommand({ type: "START_DISTRESS_HOLD" });
    startRef.current = Date.now();
    setCountdown(5);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - (startRef.current ?? Date.now());
      const remaining = Math.ceil((HOLD_DURATION_MS - elapsed) / 1000);
      if (remaining <= 0) {
        clearHoldTimer();
        onCommand({ type: "COMPLETE_DISTRESS_HOLD" });
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  }, [isOpen, onCommand, clearHoldTimer]);

  const handleDistressUp = useCallback(() => {
    if (startRef.current !== null) {
      clearHoldTimer();
      onCommand({ type: "CANCEL_DISTRESS_HOLD" });
    }
  }, [onCommand, clearHoldTimer]);

  useEffect(() => {
    return () => clearHoldTimer();
  }, [clearHoldTimer]);

  return (
    <div className="sim-dsc-box">
      <div className="sim-dsc-title">{t("dscControls")}</div>
      <div className="sim-dsc-controls">
        <button
          type="button"
          className="sim-distress-btn"
          onPointerDown={handleDistressDown}
          onPointerUp={handleDistressUp}
          onPointerCancel={handleDistressUp}
          aria-label="Distress alert"
        >
          <span>{t("distressHold")}</span>
          <div
            className={`sim-flip-cover ${isOpen ? "sim-flip-cover--open" : ""}`}
            onClick={handleFlipCoverClick}
            role="button"
            tabIndex={0}
            aria-label={isOpen ? "Close flip cover" : "Lift flip cover"}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                handleFlipCoverClick();
              }
            }}
          >
            {t("liftToAccess")}
          </div>
          {countdown !== null && (
            <div className="sim-distress-countdown" aria-live="assertive">
              {countdown}
            </div>
          )}
        </button>
        <button type="button" className="sim-dsc-btn">
          CALL
        </button>
        <button type="button" className="sim-dsc-btn">
          MENU
        </button>
      </div>
      <DscStatusLine />
    </div>
  );
}
