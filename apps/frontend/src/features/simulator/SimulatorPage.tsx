import { useCallback, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  type ScenarioDefinition,
  type RubricDefinition,
  type ScoreBreakdown,
  scoreTranscript,
} from "@gmdss-simulator/utils";

import { useRadio } from "./hooks/use-radio.ts";
import { useSession } from "./hooks/use-session.ts";
import { useAudio } from "./hooks/use-audio.ts";
import { useScriptedResponses } from "./hooks/use-scripted-responses.ts";
import { RadioDisplay } from "./ui/RadioDisplay.tsx";
import { RotaryKnob } from "./ui/RotaryKnob.tsx";
import { RadioButton } from "./ui/RadioButton.tsx";
import { PttButton } from "./ui/PttButton.tsx";
import { DistressButton } from "./ui/DistressButton.tsx";
import { FeedbackCard } from "./ui/FeedbackCard.tsx";
import { ScenarioBriefing } from "./ui/ScenarioBriefing.tsx";
import { TranscriptView } from "./ui/TranscriptView.tsx";
import { DebriefPanel } from "./ui/DebriefPanel.tsx";
import { MicButton } from "./ui/MicButton.tsx";
import { AccessibleRadioPanel } from "./ui/AccessibleRadioPanel.tsx";

import "../../styles/simulator.css";

const SCENARIO_INDEX = [
  "1.1-radio-check",
  "1.2-channel-change",
  "1.3-port-entry",
  "1.4-position-report",
  "1.5-nav-warning",
];

async function fetchScenario(filename: string): Promise<ScenarioDefinition> {
  const resp = await fetch(`/content/en/scenarios/tier-1/${filename}.json`);
  if (!resp.ok) throw new Error(`Failed to load scenario ${filename}: ${resp.status}`);
  return resp.json() as Promise<ScenarioDefinition>;
}

async function fetchRubric(rubricId: string): Promise<RubricDefinition> {
  const resp = await fetch(`/content/en/rubrics/${rubricId}.json`);
  if (!resp.ok) throw new Error(`Failed to load rubric ${rubricId}: ${resp.status}`);
  return resp.json() as Promise<RubricDefinition>;
}

