import { describe, expect, test } from "vite-plus/test";
import { squelchToNoiseGain } from "./radio-effects.ts";

describe("squelchToNoiseGain", () => {
  test("squelch 0 gives maximum noise", () => {
    expect(squelchToNoiseGain(0)).toBeCloseTo(0.15);
  });

  test("squelch 100 gives zero noise", () => {
    expect(squelchToNoiseGain(100)).toBeCloseTo(0);
  });

  test("squelch 50 gives half noise", () => {
    expect(squelchToNoiseGain(50)).toBeCloseTo(0.075);
  });

  test("squelch 25 gives 75% noise", () => {
    expect(squelchToNoiseGain(25)).toBeCloseTo(0.1125);
  });
});
