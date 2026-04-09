import type { RadioCommand } from "@gmdss-simulator/utils";

interface DscKeypadProps {
  onCommand: (cmd: RadioCommand) => void;
}

export function DscKeypad({ onCommand }: DscKeypadProps) {
  return (
    <div className="sim-dsc-box sim-keypad-box" aria-label="Digital keypad">
      <div className="sim-keypad-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            type="button"
            className="sim-dsc-btn"
            onClick={() => onCommand({ type: "DSC_DIGIT", digit })}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="sim-dsc-btn sim-keypad-fn"
          onClick={() => onCommand({ type: "DSC_BACKSPACE" })}
          aria-label="Backspace"
        >
          DEL
        </button>
        <button
          type="button"
          className="sim-dsc-btn"
          onClick={() => onCommand({ type: "DSC_DIGIT", digit: 0 })}
        >
          0
        </button>
        <button
          type="button"
          className="sim-dsc-btn sim-keypad-fn"
          onClick={() => onCommand({ type: "DSC_ENTER" })}
          aria-label="Enter"
        >
          ENT
        </button>
      </div>
    </div>
  );
}
