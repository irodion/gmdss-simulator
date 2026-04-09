import { useCallback, useRef } from "react";

interface RotaryKnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  onChange: (value: number) => void;
}

function valueToAngle(value: number, min: number, max: number): number {
  const ratio = (value - min) / (max - min);
  return -135 + ratio * 270;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function RotaryKnob({ value, min = 0, max = 100, step, label, onChange }: RotaryKnobProps) {
  const effectiveStep = step ?? Math.max(1, Math.round((max - min) / 20));
  const knobRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const rect = rectRef.current;
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientX - cx, -(e.clientY - cy)) * (180 / Math.PI);
      const clamped = clamp(angle, -135, 135);
      const ratio = (clamped + 135) / 270;
      onChange(Math.round(min + ratio * (max - min)));
    },
    [min, max, onChange],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const knob = knobRef.current;
      if (!knob) return;
      knob.releasePointerCapture(e.pointerId);
      knob.removeEventListener("pointermove", handlePointerMove);
      knob.removeEventListener("pointerup", handlePointerUp);
      rectRef.current = null;
    },
    [handlePointerMove],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const knob = knobRef.current;
      if (!knob) return;
      rectRef.current = knob.getBoundingClientRect();
      knob.setPointerCapture(e.pointerId);
      knob.addEventListener("pointermove", handlePointerMove);
      knob.addEventListener("pointerup", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowRight") {
        e.preventDefault();
        onChange(clamp(value + effectiveStep, min, max));
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        e.preventDefault();
        onChange(clamp(value - effectiveStep, min, max));
      }
    },
    [value, min, max, onChange, effectiveStep],
  );

  const angle = valueToAngle(value, min, max);

  return (
    <div className="sim-knob-wrap">
      <div
        ref={knobRef}
        className="sim-knob"
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
      >
        <div className="sim-knob__ticks" aria-hidden="true" />
        <div
          className="sim-knob__indicator"
          aria-hidden="true"
          style={{ transform: `rotate(${angle}deg)` }}
        />
      </div>
      <div className="sim-knob-marks" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div className="sim-knob-label">{label}</div>
    </div>
  );
}