export function SimulatorPage() {
  const { t } = useTranslation("simulator");
  const radio = useRadio();
  const session = useSession();
  const audio = useAudio();

  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [rubric, setRubric] = useState<RubricDefinition | null>(null);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [inputText, setInputText] = useState("");
  const [a11yMode, setA11yMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load scenario index
  useEffect(() => {
    const controller = new AbortController();
    void Promise.all(SCENARIO_INDEX.map((name) => fetchScenario(name))).then((results) => {
      if (!controller.signal.aborted) setScenarios(results);
    });
    return () => controller.abort();
  }, []);

  // Sync audio engine with radio knobs
  useEffect(() => {
    audio.setSquelch(radio.state.squelch);
    audio.setVolume(radio.state.volume);
  }, [radio.state.squelch, radio.state.volume, audio]);

  const handleSelectScenario = useCallback(
    async (scenario: ScenarioDefinition) => {
      const r = await fetchRubric(scenario.rubricId);
      setRubric(r);
      setScore(null);
      session.dispatch({ type: "LOAD_SCENARIO", scenario });
    },
    [session],
  );

  const handleStart = useCallback(async () => {
    await audio.init({ volume: radio.state.volume, squelch: radio.state.squelch });
    session.dispatch({ type: "START_SCENARIO" });
  }, [session, audio, radio.state.volume, radio.state.squelch]);

  const handleSubmitTransmission = useCallback(() => {
    if (!inputText.trim() || session.state.phase !== "active") return;
    if (radio.state.channel === 70 || radio.state.channel === 75 || radio.state.channel === 76)
      return;
    if (radio.state.txRx === "receiving") return;
    session.dispatch({
      type: "ADD_STUDENT_TURN",
      text: inputText.trim().toUpperCase(),
      channel: radio.state.channel,
      durationMs: 3000,
    });
    setInputText("");
  }, [inputText, session, radio.state.channel, radio.state.txRx]);

  useScriptedResponses({ session, radio, audio });

  const handleEndScenario = useCallback(() => {
    if (!rubric || !session.state.scenario) return;
    const sc = session.state.scenario;
    const s = scoreTranscript(session.state.turns, rubric, sc.requiredChannel, sc.allowedChannels);
    setScore(s);
    session.dispatch({ type: "COMPLETE_SCENARIO" });
    audio.destroy();
  }, [session, rubric, audio]);

  const handleRetry = useCallback(() => {
    const scenario = session.state.scenario;
    session.dispatch({ type: "RESET" });
    radio.reset();
    setScore(null);
    audio.destroy();
    if (scenario) {
      session.dispatch({ type: "LOAD_SCENARIO", scenario });
    }
  }, [session, radio, audio]);

  const handleBack = useCallback(() => {
    session.dispatch({ type: "RESET" });
    radio.reset();
    setScore(null);
    audio.destroy();
  }, [session, radio, audio]);

  // ── Scenario selection ──
  if (session.state.phase === "loading") {
    return (
      <div>
        <h1 style={{ padding: "20px 20px 0", fontSize: 24 }}>{t("title")}</h1>
        <p style={{ padding: "8px 20px 0", color: "var(--text-soft)", fontSize: 14 }}>
          {t("selectScenario")}
        </p>
        <div className="sim-scenario-list">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className="sim-scenario-card"
              role="button"
              tabIndex={0}
              onClick={() => void handleSelectScenario(sc)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSelectScenario(sc);
              }}
            >
              <div className="sim-scenario-card__id">
                {t("tier", { tier: sc.tier })} / {sc.id}
              </div>
              <div className="sim-scenario-card__title">{sc.title}</div>
              <div className="sim-scenario-card__desc">{sc.description}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Debrief ──
  if (session.state.phase === "debriefing" && score && session.state.scenario) {
    return (
      <DebriefPanel
        turns={session.state.turns}
        score={score}
        stationPersona={session.state.scenario.stationPersona}
        onRetry={() => handleRetry()}
        onBack={handleBack}
      />
    );
  }

  const scenario = session.state.scenario;
  if (!scenario) return null;

  const txRx = radio.state.txRx;

  // ── Briefing + Active ──
  return (
    <div className="sim-layout">
      <div>
        <div className="sim-console-shell">
          <div className="sim-jack" aria-hidden="true">
            <div className="sim-plug-ring" />
            <div className="sim-plug-body" />
          </div>

          <div className="sim-console-top">
            <div>{t("consoleTitle")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                className={`sim-a11y-toggle ${a11yMode ? "sim-a11y-toggle--active" : ""}`}
                onClick={() => setA11yMode((v) => !v)}
                aria-pressed={a11yMode}
              >
                {a11yMode ? "Standard" : "Accessible"}
              </button>
              <span className="sim-meta">
                {t("tier", { tier: scenario.tier })} / {scenario.category}
              </span>
            </div>
          </div>

          {a11yMode ? (
            <AccessibleRadioPanel state={radio.state} onCommand={radio.send} />
          ) : (
            <div className="sim-radio-body">
              <span className="sim-screw sim-screw--tl" aria-hidden="true" />
              <span className="sim-screw sim-screw--tr" aria-hidden="true" />
              <span className="sim-screw sim-screw--bl" aria-hidden="true" />
              <span className="sim-screw sim-screw--br" aria-hidden="true" />

              <div className="sim-screen-row">
                <RotaryKnob
                  value={radio.state.volume}
                  label={t("vol")}
                  onChange={(v) => radio.send({ type: "SET_VOLUME", value: v })}
                />
                <RadioDisplay state={radio.state} />
                <RotaryKnob
                  value={radio.state.squelch}
                  label={t("sql")}
                  onChange={(v) => radio.send({ type: "SET_SQUELCH", value: v })}
                />
              </div>

              <div className="sim-button-row" aria-label="Radio controls">
                <RadioButton label="16 / 9" onClick={() => radio.send({ type: "QUICK_16_9" })} />
                <RadioButton
                  label="DUAL"
                  onClick={() => radio.send({ type: "TOGGLE_DUAL_WATCH" })}
                />
                <RadioButton label="H/L" onClick={() => radio.send({ type: "TOGGLE_POWER" })} />
                <RadioButton label="CH +" onClick={() => radio.send({ type: "CHANNEL_UP" })} />
                <RadioButton label="CH -" onClick={() => radio.send({ type: "CHANNEL_DOWN" })} />
              </div>

              <div className="sim-lower-zone">
                <DistressButton flipCover={radio.state.flipCover} onCommand={radio.send} />
                <PttButton
                  disabled={
                    radio.state.channel === 70 ||
                    radio.state.channel === 75 ||
                    radio.state.channel === 76 ||
                    txRx === "receiving"
                  }
                  active={txRx === "transmitting"}
                  onCommand={radio.send}
                />
              </div>

              <div className="sim-signal" aria-label="Signal status">
                <span
                  className={`sim-signal__led ${txRx === "transmitting" ? "sim-signal__led--tx" : ""}`}
                />
                <span className="sim-signal__label">TX</span>
                <span
                  className={`sim-signal__led ${txRx === "receiving" ? "sim-signal__led--rx" : ""}`}
                />
                <span className="sim-signal__label">RX</span>
              </div>
            </div>
          )}

          {session.state.phase === "active" && (
            <div className="sim-input-row">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitTransmission();
                }}
                placeholder={t("input.placeholder")}
                aria-label="Radio transmission text"
              />
              <MicButton onTranscript={setInputText} />
              <button
                type="button"
                onClick={handleSubmitTransmission}
                disabled={!inputText.trim() || txRx === "receiving"}
              >
                {t("input.submit")}
              </button>
            </div>
          )}

          <FeedbackCard score={score} />
        </div>

        <div style={{ padding: "14px 0", display: "flex", gap: 12 }}>
          {session.state.phase === "briefing" && (
            <button type="button" className="btn btn--primary" onClick={() => void handleStart()}>
              {t("start")}
            </button>
          )}
          {session.state.phase === "active" && (
            <button type="button" className="btn" onClick={handleEndScenario}>
              {t("endScenario")}
            </button>
          )}
        </div>
      </div>

      <div className="sim-side-column">
        <ScenarioBriefing scenario={scenario} />
        <TranscriptView
          turns={session.state.turns}
          stationPersona={scenario.stationPersona}
          score={score}
        />
      </div>
    </div>
  );
}
