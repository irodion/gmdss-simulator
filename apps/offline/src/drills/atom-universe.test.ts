import { describe, expect, test } from "vite-plus/test";
import { ABBREVIATIONS } from "./abbreviations.ts";
import { atomUniverse } from "./atom-universe.ts";

describe("atomUniverse", () => {
  test("phonetic returns 36 unique atoms (26 letters + 10 digits)", () => {
    const universe = atomUniverse("phonetic");
    expect(universe).toHaveLength(36);
    expect(new Set(universe).size).toBe(36);
    expect(universe).toContain("phon:A");
    expect(universe).toContain("phon:Z");
    expect(universe).toContain("phon:0");
    expect(universe).toContain("phon:9");
  });

  test("reverse returns 36 unique listen atoms", () => {
    const universe = atomUniverse("reverse");
    expect(universe).toHaveLength(36);
    expect(new Set(universe).size).toBe(36);
    expect(universe).toContain("lstn:A");
    expect(universe).toContain("lstn:9");
  });

  test("phonetic and reverse universes don't overlap (distinct mode prefixes)", () => {
    const phon = new Set(atomUniverse("phonetic"));
    const lstn = atomUniverse("reverse");
    for (const a of lstn) expect(phon.has(a)).toBe(false);
  });

  test("number-pronunciation has exactly 4 atoms", () => {
    const universe = atomUniverse("number-pronunciation");
    expect(universe).toEqual(["num:position", "num:bearing", "num:time", "num:channel"]);
  });

  test("abbreviation has 2 atoms per ABBREVIATIONS entry, all unique", () => {
    const universe = atomUniverse("abbreviation");
    expect(universe).toHaveLength(ABBREVIATIONS.length * 2);
    expect(new Set(universe).size).toBe(universe.length);
    for (const entry of ABBREVIATIONS) {
      expect(universe).toContain(`abbr:${entry.abbr}:abbr-to-expansion`);
      expect(universe).toContain(`abbr:${entry.abbr}:expansion-to-abbr`);
    }
  });

  test("procedures returns empty (selection acts on whole scenarios)", () => {
    expect(atomUniverse("procedures")).toEqual([]);
  });
});
