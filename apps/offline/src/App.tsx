import "./styles/app.css";
import { useCallback, useMemo, useState } from "react";
import { DrillCard } from "./components/DrillCard.tsx";
import { ModeTabs } from "./components/ModeTabs.tsx";
import { SessionConfig } from "./components/SessionConfig.tsx";
import { SessionResults } from "./components/SessionResults.tsx";
import {
  generateNumberChallenges,
  generatePhoneticChallenges,
  scoreDrill,
  type DrillChallenge,
  type DrillResult,
  type DrillType,
} from "./drills/drill-types.ts";
import { generateReverseChallenges, scoreReverse } from "./drills/reverse-mode.ts";

type Screen = "config" | "drill" | "summary";

function generateChallenges(mode: DrillType, count: number): DrillChallenge[] {
  if (mode === "phonetic") return generatePhoneticChallenges(count);
  if (mode === "number-pronunciation") return generateNumberChallenges(count);
  return generateReverseChallenges(count);
}

function scorerFor(mode: DrillType): (c: DrillChallenge, a: string) => DrillResult {
  return mode === "reverse" ? scoreReverse : scoreDrill;
}

export function App() {
  const [mode, setMode] = useState<DrillType>("phonetic");
  const [count, setCount] = useState<number>(5);
  const [screen, setScreen] = useState<Screen>("config");
  const [challenges, setChallenges] = useState<DrillChallenge[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<DrillResult[]>([]);

  const score = useMemo(() => scorerFor(mode), [mode]);

  const handleStart = useCallback(() => {
    setChallenges(generateChallenges(mode, count));
    setIndex(0);
    setResults([]);
    setScreen("drill");
  }, [mode, count]);

  const handleSubmit = useCallback((result: DrillResult) => {
    setResults((prev) => [...prev, result]);
  }, []);

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
  }, []);

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <div className="app-title">ROC Phonetics</div>
          <div className="app-subtitle">Offline NATO alphabet & maritime number trainer</div>
        </div>
      </header>

      <div className="card">
        <ModeTabs
          mode={mode}
          onChange={(next) => {
            setMode(next);
            handleRestart();
          }}
        />

        <div className="screen-area">
          {screen === "config" ? (
            <SessionConfig count={count} onCountChange={setCount} onStart={handleStart} />
          ) : null}

          {screen === "drill" && challenges[index] ? (
            <DrillCard
              key={challenges[index]!.id}
              challenge={challenges[index]!}
              index={index}
              total={challenges.length}
              score={score}
              onSubmit={handleSubmit}
              onNext={handleNext}
            />
          ) : null}

          {screen === "summary" ? (
            <SessionResults results={results} onRestart={handleRestart} />
          ) : null}
        </div>

        <p className="help">
          Type your answer and press Submit. Both standard ("THREE") and maritime ("TREE") forms are
          accepted. Voice quality for "Hear correct" depends on your device.
        </p>
      </div>
    </main>
  );
}
