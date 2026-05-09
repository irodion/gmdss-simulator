import type { DrillType } from "../drills/drill-types.ts";

export type AppMode = DrillType | "procedures";

interface ModeTabsProps {
  readonly mode: AppMode;
  readonly onChange: (mode: AppMode) => void;
}

/** Single source of truth for user-facing mode labels — also consumed by Logbook. */
export const MODE_LABELS: Readonly<Record<AppMode, string>> = {
  phonetic: "Callsigns",
  "number-pronunciation": "Numbers",
  reverse: "Listen",
  procedures: "Procedures",
  abbreviation: "Abbreviations",
};

const TABS: ReadonlyArray<{ value: AppMode; numeral: string }> = [
  { value: "phonetic", numeral: "I" },
  { value: "number-pronunciation", numeral: "II" },
  { value: "reverse", numeral: "III" },
  { value: "procedures", numeral: "IV" },
  { value: "abbreviation", numeral: "V" },
];

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <div className="mode-tabs" role="tablist" aria-label="Drill mode">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={mode === tab.value}
          className="mode-tab"
          onClick={() => onChange(tab.value)}
        >
          <span className="mode-numeral" aria-hidden="true">
            {tab.numeral}
          </span>
          <span className="mode-label">{MODE_LABELS[tab.value]}</span>
        </button>
      ))}
    </div>
  );
}
