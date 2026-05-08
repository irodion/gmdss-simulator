import { describe, expect, test } from "vite-plus/test";
import {
  PHONETIC_ALPHABET,
  PHONETIC_REVERSE,
  createPhoneticChallenge,
  generateNumberChallenges,
  generatePhoneticChallenges,
  pronounceDigits,
  scoreDrill,
} from "./drill-types.ts";

describe("PHONETIC_ALPHABET", () => {
  test("maps every letter and digit", () => {
    for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
      expect(PHONETIC_ALPHABET[ch]).toBeDefined();
    }
  });

  test("uses maritime number forms", () => {
    expect(PHONETIC_ALPHABET["3"]).toBe("TREE");
    expect(PHONETIC_ALPHABET["5"]).toBe("FIFE");
    expect(PHONETIC_ALPHABET["9"]).toBe("NIN-ER");
  });
});

describe("pronounceDigits", () => {
  test("converts each digit to its maritime word", () => {
    expect(pronounceDigits("123")).toBe("WUN TOO TREE");
    expect(pronounceDigits("90")).toBe("NIN-ER ZERO");
  });

  test("leaves characters absent from the table as-is", () => {
    expect(pronounceDigits("1!")).toBe("WUN !");
  });
});

describe("createPhoneticChallenge", () => {
  test("spells a callsign as space-separated NATO words", () => {
    const c = createPhoneticChallenge("AB1", "test-1");
    expect(c.expectedAnswer).toBe("ALFA BRAVO WUN");
    expect(c.type).toBe("phonetic");
    expect(c.id).toBe("test-1");
  });

  test("uppercases input", () => {
    const c = createPhoneticChallenge("ab", "x");
    expect(c.expectedAnswer).toBe("ALFA BRAVO");
  });
});

describe("generatePhoneticChallenges", () => {
  test("returns the requested count", () => {
    expect(generatePhoneticChallenges(5)).toHaveLength(5);
    expect(generatePhoneticChallenges(20)).toHaveLength(20);
  });

  test("produces unique prompts", () => {
    const challenges = generatePhoneticChallenges(10);
    const prompts = new Set(challenges.map((c) => c.prompt));
    expect(prompts.size).toBe(10);
  });
});

describe("generateNumberChallenges", () => {
  test("returns the requested count", () => {
    expect(generateNumberChallenges(5)).toHaveLength(5);
    expect(generateNumberChallenges(20)).toHaveLength(20);
  });

  test("each challenge has a non-empty expected answer", () => {
    const challenges = generateNumberChallenges(8);
    for (const c of challenges) {
      expect(c.expectedAnswer.length).toBeGreaterThan(0);
      expect(c.type).toBe("number-pronunciation");
    }
  });

  test("every challenge carries a format tag from the known set", () => {
    const challenges = generateNumberChallenges(20);
    const allowed = new Set(["position", "bearing", "time", "channel"]);
    for (const c of challenges) {
      expect(c.format).toBeDefined();
      expect(allowed.has(c.format!)).toBe(true);
    }
  });
});

describe("PHONETIC_REVERSE", () => {
  test("round-trips against PHONETIC_ALPHABET for every entry", () => {
    for (const [letter, word] of Object.entries(PHONETIC_ALPHABET)) {
      expect(PHONETIC_REVERSE[word]).toBe(letter);
    }
  });

  test("handles maritime digit forms", () => {
    expect(PHONETIC_REVERSE["TREE"]).toBe("3");
    expect(PHONETIC_REVERSE["FIFE"]).toBe("5");
    expect(PHONETIC_REVERSE["NIN-ER"]).toBe("9");
  });
});

describe("scoreDrill", () => {
  test("scores a perfect phonetic answer at 100", () => {
    const c = createPhoneticChallenge("AB", "x");
    const r = scoreDrill(c, "ALFA BRAVO");
    expect(r.score).toBe(100);
    expect(r.missedWords).toHaveLength(0);
  });

  test("accepts maritime ↔ standard number equivalents", () => {
    const c = createPhoneticChallenge("3", "x");
    expect(scoreDrill(c, "TREE").score).toBe(100);
    expect(scoreDrill(c, "THREE").score).toBe(100);
  });

  test("partial answers get partial credit", () => {
    const c = createPhoneticChallenge("ABC", "x");
    const r = scoreDrill(c, "ALFA BRAVO");
    expect(r.score).toBe(67);
    expect(r.missedWords).toContain("CHARLIE");
  });

  test("fuzzy matches non-protected words within edit distance 1", () => {
    const c = createPhoneticChallenge("R", "x"); // expects ROMEO
    expect(scoreDrill(c, "ROMEO").score).toBe(100);
    expect(scoreDrill(c, "ROMEU").score).toBe(100);
    expect(scoreDrill(c, "ROMERO").score).toBe(100); // single insert
  });

  test("compass words require exact match", () => {
    // Build a challenge where the expected literally contains NORTH
    const fake = {
      id: "f",
      type: "number-pronunciation" as const,
      prompt: "p",
      expectedAnswer: "NORTH",
    };
    expect(scoreDrill(fake, "NORTH").score).toBe(100);
    expect(scoreDrill(fake, "SOUTH").score).toBe(0);
  });

  test("filler words don't penalize when missing", () => {
    const fake = {
      id: "f",
      type: "phonetic" as const,
      prompt: "p",
      expectedAnswer: "I HAVE THE ALFA BRAVO",
    };
    expect(scoreDrill(fake, "ALFA BRAVO").score).toBe(100);
  });

  test("strips degree and minute symbols when normalizing", () => {
    const fake = {
      id: "f",
      type: "number-pronunciation" as const,
      prompt: "p",
      expectedAnswer: "WUN TOO DEGREES",
    };
    expect(scoreDrill(fake, "12°").score).toBe(100);
  });

  test("expands typed digits to maritime words", () => {
    const fake = {
      id: "f",
      type: "number-pronunciation" as const,
      prompt: "p",
      expectedAnswer: "WUN TOO TREE",
    };
    expect(scoreDrill(fake, "123").score).toBe(100);
  });

  test("matches typed digit answers against numeric expected words", () => {
    const expectedDigits = {
      id: "f",
      type: "number-pronunciation" as const,
      prompt: "p",
      expectedAnswer: "1 2 3",
    };
    expect(scoreDrill(expectedDigits, "ONE TWO THREE").score).toBe(100);
  });

  test("matches numeric answers against numeric expected (digit vs digit)", () => {
    const fake = {
      id: "f",
      type: "number-pronunciation" as const,
      prompt: "p",
      expectedAnswer: "5",
    };
    expect(scoreDrill(fake, "5").score).toBe(100);
  });
});
