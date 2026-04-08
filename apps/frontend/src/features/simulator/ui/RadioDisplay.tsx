import { displayLines, type RadioState } from "@gmdss-simulator/utils";

interface RadioDisplayProps {
  state: RadioState;
}

export function RadioDisplay({ state }: RadioDisplayProps) {
  const lines = displayLines(state);

  return (
    <div className="sim-lcd" aria-label="Radio display" role="status">
      <div className="sim-lcd-main">{lines.main}</div>
      <div className="sim-lcd-line">{lines.sub}</div>
      <div className="sim-lcd-footer">
        <span>{lines.footer}</span>
      </div>
    </div>
  );
}
