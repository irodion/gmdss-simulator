import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { lessons, quizzes } from "./content.ts";
import { user } from "./users.ts";

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: varchar("lesson_id", { length: 50 })
      .notNull()
      .references(() => lessons.id),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("lesson_progress_user_lesson").on(t.userId, t.lessonId)],
);

export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  quizId: varchar("quiz_id", { length: 50 })
    .notNull()
    .references(() => quizzes.id),
  score: integer().notNull(),
  passed: boolean().notNull(),
  answers: jsonb().notNull(),
  results: jsonb().notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const simulatorAttempts = pgTable("simulator_attempts", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  scenarioId: varchar("scenario_id", { length: 50 }).notNull(),
  scenarioVersion: varchar("scenario_version", { length: 20 }).notNull(),
  rubricVersion: varchar("rubric_version", { length: 20 }).notNull(),
  jurisdictionProfile: varchar("jurisdiction_profile", {
    length: 50,
  }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  transcriptLog: jsonb("transcript_log").notNull().default([]),
  scoreBreakdown: jsonb("score_breakdown"),
  overallScore: integer("overall_score"),
  fieldCheckResults: jsonb("field_check_results"),
  feedback: text(),
  sttProvider: varchar("stt_provider", { length: 100 }),
  sttConfidence: jsonb("stt_confidence"),
  llmProvider: varchar("llm_provider", { length: 100 }),
  llmPromptHash: varchar("llm_prompt_hash", { length: 64 }),
  ttsProvider: varchar("tts_provider", { length: 100 }),
  fallbackTurns: jsonb("fallback_turns"),
});
