interface StatusPillProps {
  label: string;
  online?: boolean;
}

export function StatusPill({ label, online }: StatusPillProps) {
  return (
    <span className="status-pill">
      {online !== undefined && (
        <span
          className={`status-pill__dot ${online ? "status-pill__dot--online" : "status-pill__dot--offline"}`}
        />
      )}
      {label}
    </span>
  );
}
