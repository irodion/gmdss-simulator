import { BADGES } from "../drills/badges.ts";

interface BadgesGridProps {
  readonly unlocked: ReadonlySet<string>;
}

export function BadgesGrid({ unlocked }: BadgesGridProps) {
  return (
    <div className="badge-grid">
      {BADGES.map((badge) => {
        const isUnlocked = unlocked.has(badge.id);
        return (
          <div key={badge.id} className="badge" data-state={isUnlocked ? "unlocked" : "locked"}>
            <div className="badge-label">
              {badge.label}
              {isUnlocked ? (
                <svg
                  className="badge-check"
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
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
              ) : null}
            </div>
            <div className="badge-desc">{badge.description}</div>
          </div>
        );
      })}
    </div>
  );
}
