import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vite-plus/test";

import { createTestApp } from "./helpers/test-app.ts";
import { signUpAndGetCookie } from "./helpers/auth.ts";

let app: FastifyInstance;
let sessionCookie: string;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  sessionCookie = await signUpAndGetCookie(app);
});

function auth() {
  return { cookie: sessionCookie };
}

describe("GET /api/progress", () => {
  test("fresh user has Module 1 in_progress, rest locked", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/progress",
      headers: auth(),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.modules["module-1"].status).toBe("in_progress");
    expect(body.modules["module-1"].lessonsCompleted).toBe(0);
    expect(body.modules["module-1"].lessonsTotal).toBe(4);
    expect(body.modules["module-2"].status).toBe("locked");
    expect(body.modules["module-3"].status).toBe("locked");
    expect(body.modules["module-4"].status).toBe("locked");
    expect(body.modules["module-5"].status).toBe("locked");
    expect(body.modules["module-6"].status).toBe("locked");
  });
});

describe("POST /api/progress/lesson/:id/complete", () => {
  test("marks lesson as complete", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/progress/lesson/lesson-1-1/complete",
      headers: auth(),
    });

    expect(res.statusCode).toBe(200);

    // Verify progress updated
    const progressRes = await app.inject({
      method: "GET",
      url: "/api/progress",
      headers: auth(),
    });
    expect(progressRes.json().modules["module-1"].lessonsCompleted).toBe(1);
  });

  test("completing same lesson twice is idempotent", async () => {
    await app.inject({
      method: "POST",
      url: "/api/progress/lesson/lesson-1-1/complete",
      headers: auth(),
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/progress/lesson/lesson-1-1/complete",
      headers: auth(),
    });

    expect(res.statusCode).toBe(200);

    const progressRes = await app.inject({
      method: "GET",
      url: "/api/progress",
      headers: auth(),
    });
    expect(progressRes.json().modules["module-1"].lessonsCompleted).toBe(1);
  });

  test("cannot complete lesson in locked module", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/progress/lesson/lesson-2-1/complete",
      headers: auth(),
    });

    expect(res.statusCode).toBe(403);
  });

  test("returns 404 for nonexistent lesson", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/progress/lesson/nonexistent/complete",
      headers: auth(),
    });

    expect(res.statusCode).toBe(404);
  });
});

