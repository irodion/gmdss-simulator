import "./styles/app.css";
import { useCallback, useMemo, useState } from "react";
import { AbbreviationCard } from "./components/AbbreviationCard.tsx";
import { AbbreviationStats } from "./components/AbbreviationStats.tsx";
import { DrillCard } from "./components/DrillCard.tsx";
import { InstallChip } from "./components/InstallChip.tsx";
import { ModeTabs, type AppMode } from "./components/ModeTabs.tsx";
import { ProceduresPanel } from "./components/ProceduresPanel.tsx";
import { SessionConfig } from "./components/SessionConfig.tsx";
import { SessionResults } from "./components/SessionResults.tsx";
import { generateAbbreviationChallenges, scoreAbbreviation } from "./drills/abbreviation-mode.ts";
import {
  generateNumberChallenges,
  generatePhoneticChallenges,
  scoreDrill,
  type DrillChallenge,
  type DrillResult,
  type DrillType,
} from "./drills/drill-types.ts";
import { recordDrillAttempt } from "./drills/learning-events.ts";
import { generateReverseChallenges, scoreReverse } from "./drills/reverse-mode.ts";

type Screen = "config" | "drill" | "summary";

function generateChallenges(mode: DrillType, count: number): DrillChallenge[] {
  if (mode === "phonetic") return generatePhoneticChallenges(count);
  if (mode === "number-pronunciation") return generateNumberChallenges(count);
  if (mode === "abbreviation") return generateAbbreviationChallenges(count);
  return generateReverseChallenges(count);
}

function scorerFor(mode: DrillType): (c: DrillChallenge, a: string) => DrillResult {
  if (mode === "reverse") return scoreReverse;
  if (mode === "abbreviation") return scoreAbbreviation;
  return scoreDrill;
}

export function App() {
  const [mode, setMode] = useState<AppMode>("phonetic");
  const [count, setCount] = useState<number>(5);
  const [screen, setScreen] = useState<Screen>("config");
  const [challenges, setChallenges] = useState<DrillChallenge[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<DrillResult[]>([]);
  const [abbrStatsToken, setAbbrStatsToken] = useState(0);

  const drillMode: DrillType | null = mode === "procedures" ? null : mode;
  const score = useMemo(() => (drillMode ? scorerFor(drillMode) : scoreDrill), [drillMode]);

  const handleStart = useCallback(() => {
    if (!drillMode) return;
    setChallenges(generateChallenges(drillMode, count));
    setIndex(0);
    setResults([]);
    setScreen("drill");
  }, [drillMode, count]);

  const handleSubmit = useCallback(
    (result: DrillResult) => {
      setResults((prev) => [...prev, result]);
      if (drillMode) recordDrillAttempt(drillMode, result);
    },
    [drillMode],
  );

  const handleNext = useCallback(() => {
    if (index + 1 >= challenges.length) {
      setScreen("summary");
    } else {
      setIndex(index + 1);
    }
  }, [index, challenges.length]);

  const handleRestart = useCallback(() => {
    setScreen("config");
    setChallenges([]);
    setResults([]);
    setIndex(0);
    setAbbrStatsToken((t) => t + 1);
  }, []);

  return (
    <>
      <CompassRose />
      <main className="app">
        <header className="masthead">
          <div className="masthead-eyebrow">A trainer for radio operators</div>
          <h1 className="masthead-title">
            R.O.C. <em>Phonetics</em>
          </h1>
          <p className="masthead-tagline">
            Drills for the NATO phonetic alphabet, maritime numbers, and a careful ear — offline,
            standalone, no logbook required.
          </p>
          <InstallChip />
        </header>

        <article className="card">
          <span className="card-corner-tr" aria-hidden="true" />
          <span className="card-corner-bl" aria-hidden="true" />

          <ModeTabs
            mode={mode}
            onChange={(next) => {
              setMode(next);
              handleRestart();
            }}
          />

          <div className="screen-area">
            {mode === "procedures" ? <ProceduresPanel /> : null}

            {mode !== "procedures" && screen === "config" ? (
              <>
                {mode === "abbreviation" ? (
                  <AbbreviationStats refreshToken={abbrStatsToken} />
                ) : null}
                <SessionConfig count={count} onCountChange={setCount} onStart={handleStart} />
              </>
            ) : null}

            {mode !== "procedures" && screen === "drill" && challenges[index] ? (
              mode === "abbreviation" ? (
                <AbbreviationCard
                  key={challenges[index]!.id}
                  challenge={challenges[index]!}
                  index={index}
                  total={challenges.length}
                  score={score}
                  onSubmit={handleSubmit}
                  onNext={handleNext}
                />
              ) : (
                <DrillCard
                  key={challenges[index]!.id}
                  challenge={challenges[index]!}
                  index={index}
                  total={challenges.length}
                  score={score}
                  onSubmit={handleSubmit}
                  onNext={handleNext}
                />
              )
            ) : null}

            {mode !== "procedures" && screen === "summary" ? (
              <SessionResults results={results} onRestart={handleRestart} />
            ) : null}
          </div>

          {mode !== "procedures" && mode !== "abbreviation" ? (
            <p className="help">
              Both standard ("THREE") and maritime ("TREE") forms are accepted. Voice quality for
              "Hear correct" depends on your device.
            </p>
          ) : null}
          {mode === "abbreviation" ? (
            <p className="help">
              Answers are case-insensitive. Multiple-choice and free-text questions are mixed each
              session.
            </p>
          ) : null}
        </article>

        <p className="app-footer">
          Marconi · Morse · Maritime · &nbsp;built for the half-deafened bridge wing
        </p>
      </main>
    </>
  );
}

function CompassRose() {
  return (
    <div className="compass" aria-hidden="true">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" stroke="currentColor" strokeWidth="0.6">
          <circle cx="50" cy="50" r="44" />
          <circle cx="50" cy="50" r="34" strokeDasharray="1 3" />
          <line x1="50" y1="6" x2="50" y2="94" />
          <line x1="6" y1="50" x2="94" y2="50" />
          <line x1="20" y1="20" x2="80" y2="80" strokeDasharray="1 2" />
          <line x1="80" y1="20" x2="20" y2="80" strokeDasharray="1 2" />
        </g>
        <polygon points="50,12 54,50 50,46 46,50" fill="var(--brass)" />
        <polygon points="50,88 54,50 50,54 46,50" fill="currentColor" />
        <text
          x="50"
          y="20"
          fill="currentColor"
          fontFamily="DM Mono"
          fontSize="6"
          textAnchor="middle"
        >
          N
        </text>
      </svg>
    </div>
  );
}
