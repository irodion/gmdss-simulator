import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { simulatorAttempts } from "@gmdss-simulator/db";
import {
  scoreTranscript,
  getNextScriptedResponse,
  type ScenarioDefinition,
  type RubricDefinition,
  type ScoreBreakdown,
  type SessionState,
} from "@gmdss-simulator/utils";

import type { AdapterSet } from "../../services/ai/types.ts";
import {
  createSession,
  cancelActiveTurn,
  isStaleTurn,
  addStudentTurn,
  addStationTurn,
  type SimulatorSession,
} from "../../services/simulator-session.ts";
import { processTurn } from "../../services/ai-pipeline.ts";

// ── Message schemas ──────────────────────────────────────────────

const sessionStartSchema = z.object({
  type: z.literal("session_start"),
  scenarioId: z.string(),
});

const audioDataSchema = z.object({
  type: z.literal("audio_data"),
  turnId: z.number().int().nonnegative(),
  channel: z.number().int(),
  data: z.string(), // base64
  mimeType: z.string(),
});

const textInputSchema = z.object({
  type: z.literal("text_input"),
  turnId: z.number().int().nonnegative(),
  channel: z.number().int(),
  text: z.string().min(1).max(2000),
});

const cancelTurnSchema = z.object({
  type: z.literal("cancel_turn"),
  turnId: z.number().int().nonnegative(),
});

const sessionEndSchema = z.object({
  type: z.literal("session_end"),
});

const clientMessageSchema = z.discriminatedUnion("type", [
  sessionStartSchema,
  audioDataSchema,
  textInputSchema,
  cancelTurnSchema,
  sessionEndSchema,
]);

type ServerMessage =
  | { type: "session_ready"; sessionId: string }
  | { type: "stt_result"; turnId: number; text: string; confidence: number }
  | { type: "score"; turnId: number; breakdown: ScoreBreakdown }
  | { type: "response_text"; turnId: number; text: string; persona: string }
  | { type: "response_audio"; turnId: number; data: string; mimeType: string }
  | { type: "turn_status"; turnId: number; status: string }
  | { type: "error"; turnId?: number; code: string; message: string }
  | { type: "session_saved"; attemptId: string };

// ── Timing constants ─────────────────────────────────────────────

const SLOW_THRESHOLD_MS = 3000;
const TIMEOUT_THRESHOLD_MS = 10000;

// ── Route registration ──────────────────────────────────────────

export interface SimulatorWsOptions {
  adapters: AdapterSet;
  /** Load scenario + rubric by scenario ID. Provided by the caller. */
  loadScenario: (scenarioId: string) => Promise<{
    scenario: ScenarioDefinition;
    rubric: RubricDefinition;
  }>;
}

