import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type DrillType,
  type DrillChallenge,
  type DrillResult,
  createScriptChallenge,
  generatePhoneticChallenges,
  generateNumberChallenges,
  bestDrillScore,
} from "./drill-types.ts";

import { MicButton } from "../ui/MicButton.tsx";
import "../../../styles/simulator.css";
import "../../../styles/pages.css";

const DRILL_TABS: { type: DrillType; label: string }[] = [
  { type: "phonetic", label: "Phonetic Alphabet" },
  { type: "number-pronunciation", label: "Number Pronunciation" },
  { type: "script-reading", label: "Script Reading" },
];

function generateChallenges(type: DrillType): DrillChallenge[] {
  switch (type) {
    case "phonetic":
      return generatePhoneticChallenges(6);
    case "number-pronunciation":
      return generateNumberChallenges(6);
    case "script-reading":
      return [0, 1, 2, 3, 4, 5].map((i) => createScriptChallenge(i));
  }
}

const WORD_LIMITS: Record<DrillType, number> = {
  phonetic: 30,
  "number-pronunciation": 50,
  "script-reading": 200,
};

const PLACEHOLDERS: Record<DrillType, string> = {
  phonetic: "Type the phonetic spelling...",
  "number-pronunciation": "Type the maritime pronunciation...",
  "script-reading": "Type the radio script...",
};

export function DrillPage() {
  const { t } = useTranslation("simulator");
  const [drillType, setDrillType] = useState<DrillType>("phonetic");
  const [sessionKey, setSessionKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputText, setInputText] = useState("");
  const [altTexts, setAltTexts] = useState<readonly string[]>([]);
  const [results, setResults] = useState<DrillResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const challenges = useMemo(() => generateChallenges(drillType), [drillType, sessionKey]);
  const current = challenges[currentIndex];
  const wordLimit = WORD_LIMITS[drillType];
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > wordLimit;

  const handleTabChange = useCallback((type: DrillType) => {
    setDrillType(type);
    setCurrentIndex(0);
    setInputText("");
    setAltTexts([]);
    setResults([]);
    setShowResult(false);
  }, []);

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
  }, []);

  // Auto-scroll input to end when text changes (PTT streaming)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.scrollLeft = inputRef.current.scrollWidth;
    }
  }, [inputText]);

  const handleSubmit = useCallback(() => {
    const trimmed = inputText.trim();
    if (!current || !trimmed || overLimit) return;
    const candidates = [trimmed, ...altTexts.filter((t) => t.trim() !== trimmed)];
    setResults((r) => [...r, bestDrillScore(current, candidates)]);
    setShowResult(true);
  }, [current, inputText, overLimit, altTexts]);

  const handleNext = useCallback(() => {
    setShowResult(false);
    setInputText("");
    setAltTexts([]);
    setCurrentIndex((i) => Math.min(i + 1, challenges.length - 1));
  }, [challenges.length]);

  const handleRestart = useCallback(() => {
    setShowResult(false);
    setInputText("");
    setAltTexts([]);
    setCurrentIndex(0);
    setResults([]);
    setSessionKey((k) => k + 1);
  }, []);

  const lastResult = results[results.length - 1];
  const isFinished = currentIndex >= challenges.length - 1 && showResult;
  const averageScore =
    results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;

  if (!current) return null;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 0 40px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        {t("title", { defaultValue: "Guided Voice Drills" })}
      </h1>

      <div className="tabs">
        {DRILL_TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            className={`tab ${drillType === tab.type ? "tab--active" : ""}`}
            onClick={() => handleTabChange(tab.type)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p style={{ color: "var(--text-soft)", fontSize: 14, marginBottom: 20 }}>
        {currentIndex + 1} / {challenges.length}
      </p>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 16, marginBottom: 16, whiteSpace: "pre-line", lineHeight: 1.5 }}>
          {current.prompt}
        </div>

        {!showResult ? (
          <>
            <div className="sim-input-row" style={{ padding: 0 }}>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder={PLACEHOLDERS[drillType]}
                aria-label="Drill answer"
                className={overLimit ? "sim-input--over-limit" : ""}
              />
              <MicButton onTranscript={handleInputChange} onAlternatives={setAltTexts} />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!inputText.trim() || overLimit}
              >
                Check
              </button>
            </div>
            {overLimit && (
              <p style={{ color: "var(--error)", fontSize: 12, marginTop: 6 }}>
                {wordCount} / {wordLimit} words — limit exceeded
              </p>
            )}
            {!overLimit && wordCount > 0 && (
              <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 6 }}>
                {wordCount} / {wordLimit} words
              </p>
            )}
            {current.hint && (
              <details style={{ marginTop: 12, fontSize: 13, color: "var(--text-dim)" }}>
                <summary style={{ cursor: "pointer" }}>Show hint</summary>
                <p style={{ marginTop: 4, whiteSpace: "pre-line" }}>{current.hint}</p>
              </details>
            )}
          </>
        ) : lastResult ? (
          <div>
            <div style={{ fontSize: 36, fontWeight: "bold", marginBottom: 12 }}>
              {lastResult.score}%
            </div>

            <div className="drill-result__section">
              <div className="drill-result__label">Your input:</div>
              <div className="drill-result__input">{lastResult.studentAnswer}</div>
            </div>

            {lastResult.matchedWords.length > 0 && (
              <div className="drill-result__section">
                <div className="drill-result__label" style={{ color: "var(--success)" }}>
                  Matched:
                </div>
                <p style={{ color: "var(--success)", fontSize: 14 }}>
                  {lastResult.matchedWords.join(", ")}
                </p>
              </div>
            )}
            {lastResult.missedWords.length > 0 && (
              <div className="drill-result__section">
                <div className="drill-result__label" style={{ color: "var(--error)" }}>
                  Missing:
                </div>
                <p style={{ color: "var(--error)", fontSize: 14 }}>
                  {lastResult.missedWords.join(", ")}
                </p>
              </div>
            )}
            <div className="drill-result__section">
              <div className="drill-result__label">Expected:</div>
              <p style={{ color: "var(--text-dim)", fontSize: 13, whiteSpace: "pre-line" }}>
                {current.expectedAnswer}
              </p>
            </div>

            {isFinished ? (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 18, marginBottom: 12 }}>
                  Session complete — average score: <strong>{averageScore}%</strong>
                </p>
                <button type="button" className="btn btn--primary" onClick={handleRestart}>
                  Restart
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                style={{ marginTop: 16 }}
                onClick={handleNext}
              >
                Next
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
