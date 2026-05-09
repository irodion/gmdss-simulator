interface AdaptiveModeToggleProps {
  readonly enabled: boolean;
  readonly onChange: (enabled: boolean) => void;
}

export function AdaptiveModeToggle({ enabled, onChange }: AdaptiveModeToggleProps) {
  const label = enabled ? "Adaptive" : "Free Practice";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Toggle adaptive practice"
      className="adaptive-toggle"
      onClick={() => onChange(!enabled)}
    >
      <span className="adaptive-toggle-label">{label}</span>
    </button>
  );
}
