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
      <div className="section-eyebrow">Set your watch</div>
      <p className="section-prompt">How many transmissions this session?</p>
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
        Begin
        <span className="btn-shortcut" aria-hidden="true">
          ⌘↵
        </span>
      </button>
      <PhoneticCheatsheet />
    </div>
  );
}
