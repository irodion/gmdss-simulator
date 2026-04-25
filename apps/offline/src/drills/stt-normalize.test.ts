import { describe, expect, test } from "vite-plus/test";
import { applyNormalization } from "./stt-normalize.ts";

describe("applyNormalization", () => {
  test("maps common STT outputs back to maritime forms", () => {
    expect(applyNormalization("ate seven niner")).toBe("EIGHT SEVEN NINE");
    expect(applyNormalization("tree fife")).toBe("THREE FIVE");
    expect(applyNormalization("alpha bravo")).toBe("ALFA BRAVO");
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
});
