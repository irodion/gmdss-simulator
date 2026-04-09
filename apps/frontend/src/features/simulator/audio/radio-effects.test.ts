import { describe, expect, test } from "vite-plus/test";
import { squelchToNoiseGain } from "./radio-effects.ts";
import { squelchToPercent } from "@gmdss-simulator/utils";

describe("squelchToNoiseGain", () => {
  test("squelch 0 (open) gives full noise", () => {
    expect(squelchToNoiseGain(0)).toBe(0.15);
  });

  test("squelch below threshold gives full noise", () => {
    expect(squelchToNoiseGain(10)).toBe(0.15);
  });

  test("squelch at threshold cuts noise", () => {
    expect(squelchToNoiseGain(11)).toBe(0);
  });

  test("squelch 100 gives zero noise", () => {
    expect(squelchToNoiseGain(100)).toBe(0);
  });

  test("squelchToPercent(0) → squelchToNoiseGain gives full noise", () => {
    expect(squelchToNoiseGain(squelchToPercent(0))).toBeCloseTo(0.15);
  });

  test("squelchToPercent(1) → squelchToNoiseGain gives silence", () => {
    expect(squelchToNoiseGain(squelchToPercent(1))).toBe(0);
  });
});
