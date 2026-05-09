import { AdaptiveModeToggle } from "./AdaptiveModeToggle.tsx";
import { PhoneticCheatsheet } from "./PhoneticCheatsheet.tsx";
import { QueuePreview } from "./QueuePreview.tsx";

interface SessionConfigProps {
  readonly count: number;
  readonly onCountChange: (count: number) => void;
  readonly onStart: () => void;
  readonly preview?: { weak: number; review: number; fresh: number } | null;
  readonly adaptiveEnabled?: boolean;
  readonly onAdaptiveChange?: (enabled: boolean) => void;
}

const COUNTS = [5, 10, 20] as const;

export function SessionConfig({
  count,
  onCountChange,
  onStart,
  preview,
  adaptiveEnabled,
  onAdaptiveChange,
}: SessionConfigProps) {
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
      {preview && adaptiveEnabled ? (
        <QueuePreview weak={preview.weak} review={preview.review} fresh={preview.fresh} />
      ) : null}
      {onAdaptiveChange ? (
        <AdaptiveModeToggle enabled={adaptiveEnabled ?? true} onChange={onAdaptiveChange} />
      ) : null}
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
