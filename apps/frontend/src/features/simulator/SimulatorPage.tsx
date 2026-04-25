import { useCallback, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  type ScenarioDefinition,
  type RubricDefinition,
  type ScoreBreakdown,
  type DscScoringContext,
  scoreTranscript,
  resolveRubricTemplates,
  squelchToPercent,
  isDscMenuOpen,
} from "@gmdss-simulator/utils";

import { useRadio } from "./hooks/use-radio.ts";
import { useSession } from "./hooks/use-session.ts";
import { useAudio } from "./hooks/use-audio.ts";
import { useScriptedResponses } from "./hooks/use-scripted-responses.ts";
import { useAiSession } from "./hooks/use-ai-session.ts";
import { VOICE_TRANSMISSION_PLACEHOLDER } from "./constants.ts";
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
import { DscKeypad } from "./ui/DscKeypad.tsx";
import { TurnStatusIndicator } from "./ui/TurnStatusIndicator.tsx";

import "../../styles/simulator.css";

const SCENARIO_INDEX: Record<number, string[]> = {
  1: [
    "1.1-radio-check",
    "1.2-channel-change",
    "1.3-port-entry",
    "1.4-position-report",
    "1.5-nav-warning",
  ],
  2: ["2.1-mayday-fire"],
  3: ["3.5-deteriorating"],
  4: ["4.1-exam-distress"],
};

const API_URL = (import.meta.env.VITE_API_URL as string) || "";

