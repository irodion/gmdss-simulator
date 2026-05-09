import { useEffect, useState } from "react";
import { MAX_GOAL_TARGET, MIN_GOAL_TARGET } from "../drills/daily-progress.ts";

const PRESETS: readonly number[] = [10, 20, 30, 50];

interface GoalPickerProps {
  readonly target: number;
  readonly onChange: (next: number) => void;
}

export function GoalPicker({ target, onChange }: GoalPickerProps) {
  const isPreset = PRESETS.includes(target);
  const [customText, setCustomText] = useState<string>(isPreset ? "" : String(target));

  // Keep the local input in sync with external target changes — clicking a
  // preset clears the field; an out-of-range custom value snaps to the
  // clamped value after submit.
  useEffect(() => {
    setCustomText(isPreset ? "" : String(target));
  }, [target, isPreset]);

  const submitCustom = () => {
    const parsed = Number.parseInt(customText, 10);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.max(MIN_GOAL_TARGET, Math.min(MAX_GOAL_TARGET, parsed));
    onChange(clamped);
    if (!PRESETS.includes(clamped)) setCustomText(String(clamped));
  };

  return (
    <div className="goal-picker">
      <div className="goal-picker-presets">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className="count-btn"
            aria-pressed={target === p}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <label className="goal-picker-custom">
        <span className="goal-picker-custom-label">Custom</span>
        <input
          type="number"
          inputMode="numeric"
          min={MIN_GOAL_TARGET}
          max={MAX_GOAL_TARGET}
          value={customText}
          placeholder={isPreset ? String(target) : ""}
          onChange={(e) => setCustomText(e.target.value)}
          onBlur={submitCustom}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitCustom();
            }
          }}
        />
      </label>
    </div>
  );
}
