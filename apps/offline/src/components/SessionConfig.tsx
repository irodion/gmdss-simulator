import { PhoneticCheatsheet } from "./PhoneticCheatsheet.tsx";

interface SessionConfigProps {
  readonly count: number;
  readonly onCountChange: (count: number) => void;
  readonly onStart: () => void;
}

const COUNTS = [5, 10, 20] as const;

export function SessionConfig({ count, onCountChange, onStart }: SessionConfigProps) {
  return (
    <div>
      <p className="app-subtitle">How many challenges?</p>
      <div className="count-row">
        {COUNTS.map((c) => (
          <button
            key={c}
            type="button"
            className="count-btn"
            aria-pressed={count === c}
            onClick={() => onCountChange(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <button type="button" className="btn-primary btn-block" onClick={onStart}>
        Start session
      </button>
      <PhoneticCheatsheet />
    </div>
  );
}