describe("POST /api/progress/quiz/:id/submit", () => {
  test("returns passing score with all correct answers", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/progress/quiz/module-1-checkpoint/submit",
      headers: auth(),
      payload: {
        answers: [
          { questionId: "m1q1", selected: "c" },
          { questionId: "m1q2", selected: "a" },
          { questionId: "m1q3", selected: "b" },
          { questionId: "m1q4", selected: "b" },
          { questionId: "m1q5", selected: "c" },
          { questionId: "m1q6", selected: "d" },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.score).toBe(100);
    expect(body.passed).toBe(true);
    expect(body.unlocked[0].id).toBe("module-2");
    expect(body.unlocked[0].title).toBeDefined();
  });

  test("returns failing score and does not unlock next module", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/progress/quiz/module-1-checkpoint/submit",
      headers: auth(),
      payload: {
        answers: [
          { questionId: "m1q1", selected: "a" },
          { questionId: "m1q2", selected: "b" },
          { questionId: "m1q3", selected: "a" },
          { questionId: "m1q4", selected: "a" },
          { questionId: "m1q5", selected: "a" },
          { questionId: "m1q6", selected: "a" },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.score).toBe(0);
    expect(body.passed).toBe(false);
    expect(body.unlocked).toHaveLength(0);
  });

  test("quiz results include explanations for wrong answers", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/progress/quiz/module-1-checkpoint/submit",
      headers: auth(),
      payload: {
        answers: [
          { questionId: "m1q1", selected: "a" },
          { questionId: "m1q2", selected: "a" },
          { questionId: "m1q3", selected: "b" },
          { questionId: "m1q4", selected: "b" },
          { questionId: "m1q5", selected: "c" },
          { questionId: "m1q6", selected: "d" },
        ],
      },
    });

    const body = res.json();
    const wrongAnswer = body.results.find((r: { questionId: string }) => r.questionId === "m1q1");
    expect(wrongAnswer.correct).toBe(false);
    expect(wrongAnswer.explanation).toBeDefined();
    expect(wrongAnswer.correctAnswer).toBe("c");
  });

  test("passing quiz unlocks next module in progress tree", async () => {
    // Pass Module 1 quiz
    await app.inject({
      method: "POST",
      url: "/api/progress/quiz/module-1-checkpoint/submit",
      headers: auth(),
      payload: {
        answers: [
          { questionId: "m1q1", selected: "c" },
          { questionId: "m1q2", selected: "a" },
          { questionId: "m1q3", selected: "b" },
          { questionId: "m1q4", selected: "b" },
          { questionId: "m1q5", selected: "c" },
          { questionId: "m1q6", selected: "d" },
        ],
      },
    });

    // Check progress — Module 2 should be unlocked
    const progressRes = await app.inject({
      method: "GET",
      url: "/api/progress",
      headers: auth(),
    });

    const body = progressRes.json();
    expect(body.modules["module-2"].status).toBe("in_progress");
  });

  test("quiz validation rejects bad payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/progress/quiz/module-1-checkpoint/submit",
      headers: auth(),
      payload: { answers: "not-an-array" },
    });

    expect(res.statusCode).toBe(400);
  });

  test("returns 404 for nonexistent quiz", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/progress/quiz/nonexistent/submit",
      headers: auth(),
      payload: { answers: [] },
    });

    expect(res.statusCode).toBe(404);
  });

  test("cannot submit quiz for locked module", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/progress/quiz/module-2-checkpoint/submit",
      headers: auth(),
      payload: {
        answers: [
          { questionId: "m2q1", selected: "b" },
          { questionId: "m2q2", selected: "c" },
          { questionId: "m2q3", selected: "b" },
          { questionId: "m2q4", selected: "c" },
          { questionId: "m2q5", selected: "b" },
          { questionId: "m2q6", selected: "b" },
        ],
      },
    });

    expect(res.statusCode).toBe(403);
  });
});

describe("DELETE /api/progress", () => {
  test("clears all lesson and quiz progress", async () => {
    // Complete a lesson first
    await app.inject({
      method: "POST",
      url: "/api/progress/lesson/lesson-1-1/complete",
      headers: auth(),
    });

    // Submit a quiz
    await app.inject({
      method: "POST",
      url: "/api/progress/quiz/module-1-checkpoint/submit",
      headers: auth(),
      payload: {
        answers: [
          { questionId: "m1q1", selected: "c" },
          { questionId: "m1q2", selected: "a" },
          { questionId: "m1q3", selected: "b" },
          { questionId: "m1q4", selected: "b" },
          { questionId: "m1q5", selected: "c" },
          { questionId: "m1q6", selected: "d" },
        ],
      },
    });

    // Verify progress exists
    let progressRes = await app.inject({
      method: "GET",
      url: "/api/progress",
      headers: auth(),
    });
    expect(progressRes.json().modules["module-1"].lessonsCompleted).toBe(1);
    expect(progressRes.json().modules["module-1"].quizBestScore).toBe(100);
    expect(progressRes.json().modules["module-2"].status).toBe("in_progress");

    // Clear progress
    const deleteRes = await app.inject({
      method: "DELETE",
      url: "/api/progress",
      headers: auth(),
    });
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.json().success).toBe(true);

    // Verify progress is cleared
    progressRes = await app.inject({
      method: "GET",
      url: "/api/progress",
      headers: auth(),
    });
    expect(progressRes.json().modules["module-1"].lessonsCompleted).toBe(0);
    expect(progressRes.json().modules["module-1"].quizBestScore).toBeNull();
    expect(progressRes.json().modules["module-2"].status).toBe("locked");
  });
});
