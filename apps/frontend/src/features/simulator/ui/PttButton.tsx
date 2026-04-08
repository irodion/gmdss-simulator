import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { RadioCommand } from "@gmdss-simulator/utils";

interface PttButtonProps {
  disabled: boolean;
  active: boolean;
  onCommand: (cmd: RadioCommand) => void;
}

export function PttButton({ disabled, active, onCommand }: PttButtonProps) {
  const { t } = useTranslation("simulator");
  const btnRef = useRef<HTMLButtonElement>(null);
  const spaceHeld = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      const btn = btnRef.current;
      if (btn) btn.setPointerCapture(e.pointerId);
      onCommand({ type: "PRESS_PTT" });
    },
    [disabled, onCommand],
  );

  const handlePointerUp = useCallback(() => {
    if (active) onCommand({ type: "RELEASE_PTT" });
  }, [active, onCommand]);

  useEffect(() => {
    const isTypingTarget = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !e.repeat &&
        !spaceHeld.current &&
        !disabled &&
        !isTypingTarget(e)
      ) {
        e.preventDefault();
        spaceHeld.current = true;
        onCommand({ type: "PRESS_PTT" });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && spaceHeld.current) {
        e.preventDefault();
        spaceHeld.current = false;
        onCommand({ type: "RELEASE_PTT" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [disabled, onCommand]);

  const classNames = ["sim-ptt", active && "sim-ptt--active", disabled && "sim-ptt--disabled"]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={btnRef}
      type="button"
      className={classNames}
      aria-label="Push to talk"
      aria-pressed={active}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <span className="sim-ptt__label">{t("ptt")}</span>
      <span className="sim-ptt__sub">{t("pttHint")}</span>
    </button>
  );
}
