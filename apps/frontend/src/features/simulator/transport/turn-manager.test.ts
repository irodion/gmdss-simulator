import { describe, expect, test } from "vite-plus/test";

import { TurnManager } from "./turn-manager.ts";

describe("TurnManager", () => {
  test("starts with no active turn", () => {
    const mgr = new TurnManager();
    expect(mgr.getActiveTurnId()).toBe(-1);
  });

  test("assigns incrementing turn IDs", () => {
    const mgr = new TurnManager();
    expect(mgr.nextTurn()).toBe(0);
    expect(mgr.nextTurn()).toBe(1);
    expect(mgr.nextTurn()).toBe(2);
  });

  test("marks older turns as stale", () => {
    const mgr = new TurnManager();
    mgr.nextTurn(); // 0
    mgr.nextTurn(); // 1
    mgr.nextTurn(); // 2

    expect(mgr.isStale(0)).toBe(true);
    expect(mgr.isStale(1)).toBe(true);
    expect(mgr.isStale(2)).toBe(false); // current active
    expect(mgr.isStale(3)).toBe(false); // future
  });

  test("tracks active turn ID", () => {
    const mgr = new TurnManager();
    mgr.nextTurn();
    expect(mgr.getActiveTurnId()).toBe(0);

    mgr.nextTurn();
    expect(mgr.getActiveTurnId()).toBe(1);
  });

  test("reset clears state", () => {
    const mgr = new TurnManager();
    mgr.nextTurn();
    mgr.nextTurn();
    mgr.reset();

    expect(mgr.getActiveTurnId()).toBe(-1);
    expect(mgr.nextTurn()).toBe(0);
  });
});
