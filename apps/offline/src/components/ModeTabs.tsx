import type { DrillType } from "../drills/drill-types.ts";

export type AppMode = DrillType | "procedures";

interface ModeTabsProps {
  readonly mode: AppMode;
  readonly onChange: (mode: AppMode) => void;
}

const TABS: ReadonlyArray<{ value: AppMode; label: string; numeral: string }> = [
  { value: "phonetic", label: "Callsigns", numeral: "I" },
  { value: "number-pronunciation", label: "Numbers", numeral: "II" },
  { value: "reverse", label: "Listen", numeral: "III" },
  { value: "procedures", label: "Procedures", numeral: "IV" },
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
          <span className="mode-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
