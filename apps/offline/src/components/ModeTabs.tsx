import type { DrillType } from "../drills/drill-types.ts";

interface ModeTabsProps {
  readonly mode: DrillType;
  readonly onChange: (mode: DrillType) => void;
}

const TABS: ReadonlyArray<{ value: DrillType; label: string; numeral: string }> = [
  { value: "phonetic", label: "Callsigns", numeral: "I" },
  { value: "number-pronunciation", label: "Numbers", numeral: "II" },
  { value: "reverse", label: "Listen", numeral: "III" },
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
