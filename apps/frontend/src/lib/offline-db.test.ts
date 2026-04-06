import { afterEach, describe, expect, test } from "vite-plus/test";

import {
  addPendingAction,
  cacheContent,
  cacheProgress,
  clearPendingAction,
  getCachedContent,
  getCachedProgress,
  getPendingActions,
} from "./offline-db.ts";

afterEach(async () => {
  const actions = await getPendingActions();
  for (const action of actions) {
    await clearPendingAction(action.id);
  }
});

describe("offline-db", () => {
  test("caches and retrieves content", async () => {
    await cacheContent("test-module", { title: "VHF Radio" });
    const result = await getCachedContent("test-module");
    expect(result).toEqual({ title: "VHF Radio" });
  });

  test("returns null for missing content", async () => {
    const result = await getCachedContent("nonexistent");
    expect(result).toBeNull();
  });

  test("caches and retrieves progress", async () => {
    await cacheProgress("user-progress", { lessonsCompleted: 3 });
    const result = await getCachedProgress("user-progress");
    expect(result).toEqual({ lessonsCompleted: 3 });
  });

  test("adds and retrieves pending actions", async () => {
    await addPendingAction("POST", "/api/progress/lesson/1/complete");
    await addPendingAction("POST", "/api/progress/quiz/1/submit", { answers: [] });

    const actions = await getPendingActions();
    expect(actions).toHaveLength(2);

    const paths = actions.map((a) => a.path);
    expect(paths).toContain("/api/progress/lesson/1/complete");
    expect(paths).toContain("/api/progress/quiz/1/submit");

    const quizAction = actions.find((a) => a.path === "/api/progress/quiz/1/submit");
    expect(quizAction!.body).toEqual({ answers: [] });
  });

  test("clears individual pending actions", async () => {
    await addPendingAction("POST", "/api/test1");
    await addPendingAction("POST", "/api/test2");

    const actions = await getPendingActions();
    expect(actions).toHaveLength(2);

    // Clear the first action by its ID
    const targetId = actions[0]!.id;
    const targetPath = actions[0]!.path;
    await clearPendingAction(targetId);

    const remaining = await getPendingActions();
    expect(remaining).toHaveLength(1);
    // The remaining action should NOT be the one we deleted
    expect(remaining[0]!.path).not.toBe(targetPath);
  });
});
