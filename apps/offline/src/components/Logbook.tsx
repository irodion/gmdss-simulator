import { useMemo } from "react";
import {
  resetEverything,
  setDailyGoalTarget,
  todayCount,
  writeDailyProgress,
  type DailyProgressV1,
} from "../drills/daily-progress.ts";
import { deriveAllBoxes, deriveMaxCorrectStreak } from "../drills/leitner.ts";
import { evaluateBadges } from "../drills/badges.ts";
import { EXAM_MOCK_TOTAL } from "../drills/exam-mock.ts";
import { readEvents } from "../drills/learning-events.ts";
import { getLocalDateKey, previousLocalDateKey } from "../lib/date-utils.ts";
import { BadgesGrid } from "./BadgesGrid.tsx";
import { GoalPicker } from "./GoalPicker.tsx";
import { MasteryTable } from "./MasteryTable.tsx";

interface LogbookProps {
  readonly progress: DailyProgressV1;
  readonly onBack: () => void;
  readonly onProgressChanged: () => void;
  readonly onLaunchExamMock: () => void;
}

export function Logbook({ progress, onBack, onProgressChanged, onLaunchExamMock }: LogbookProps) {
  const now = Date.now();
  const todayKey = getLocalDateKey(now);
  const today = todayCount(progress, now);
  const target = progress.dailyGoalTarget;

  // Re-read events whenever `progress` changes so the Logbook reflects
  // sessions completed in this same browser tab without unmount/remount.
  const events = useMemo(() => readEvents(), [progress]);
  const boxes = useMemo(() => deriveAllBoxes(events), [events]);
  const maxCorrectStreak = useMemo(() => deriveMaxCorrectStreak(events), [events]);
  const unlocked = useMemo(() => {
    return new Set(evaluateBadges({ events, boxes, maxCorrectStreak }));
  }, [events, boxes, maxCorrectStreak]);

  const last7Days = useMemo(() => {
    const out: { date: string; cleared: boolean }[] = [];
    let key = todayKey;
    for (let i = 0; i < 7; i++) {
      const day = progress.byDate[key];
      out.unshift({ date: key, cleared: (day?.adaptiveItems ?? 0) >= target });
      key = previousLocalDateKey(key);
    }
    return out;
  }, [progress.byDate, target, todayKey]);

  const onTargetChange = (next: number) => {
    const updated = setDailyGoalTarget(progress, next);
    if (updated !== progress) {
      writeDailyProgress(updated);
      onProgressChanged();
    }
  };

  const onReset = () => {
    if (!window.confirm("Reset all stats, events, streak, and badges? This cannot be undone.")) {
      return;
    }
    resetEverything();
    onProgressChanged();
  };

  // transitionStreak records the consumed freeze on the bridged (yesterday)
  // day, not today, so the pill should appear when today is cleared AND the
  // freeze date sits at yesterday.
  const freezeJustApplied =
    progress.streak.lastClearedDate === todayKey &&
    progress.streak.lastFreezeDate === previousLocalDateKey(todayKey);
  const cleared = today.adaptiveItems >= target;
  const pct = Math.min(100, Math.round((today.adaptiveItems / Math.max(1, target)) * 100));
  const examTakenToday = progress.lastExamMockDate === todayKey;

  return (
    <div className="logbook">
      <div className="logbook-header">
        <div className="section-eyebrow">Logbook</div>
        <button type="button" className="logbook-back" onClick={onBack}>
          ← Back
        </button>
      </div>

      <section className="logbook-section streak-block">
        <div className="streak-number">{progress.streak.current}</div>
        <div className="streak-label">day streak</div>
        {freezeJustApplied ? <div className="freeze-pill">auto-freeze applied</div> : null}
      </section>

      <section className="logbook-section">
        <div className="section-eyebrow">Today</div>
        <p className="daily-indicator-line">
          {cleared ? (
            <span className="daily-indicator-met">Today met</span>
          ) : (
            <span>
              <strong>{today.adaptiveItems}</strong> / {target} adaptive items
            </span>
          )}
        </p>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={today.adaptiveItems}
          aria-valuemax={target}
        >
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="day-dots" aria-label="Last 7 days">
          {last7Days.map((d) => (
            <span
              key={d.date}
              className="day-dot"
              data-cleared={d.cleared ? "true" : "false"}
              title={d.date}
            />
          ))}
        </div>
        {today.freeItems > 0 ? (
          <p className="help">
            (plus {today.freeItems} Free Practice item{today.freeItems === 1 ? "" : "s"} today —
            doesn't count toward the streak)
          </p>
        ) : null}
      </section>

      <section className="logbook-section">
        <div className="section-eyebrow">Daily goal</div>
        <GoalPicker target={target} onChange={onTargetChange} />
      </section>

      <section className="logbook-section">
        <div className="section-eyebrow">Exam Mock</div>
        <p className="help">
          {EXAM_MOCK_TOTAL} questions interleaved across all count-driven modes. No feedback until
          the end. Once per day.
        </p>
        <button
          type="button"
          className="btn-primary btn-block"
          onClick={onLaunchExamMock}
          disabled={examTakenToday}
        >
          {examTakenToday ? "Already taken today" : `Take a ${EXAM_MOCK_TOTAL}-question exam mock`}
        </button>
      </section>

      <section className="logbook-section">
        <div className="section-eyebrow">Mastery</div>
        <MasteryTable events={events} boxes={boxes} />
      </section>

      <section className="logbook-section">
        <div className="section-eyebrow">Badges</div>
        <BadgesGrid unlocked={unlocked} />
      </section>

      <section className="logbook-section logbook-reset">
        <button type="button" className="btn-reset" onClick={onReset}>
          Reset everything
        </button>
      </section>
    </div>
  );
}
