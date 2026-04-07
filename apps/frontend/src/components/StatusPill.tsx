interface StatusPillProps {
  label: string;
  online?: boolean;
}

export function StatusPill({ label, online }: StatusPillProps) {
  return (
    <span className="status-pill" role="status" aria-live="polite">
      {online !== undefined && (
        <span
          className={`status-pill__dot ${online ? "status-pill__dot--online" : "status-pill__dot--offline"}`}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}
