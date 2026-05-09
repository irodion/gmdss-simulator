interface DailyIndicatorProps {
  readonly streak: number;
  readonly itemsToday: number;
  readonly target: number;
}

export function DailyIndicator({ streak, itemsToday, target }: DailyIndicatorProps) {
  const cleared = itemsToday >= target;
  const pct = Math.min(100, Math.round((itemsToday / Math.max(1, target)) * 100));
  return (
    <div className="daily-indicator" aria-live="polite">
      <div className="daily-indicator-line">
        {streak > 0 ? <span className="daily-indicator-streak">{streak} day streak</span> : null}
        {streak > 0 ? <span className="daily-indicator-sep">·</span> : null}
        {cleared ? (
          <span className="daily-indicator-met">
            Today met
            <svg
              className="daily-indicator-check"
              viewBox="0 0 16 16"
              width="12"
              height="12"
              aria-hidden="true"
            >
              <path
                d="M3 8.5l3 3 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : (
          <span className="daily-indicator-progress">
            Today: <strong>{itemsToday}</strong> / {target}
          </span>
        )}
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={itemsToday}
        aria-valuemax={target}
      >
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