async function fetchScenario(filename: string, tier: number): Promise<ScenarioDefinition> {
  const resp = await fetch(`/content/en/scenarios/tier-${tier}/${filename}.json`);
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
  const [closingRubric, setClosingRubric] = useState<RubricDefinition | null>(null);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [closingScore, setClosingScore] = useState<ScoreBreakdown | null>(null);
  const [inputText, setInputText] = useState("");
  const [a11yMode, setA11yMode] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevTxRxRef = useRef(radio.state.txRx);

  const aiSession = useAiSession({
    session,
    radio,
    audio,
    apiUrl: API_URL,
    enabled: aiMode,
  });

  // Load scenario index — all tiers
  useEffect(() => {
    const controller = new AbortController();
    const allPromises: Promise<ScenarioDefinition>[] = [];
    for (const [tier, filenames] of Object.entries(SCENARIO_INDEX)) {
      for (const name of filenames) {
        allPromises.push(fetchScenario(name, Number(tier)));
      }
    }
    void Promise.allSettled(allPromises).then((results) => {
      if (controller.signal.aborted) return;
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<ScenarioDefinition> => r.status === "fulfilled")
        .map((r) => r.value);
      setScenarios(loaded);
    });
    return () => controller.abort();
  }, []);

  // Auto-clear direct channel input after 3s of inactivity
  const sendRadioCommand = radio.send;
  useEffect(() => {
    if (!radio.state.channelInput) return;
    const id = setTimeout(() => sendRadioCommand({ type: "CLEAR_CHANNEL_INPUT" }), 3000);
    return () => clearTimeout(id);
  }, [radio.state.channelInput, sendRadioCommand]);

  // Sync audio engine with radio knobs
  useEffect(() => {
    audio.setSquelch(squelchToPercent(radio.state.squelch));
    audio.setVolume(radio.state.volume);
  }, [radio.state.squelch, radio.state.volume, audio]);

  // In AI mode, capture mic audio on PTT and send to server for STT.
  // Always stop capture on release to avoid mic leaks, even if AI disconnects mid-PTT.
  useEffect(() => {
    const prev = prevTxRxRef.current;
    prevTxRxRef.current = radio.state.txRx;

    const pressed = prev !== "transmitting" && radio.state.txRx === "transmitting";
    const released = prev === "transmitting" && radio.state.txRx !== "transmitting";

    // Mute noise on every TX transition, regardless of session phase, so the
    // radio can't get stuck silent if the phase changes mid-press.
    if (pressed) audio.setNoiseMuted(true);
    if (released) audio.setNoiseMuted(false);

    if (session.state.phase !== "active") return;

    if (aiSession.state.aiActive && pressed) {
      void audio.startCapture();
    }
    if (released) {
      void audio
        .stopCapture()
        .then(({ cleanBlob, durationMs }) => {
          if (cleanBlob.size === 0 || durationMs < 200) return;
          if (!aiSession.state.aiActive) return;
          session.dispatch({
            type: "ADD_STUDENT_TURN",
            text: VOICE_TRANSMISSION_PLACEHOLDER,
            channel: radio.state.channel,
            durationMs,
          });
          aiSession.sendAudioTurn(cleanBlob, radio.state.channel);
        })
        .catch(() => {});
    }
  }, [radio.state.txRx, radio.state.channel, audio, aiSession, session]);

  const applyScenarioDefaults = useCallback(
    (scenario: ScenarioDefinition) => {
      radio.send({ type: "SET_CHANNEL", channel: scenario.requiredChannel });
      if (scenario.initialGpsLock === false) {
        radio.send({ type: "SET_GPS_LOCK", locked: false });
      }
    },
    [radio],
  );

  const handleSelectScenario = useCallback(
    async (scenario: ScenarioDefinition) => {
      const r = await fetchRubric(scenario.rubricId);
      setRubric(r);
      setScore(null);
      setClosingScore(null);

      if (scenario.closingRubricId) {
        try {
          const cr = await fetchRubric(scenario.closingRubricId);
          setClosingRubric(
            resolveRubricTemplates(cr, { callsign: scenario.vessel.callsign ?? "" }),
          );
        } catch (err) {
          console.error("Failed to load closing rubric:", scenario.closingRubricId, err);
          setClosingRubric(null);
        }
      } else {
        setClosingRubric(null);
      }

      session.dispatch({ type: "LOAD_SCENARIO", scenario });
      applyScenarioDefaults(scenario);
    },
    [session, applyScenarioDefaults],
  );

  const handleStart = useCallback(async () => {
    await audio.init({
      volume: radio.state.volume,
      squelch: squelchToPercent(radio.state.squelch),
    });
    session.dispatch({ type: "START_SCENARIO" });

    if (aiMode) {
      aiSession.startAiSession();
    }
  }, [session, audio, radio.state.volume, radio.state.squelch, aiMode, aiSession]);

  // Block transmit while AI handshake is in progress or a turn is being processed
  const aiConnecting =
    aiMode &&
    !aiSession.state.aiActive &&
    aiSession.state.wsStatus !== "disconnected" &&
    aiSession.state.wsStatus !== "error";

  const aiTurnInFlight =
    aiSession.state.aiActive &&
    aiSession.state.turnStatus !== "idle" &&
    aiSession.state.turnStatus !== "complete" &&
    aiSession.state.turnStatus !== "error";

  const handleSubmitTransmission = useCallback(() => {
    if (!inputText.trim() || session.state.phase !== "active") return;
    if (radio.state.channel === 70 || radio.state.channel === 75 || radio.state.channel === 76)
      return;
    if (radio.state.txRx === "receiving") return;
    if (aiConnecting || aiTurnInFlight) return;

    const text = inputText.trim().toUpperCase();
    session.dispatch({
      type: "ADD_STUDENT_TURN",
      text,
      channel: radio.state.channel,
      durationMs: 3000,
    });
    setInputText("");

    if (aiSession.state.aiActive) {
      aiSession.sendTextTurn(text, radio.state.channel);
    }
  }, [
    inputText,
    session,
    radio.state.channel,
    radio.state.txRx,
    aiSession,
    aiConnecting,
    aiTurnInFlight,
  ]);

  useScriptedResponses({
    session,
    radio,
    audio,
    disabled: aiSession.state.aiActive,
  });

  const handleEndScenario = useCallback(() => {
    if (!rubric || !session.state.scenario) return;

    const sc = session.state.scenario;
    // If any turn still has an unresolved voice placeholder, the local
    // transcript can't be scored accurately — use the server's last score instead
    const hasUnresolvedAudio = session.state.turns.some(
      (t) => t.text === VOICE_TRANSMISSION_PLACEHOLDER,
    );

    if (hasUnresolvedAudio && aiSession.state.latestScore) {
      setScore(aiSession.state.latestScore);
    } else {
      // Score the opening exchange (first student turn + station context) against the opening rubric
      const studentTurns = session.state.turns.filter((t) => t.speaker === "student");
      const firstStudentTurn = studentTurns[0];
      const openingTurns = firstStudentTurn
        ? session.state.turns.filter(
            (t) => t.speaker !== "student" || t.index === firstStudentTurn.index,
          )
        : [];

      const dscContext: DscScoringContext | undefined = sc.dscRequirement
        ? {
            distressAlertSentAt: radio.state.distressAlertSentAt,
            distressAlertNature: radio.state.distressAlertNature,
            firstStudentTurnAt: firstStudentTurn?.timestamp ?? null,
            expectedNature: sc.dscRequirement.expectedNature,
          }
        : undefined;

      setScore(
        scoreTranscript(openingTurns, rubric, sc.requiredChannel, sc.allowedChannels, dscContext),
      );

      // Score closing turn(s) if a closing rubric exists
      if (closingRubric && studentTurns.length > 1) {
        const closingStudentTurns = session.state.turns.filter(
          (t) => t.speaker !== "student" || t.index !== firstStudentTurn!.index,
        );
        setClosingScore(
          scoreTranscript(
            closingStudentTurns,
            closingRubric,
            sc.requiredChannel,
            sc.allowedChannels,
            dscContext,
          ),
        );
      } else {
        setClosingScore(null);
      }
    }

    session.dispatch({ type: "COMPLETE_SCENARIO" });

    // Send session_end even if AI disconnected mid-scenario — the server may
    // still have an open session from an earlier successful handshake
    if (aiSession.state.sessionId) {
      aiSession.endAiSession();
    }
    audio.destroy();
  }, [
    session,
    rubric,
    closingRubric,
    audio,
    aiSession,
    radio.state.distressAlertSentAt,
    radio.state.distressAlertNature,
  ]);

  // Auto-complete after the terminal scripted response plays.
  // The terminal response is the last entry in scenario.scriptedResponses.
  // Checking "no pending response" alone is unreliable for multi-phase scenarios
  // (e.g. Channel Change) where a later response has a higher triggerAfterTurnIndex
  // and so is briefly not returned between intermediate station turns.
  const autoCompleteRef = useRef(false);
  const autoCompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleEndScenarioRef = useRef(handleEndScenario);
  useEffect(() => {
    handleEndScenarioRef.current = handleEndScenario;
  });
  useEffect(() => {
    return () => {
      if (autoCompleteTimerRef.current) {
        clearTimeout(autoCompleteTimerRef.current);
        autoCompleteTimerRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    const cancelTimer = () => {
      if (autoCompleteTimerRef.current) {
        clearTimeout(autoCompleteTimerRef.current);
        autoCompleteTimerRef.current = null;
      }
    };

    if (session.state.phase !== "active") {
      autoCompleteRef.current = false;
      cancelTimer();
      return;
    }
    const sc = session.state.scenario;
    if (!sc?.closingRubricId) return;

    const lastTurn = session.state.turns[session.state.turns.length - 1];
    const terminalResponse = sc.scriptedResponses[sc.scriptedResponses.length - 1];
    const terminalPlayed =
      !!terminalResponse &&
      session.state.turns.some((t) => t.speaker === "station" && t.text === terminalResponse.text);
    const done = terminalPlayed && lastTurn?.speaker === "station";

    if (!done) {
      autoCompleteRef.current = false;
      cancelTimer();
      return;
    }

    if (autoCompleteRef.current) return;
    autoCompleteRef.current = true;
    autoCompleteTimerRef.current = setTimeout(() => {
      autoCompleteTimerRef.current = null;
      handleEndScenarioRef.current();
    }, 1500);
  }, [session.state]);

  const handleRetry = useCallback(() => {
    const scenario = session.state.scenario;
    session.dispatch({ type: "RESET" });
    radio.reset();
    setScore(null);
    setClosingScore(null);
    audio.destroy();
    aiSession.disconnect();
    if (scenario) {
      session.dispatch({ type: "LOAD_SCENARIO", scenario });
      applyScenarioDefaults(scenario);
    }
  }, [session, radio, audio, aiSession, applyScenarioDefaults]);

  const handleBack = useCallback(() => {
    session.dispatch({ type: "RESET" });
    radio.reset();
    setScore(null);
    setClosingScore(null);
    audio.destroy();
    aiSession.disconnect();
  }, [session, radio, audio, aiSession]);

  // ── Scenario selection ──
  if (session.state.phase === "loading") {
    return (
      <div>
        <h1 style={{ padding: "20px 20px 0", fontSize: 24 }}>{t("title")}</h1>
        <p style={{ padding: "8px 20px 0", color: "var(--text-soft)", fontSize: 14 }}>
          {t("selectScenario")}
        </p>

        <div style={{ padding: "8px 20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={aiMode} onChange={(e) => setAiMode(e.target.checked)} />
            {t("aiMode", "AI Mode")}
            <span style={{ color: "var(--text-soft)", fontSize: 12 }}>
              {aiMode
                ? t("aiModeOn", "(AI-powered responses)")
                : t("aiModeOff", "(scripted responses)")}
            </span>
          </label>
        </div>

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
        closingScore={closingScore ?? undefined}
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
              {aiSession.state.aiActive && (
                <span className="sim-meta" style={{ color: "var(--accent)" }}>
                  AI
                </span>
              )}
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
                  min={0}
                  max={9}
                  step={1}
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
                <RadioButton
                  label="CH +"
                  onClick={() =>
                    radio.send({
                      type: isDscMenuOpen(radio.state) ? "DSC_MENU_UP" : "CHANNEL_UP",
                    })
                  }
                />
                <RadioButton
                  label="CH -"
                  onClick={() =>
                    radio.send({
                      type: isDscMenuOpen(radio.state) ? "DSC_MENU_DOWN" : "CHANNEL_DOWN",
                    })
                  }
                />
              </div>

              <div className="sim-lower-zone">
                <DistressButton
                  flipCover={radio.state.flipCover}
                  dscMenuScreen={radio.state.dscMenu.screen}
                  onCommand={radio.send}
                />
                <PttButton
                  disabled={
                    radio.state.channel === 70 ||
                    radio.state.channel === 75 ||
                    radio.state.channel === 76 ||
                    txRx === "receiving" ||
                    aiConnecting ||
                    aiTurnInFlight
                  }
                  active={txRx === "transmitting"}
                  onCommand={radio.send}
                />
                <DscKeypad onCommand={radio.send} />
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
            <>
              <TurnStatusIndicator
                status={aiSession.state.turnStatus}
                sttFailureCount={aiSession.state.sttFailureCount}
              />
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
                  disabled={
                    !inputText.trim() || txRx === "receiving" || aiConnecting || aiTurnInFlight
                  }
                >
                  {t("input.submit")}
                </button>
              </div>
            </>
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
            <button
              type="button"
              className="btn"
              onClick={handleEndScenario}
              disabled={aiTurnInFlight}
            >
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
