import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";

import { createClient, type Database } from "../src/client.ts";
import {
  jurisdictions,
  lessonProgress,
  lessons,
  modules,
  quizAttempts,
  quizzes,
  simulatorAttempts,
  user,
} from "../src/schema/index.ts";

const TEST_DB_URL =
  process.env["DATABASE_URL"] ?? "postgres://gmdss:gmdss_dev@localhost:5432/gmdss_dev";

let db: Database;
let closeFn: () => Promise<void>;

beforeAll(async () => {
  const client = createClient(TEST_DB_URL);
  db = client.db;
  closeFn = async () => {
    await client.sql.end();
  };
});

afterAll(async () => {
  await closeFn();
});

// Helper to create a test user in better-auth's user table
async function createTestUser(email: string) {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "Test User",
      email,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return u!;
}

describe("database schema", () => {
  test("all tables exist", async () => {
    const result = await db.execute<{ table_name: string }>(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tableNames = result.map((r) => r.table_name);

    // better-auth tables
    expect(tableNames).toContain("user");
    expect(tableNames).toContain("session");
    expect(tableNames).toContain("account");
    expect(tableNames).toContain("verification");
    expect(tableNames).toContain("two_factor");

    // app tables
    expect(tableNames).toContain("modules");
    expect(tableNames).toContain("lessons");
    expect(tableNames).toContain("quizzes");
    expect(tableNames).toContain("lesson_progress");
    expect(tableNames).toContain("quiz_attempts");
    expect(tableNames).toContain("simulator_attempts");
    expect(tableNames).toContain("jurisdictions");
  });

  test("user email must be unique", async () => {
    const testUser = await createTestUser("unique-test@example.com");

    await expect(
      db.insert(user).values({
        id: crypto.randomUUID(),
        name: "User 2",
        email: "unique-test@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).rejects.toThrow();

    await db.execute(sql`DELETE FROM "user" WHERE id = ${testUser.id}`);
  });

  test("lesson_progress enforces unique user+lesson pair", async () => {
    const testUser = await createTestUser("progress-unique@example.com");

    await db.insert(lessonProgress).values({
      userId: testUser.id,
      lessonId: "lesson-1-1",
    });

    await expect(
      db.insert(lessonProgress).values({
        userId: testUser.id,
        lessonId: "lesson-1-1",
      }),
    ).rejects.toThrow();

    await db.execute(sql`DELETE FROM "user" WHERE id = ${testUser.id}`);
  });

  test("foreign key: lesson_progress rejects invalid user_id", async () => {
    await expect(
      db.insert(lessonProgress).values({
        userId: "nonexistent-user-id",
        lessonId: "lesson-1-1",
      }),
    ).rejects.toThrow();
  });

  test("foreign key: quiz_attempts rejects invalid quiz_id", async () => {
    const testUser = await createTestUser("fk-quiz-test@example.com");

    await expect(
      db.insert(quizAttempts).values({
        userId: testUser.id,
        quizId: "nonexistent-quiz",
        score: 80,
        passed: true,
        answers: [],
        results: [],
      }),
    ).rejects.toThrow();

    await db.execute(sql`DELETE FROM "user" WHERE id = ${testUser.id}`);
  });

  test("seeded data: 6 modules exist in order", async () => {
    const allModules = await db.select().from(modules).orderBy(modules.orderIndex);

    expect(allModules).toHaveLength(6);
    expect(allModules[0]!.id).toBe("module-1");
    expect(allModules[1]!.id).toBe("module-2");
    expect(allModules[2]!.id).toBe("module-3");
    expect(allModules[3]!.id).toBe("module-4");
    expect(allModules[4]!.id).toBe("module-5");
    expect(allModules[5]!.id).toBe("module-6");
  });

  test("seeded data: 33 lessons across 6 modules", async () => {
    const allLessons = await db.select().from(lessons);
    expect(allLessons).toHaveLength(33);
  });

  test("seeded data: 6 quizzes with questions", async () => {
    const allQuizzes = await db.select().from(quizzes);
    expect(allQuizzes).toHaveLength(6);

    for (const quiz of allQuizzes) {
      const questions = quiz.questions as unknown[];
      expect(questions.length).toBeGreaterThan(0);
    }
  });

  test("seeded data: international jurisdiction exists", async () => {
    const [intl] = await db
      .select()
      .from(jurisdictions)
      .where(sql`id = 'international'`);

    expect(intl).toBeDefined();
    expect(intl!.callingChannel).toBe(16);
    expect(intl!.dscChannel).toBe(70);

    const plan = intl!.channelPlan as Record<string, unknown>;
    expect(plan["16"]).toBeDefined();
    expect(plan["70"]).toBeDefined();
  });

  test("quiz_attempts accepts valid JSONB data", async () => {
    const testUser = await createTestUser("jsonb-test@example.com");

    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId: testUser.id,
        quizId: "module-1-checkpoint",
        score: 80,
        passed: true,
        answers: [{ question_id: "m1q1", selected: "b" }],
        results: [{ question_id: "m1q1", correct: true }],
      })
      .returning();

    expect(attempt!.answers).toEqual([{ question_id: "m1q1", selected: "b" }]);
    expect(attempt!.results).toEqual([{ question_id: "m1q1", correct: true }]);

    await db.execute(sql`DELETE FROM "user" WHERE id = ${testUser.id}`);
  });

  test("simulator_attempts schema accepts all fields", async () => {
    const testUser = await createTestUser("sim-test@example.com");

    const [attempt] = await db
      .insert(simulatorAttempts)
      .values({
        userId: testUser.id,
        scenarioId: "2.1",
        scenarioVersion: "1.0.0",
        rubricVersion: "1.0.0",
        jurisdictionProfile: "international",
        startedAt: new Date(),
        endedAt: new Date(),
        transcriptLog: [{ turn: 1, actor: "student", text: "MAYDAY" }],
        scoreBreakdown: { required_fields: { score: 90 } },
        overallScore: 82,
        fieldCheckResults: { mayday_x3: true },
        feedback: "Good call",
        sttProvider: "openai/whisper",
        sttConfidence: [0.94],
        llmProvider: "anthropic/claude",
        llmPromptHash: "abc123",
        ttsProvider: "openai/tts-1",
        fallbackTurns: [],
      })
      .returning();

    expect(attempt!.scenarioId).toBe("2.1");
    expect(attempt!.overallScore).toBe(82);
    expect(attempt!.sttProvider).toBe("openai/whisper");

    await db.execute(sql`DELETE FROM "user" WHERE id = ${testUser.id}`);
  });
});
