import { describe, expect, test } from "vite-plus/test";
import { ABBREVIATIONS } from "./abbreviations.ts";

describe("ABBREVIATIONS data", () => {
  test("is non-empty", () => {
    expect(ABBREVIATIONS.length).toBeGreaterThan(40);
  });

  test("has no duplicate abbreviations", () => {
    const seen = new Set<string>();
    for (const e of ABBREVIATIONS) {
      const key = e.abbr.toUpperCase();
      expect(seen.has(key), `duplicate abbreviation: ${e.abbr}`).toBe(false);
      seen.add(key);
    }
  });

  test("has unique expansion strings (so MC distractors can't collide with the answer)", () => {
    const seen = new Set<string>();
    for (const e of ABBREVIATIONS) {
      expect(seen.has(e.expansion), `duplicate expansion: ${e.expansion}`).toBe(false);
      seen.add(e.expansion);
    }
  });

  test("has no empty fields", () => {
    for (const e of ABBREVIATIONS) {
      expect(e.abbr.trim()).not.toBe("");
      expect(e.expansion.trim()).not.toBe("");
    }
  });

  test("each declared family contains at least 2 entries", () => {
    const counts = new Map<string, number>();
    for (const e of ABBREVIATIONS) {
      if (!e.family) continue;
      counts.set(e.family, (counts.get(e.family) ?? 0) + 1);
    }
    for (const [family, count] of counts) {
      expect(count, `family '${family}' should have >= 2 members`).toBeGreaterThanOrEqual(2);
    }
  });

  test("includes the web-validated unverified items required by the plan", () => {
    const required = ["TR", "Tango Romeo", "ARCC", "DW", "TW", "ARQ", "GLONASS"];
    const known = new Set(ABBREVIATIONS.map((e) => e.abbr));
    for (const a of required) {
      expect(known.has(a), `missing required entry: ${a}`).toBe(true);
    }
  });
});
