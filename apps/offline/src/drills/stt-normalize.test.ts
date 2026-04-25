import { describe, expect, test } from "vite-plus/test";
import { applyNormalization } from "./stt-normalize.ts";

describe("applyNormalization", () => {
  test("maps common STT outputs back to maritime forms", () => {
    expect(applyNormalization("ate seven niner")).toBe("EIGHT SEVEN NINE");
    expect(applyNormalization("tree fife")).toBe("THREE FIVE");
    expect(applyNormalization("alpha bravo")).toBe("ALFA BRAVO");
  });

  test("corrects common homophone misrecognitions", () => {
    expect(applyNormalization("for won")).toBe("FOUR ONE");
    expect(applyNormalization("juliett")).toBe("JULIET");
    expect(applyNormalization("oh seven")).toBe("ZERO SEVEN");
  });

  test("expands digit-only tokens into per-digit words", () => {
    expect(applyNormalization("123")).toBe("ONE TWO THREE");
    expect(applyNormalization("alfa 47 bravo")).toBe("ALFA FOUR SEVEN BRAVO");
    expect(applyNormalization("0")).toBe("ZERO");
  });

  test("passes unknown words through, uppercased", () => {
    expect(applyNormalization("hello world")).toBe("HELLO WORLD");
    expect(applyNormalization("BRAVO charlie")).toBe("BRAVO CHARLIE");
  });

  test("collapses extra whitespace and trims", () => {
    expect(applyNormalization("   alfa    bravo  ")).toBe("ALFA BRAVO");
  });

  test("returns empty string for empty input", () => {
    expect(applyNormalization("")).toBe("");
    expect(applyNormalization("   ")).toBe("");
  });

  test("strips surrounding punctuation but preserves internal hyphens", () => {
    expect(applyNormalization("ate.")).toBe("EIGHT");
    expect(applyNormalization("niner,")).toBe("NINE");
    expect(applyNormalization("X-RAY")).toBe("XRAY");
    expect(applyNormalization("(alfa) bravo!")).toBe("ALFA BRAVO");
  });
});
