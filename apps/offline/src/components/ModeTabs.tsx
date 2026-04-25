import type { DrillType } from "../drills/drill-types.ts";

interface ModeTabsProps {
  readonly mode: DrillType;
  readonly onChange: (mode: DrillType) => void;
}

const TABS: ReadonlyArray<{ value: DrillType; label: string }> = [
  { value: "phonetic", label: "Callsigns" },
  { value: "number-pronunciation", label: "Numbers" },
  { value: "reverse", label: "Listen" },
];

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <div className="mode-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={mode === tab.value}
          className="mode-tab"
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