export default async function simulatorWsRoute(fastify: FastifyInstance, opts: SimulatorWsOptions) {
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/ws", { websocket: true }, (socket, request) => {
    const userId = request.user.id;

    let session: SimulatorSession | null = null;

    function send(msg: ServerMessage): void {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify(msg));
      }
    }

    socket.on("message", (raw: Buffer | string) => {
      const text = typeof raw === "string" ? raw : raw.toString("utf-8");

      let parsed: z.infer<typeof clientMessageSchema>;
      try {
        parsed = clientMessageSchema.parse(JSON.parse(text));
      } catch {
        send({ type: "error", code: "INVALID_MESSAGE", message: "Invalid message format" });
        return;
      }

      switch (parsed.type) {
        case "session_start":
          void handleSessionStart(parsed.scenarioId);
          break;
        case "audio_data":
          startTurn(parsed.turnId, parsed.channel, {
            audio: Buffer.from(parsed.data, "base64"),
            audioMimeType: parsed.mimeType,
          });
          break;
        case "text_input":
          startTurn(parsed.turnId, parsed.channel, { text: parsed.text });
          break;
        case "cancel_turn":
          handleCancelTurn(parsed.turnId);
          break;
        case "session_end":
          void handleSessionEnd();
          break;
      }
    });

    socket.on("close", () => {
      if (session) {
        cancelActiveTurn(session);
        // Best-effort save of interrupted session
        void saveAttempt(session).catch(() => {});
        session = null;
      }
    });

    async function handleSessionStart(scenarioId: string): Promise<void> {
      try {
        const { scenario, rubric } = await opts.loadScenario(scenarioId);
        session = createSession({
          id: randomUUID(),
          userId: userId!,
          scenario,
          rubric,
          adapters: opts.adapters,
        });
        send({ type: "session_ready", sessionId: session.id });
      } catch (err) {
        send({ type: "error", code: "SCENARIO_LOAD_FAILED", message: String(err) });
      }
    }

    function startTurn(
      turnId: number,
      channel: number,
      input: { audio?: Buffer; audioMimeType?: string; text?: string },
    ): void {
      if (session) {
        session.activeTurnPromise = handleTurnInput(turnId, channel, input);
      }
    }

    async function handleTurnInput(
      turnId: number,
      channel: number,
      input: { audio?: Buffer; audioMimeType?: string; text?: string },
    ): Promise<void> {
      if (!session) {
        send({ type: "error", turnId, code: "NO_SESSION", message: "No active session" });
        return;
      }

      // Cancel any previous in-flight turn
      if (session.activeAbortController) {
        cancelActiveTurn(session);
      }

      session.activeTurnId = turnId;
      const controller = new AbortController();
      session.activeAbortController = controller;

      // Set up timing alerts
      const slowTimer = setTimeout(() => {
        if (!isStaleTurn(session!, turnId)) {
          send({ type: "turn_status", turnId, status: "slow" });
        }
      }, SLOW_THRESHOLD_MS);

      const timeoutTimer = setTimeout(() => {
        if (!isStaleTurn(session!, turnId)) {
          send({ type: "turn_status", turnId, status: "timeout" });
          // Abort the pipeline so activeTurnPromise resolves and session_end can proceed
          controller.abort();
        }
      }, TIMEOUT_THRESHOLD_MS);

      // Run STT upfront so we have the real transcript even if LLM/TTS fails later.
      // Track STT metadata to preserve in the attempt record (the pipeline would
      // otherwise overwrite it with "text-input" since we pass text, not audio).
      let studentTranscript: string | null = null;
      let upfrontSttProvider: string | null = null;
      let upfrontSttConfidence: number | null = null;

      if (input.text) {
        studentTranscript = input.text.toUpperCase();
      } else if (input.audio) {
        try {
          // Scenario-specific vocabulary hint — Whisper strongly biases toward words
          // and style in the initial_prompt. Including a sample transmission with
          // explicit 3x repetitions counteracts Whisper's built-in repetition penalty,
          // which otherwise collapses "STATION STATION STATION" down to a single mention.
          const v = session.scenario.vessel;
          const station = session.personaContext.stationName;
          // Station-name acronyms (e.g. "RCC" — Rescue Coordination Centre) are
          // frequently misheard as more common US regulatory acronyms like "FCC".
          // Spelling them out phonetically and explicitly marking the disambiguation
          // helps Whisper choose the correct token.
          const sttPrompt = [
            `VHF marine radio transmission. Station: ${station} (${station}).`,
            "Note: RCC means Rescue Coordination Centre — always transcribe as",
            "RCC (Romeo-Charlie-Charlie), never FCC or ARC or RC.",
            `Vessel: ${v.name}${v.callsign ? `, callsign ${v.callsign}` : ""}.`,
            `Scenario: ${session.scenario.title}.`,
            "Callers repeat the station name and their own vessel name up to three times",
            "on the initial call. Transcribe every repetition verbatim — do not merge or",
            "deduplicate repeated words.",
            `Example: "${station} ${station} ${station}, THIS IS ${v.name} ${v.name} ${v.name}, RADIO CHECK, OVER."`,
            "Expected vocabulary: RCC, MAYDAY, PAN PAN, SECURITE, THIS IS, OVER, OUT, ROGER,",
            "SAY AGAIN, CORRECTION, RADIO CHECK, Channel One Six, Channel Seven Two,",
            "Alpha Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliet Kilo Lima",
            "Mike November Oscar Papa Quebec Romeo Sierra Tango Uniform Victor Whiskey",
            "X-ray Yankee Zulu, position, latitude, longitude, degrees, minutes, north, south, east, west.",
          ].join(" ");
          // Race STT against the abort signal so timeout doesn't hang on a slow provider
          const sttPromise = session.adapters.stt.transcribe(input.audio, {
            mimeType: input.audioMimeType ?? "audio/webm",
            language: "en",
            prompt: sttPrompt,
          });
          const abortPromise = new Promise<never>((_, reject) => {
            controller.signal.addEventListener("abort", () => reject(new Error("Turn cancelled")), {
              once: true,
            });
          });
          const sttResult = await Promise.race([sttPromise, abortPromise]);
          studentTranscript = sttResult.text;
          upfrontSttProvider = sttResult.provider;
          upfrontSttConfidence = sttResult.confidence;
          send({
            type: "stt_result",
            turnId,
            text: sttResult.text,
            confidence: sttResult.confidence,
          });
        } catch {
          // STT failed or timed out — studentTranscript stays null
        }
      }

      // If audio STT failed upfront, skip the pipeline entirely and go to fallback
      if (!studentTranscript && input.audio && !input.text) {
        const studentText = "(audio — STT failed)";
        addStudentTurn(session, studentText, channel, 0);
        const sessionState: SessionState = {
          phase: "active",
          scenario: session.scenario,
          turns: session.turns,
          currentTurnIndex: session.turns.length,
          startedAt: session.startedAt,
          completedAt: null,
        };
        const fallbackResp = getNextScriptedResponse(sessionState);
        if (fallbackResp) {
          addStationTurn(session, fallbackResp.text, session.scenario.requiredChannel);
          session.providerMeta.fallbackTurns.push(turnId);
          session.latestScore = scoreTranscript(
            session.turns,
            session.rubric,
            session.scenario.requiredChannel,
            session.scenario.allowedChannels,
          );
          send({
            type: "response_text",
            turnId,
            text: fallbackResp.text,
            persona: session.persona.id,
          });
          send({ type: "score", turnId, breakdown: session.latestScore });
          send({ type: "turn_status", turnId, status: "fallback" });
        } else {
          send({ type: "error", turnId, code: "STT_FAILED", message: "Speech not recognized" });
        }
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
        if (session.activeTurnId === turnId) {
          session.activeAbortController = null;
        }
        return;
      }

      try {
        const result = await processTurn(
          {
            turnId,
            text: studentTranscript ?? input.text,
          },
          {
            persona: session.persona,
            personaContext: session.personaContext,
            rubric: session.rubric,
            requiredChannel: session.scenario.requiredChannel,
            allowedChannels: session.scenario.allowedChannels,
            currentChannel: channel,
            previousTurns: session.turns,
          },
          session.adapters,
          controller.signal,
        );

        // Discard if stale
        if (isStaleTurn(session, turnId)) return;

        studentTranscript = result.transcript;

        // Update session state
        addStudentTurn(session, result.transcript, channel, 0);
        addStationTurn(session, result.responseText, session.scenario.requiredChannel);
        session.latestScore = result.score;

        // Use upfront STT metadata if available (audio turns), otherwise pipeline's
        session.providerMeta.sttProvider = upfrontSttProvider ?? result.sttProvider;
        session.providerMeta.llmProvider = result.llmProvider;
        session.providerMeta.llmPromptHash = result.llmPromptHash;
        session.providerMeta.ttsProvider = result.ttsProvider;
        session.providerMeta.sttConfidences.push(upfrontSttConfidence ?? result.sttConfidence);

        // Only send stt_result for text-input turns (audio turns already sent it upfront)
        if (!upfrontSttProvider) {
          send({
            type: "stt_result",
            turnId,
            text: result.transcript,
            confidence: result.sttConfidence,
          });
        }
        send({ type: "score", turnId, breakdown: result.score });
        send({
          type: "response_text",
          turnId,
          text: result.responseText,
          persona: session.persona.id,
        });
        send({
          type: "response_audio",
          turnId,
          data: result.responseAudio.toString("base64"),
          mimeType: result.responseAudioMimeType,
        });
      } catch (err) {
        if (isStaleTurn(session, turnId)) return;
        if (controller.signal.aborted) return;
        const errMessage = err instanceof Error ? err.message : String(err);

        // Use real transcript if STT succeeded, text input, or placeholder
        const studentText =
          studentTranscript ?? input.text?.toUpperCase() ?? "(audio — STT failed)";
        addStudentTurn(session, studentText, channel, 0);
        const sessionState: SessionState = {
          phase: "active",
          scenario: session.scenario,
          turns: session.turns,
          currentTurnIndex: session.turns.length,
          startedAt: session.startedAt,
          completedAt: null,
        };
        const fallbackResp = getNextScriptedResponse(sessionState);
        if (fallbackResp) {
          addStationTurn(session, fallbackResp.text, session.scenario.requiredChannel);
          session.providerMeta.fallbackTurns.push(turnId);

          // Recompute score with updated turns so debrief and attempt record stay accurate
          session.latestScore = scoreTranscript(
            session.turns,
            session.rubric,
            session.scenario.requiredChannel,
            session.scenario.allowedChannels,
          );

          send({
            type: "response_text",
            turnId,
            text: fallbackResp.text,
            persona: session.persona.id,
          });
          send({ type: "score", turnId, breakdown: session.latestScore });
          send({ type: "turn_status", turnId, status: "fallback" });
        } else {
          send({ type: "error", turnId, code: "PIPELINE_ERROR", message: errMessage });
        }
      } finally {
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
        if (session?.activeTurnId === turnId) {
          session.activeAbortController = null;
        }
      }
    }

    function handleCancelTurn(turnId: number): void {
      if (session && session.activeTurnId === turnId) {
        cancelActiveTurn(session);
      }
    }

    async function saveAttempt(sess: SimulatorSession): Promise<string | null> {
      const latestScore = sess.latestScore;
      const [record] = await fastify.db
        .insert(simulatorAttempts)
        .values({
          userId: sess.userId,
          scenarioId: sess.scenario.id,
          scenarioVersion: "1.0.0",
          rubricVersion: sess.rubric.version,
          jurisdictionProfile: "international",
          startedAt: new Date(sess.startedAt),
          endedAt: new Date(),
          transcriptLog: sess.turns,
          scoreBreakdown: latestScore ?? null,
          overallScore: latestScore?.overall ?? null,
          fieldCheckResults: null,
          feedback: null,
          sttProvider: sess.providerMeta.sttProvider ?? null,
          sttConfidence: sess.providerMeta.sttConfidences,
          llmProvider: sess.providerMeta.llmProvider ?? null,
          llmPromptHash: sess.providerMeta.llmPromptHash ?? null,
          ttsProvider: sess.providerMeta.ttsProvider ?? null,
          fallbackTurns:
            sess.providerMeta.fallbackTurns.length > 0 ? sess.providerMeta.fallbackTurns : null,
        })
        .returning({ id: simulatorAttempts.id });
      return record?.id ?? null;
    }

    async function handleSessionEnd(): Promise<void> {
      if (!session) return;

      // Wait for any in-flight turn to complete rather than discarding it
      if (session.activeTurnPromise) {
        await session.activeTurnPromise.catch(() => {});
      }

      try {
        const attemptId = await saveAttempt(session);
        if (attemptId) {
          send({ type: "session_saved", attemptId });
        }
      } catch (err) {
        send({ type: "error", code: "SAVE_FAILED", message: String(err) });
      }

      session = null;
    }
  });
}
