import { describe, expect, test } from "vite-plus/test";
import {
  type DrillChallenge,
  PHONETIC_ALPHABET,
  createPhoneticChallenge,
  createScriptChallenge,
  pronounceDigits,
  generatePhoneticChallenges,
  generateNumberChallenges,
  scoreDrill,
  bestDrillScore,
} from "./drill-types.ts";

describe("PHONETIC_ALPHABET", () => {
  test("maps A to ALFA", () => {
    expect(PHONETIC_ALPHABET["A"]).toBe("ALFA");
  });

  test("maps Z to ZULU", () => {
    expect(PHONETIC_ALPHABET["Z"]).toBe("ZULU");
  });

  test("maps 0 to ZERO", () => {
    expect(PHONETIC_ALPHABET["0"]).toBe("ZERO");
  });

  test("maps 9 to NIN-ER", () => {
    expect(PHONETIC_ALPHABET["9"]).toBe("NIN-ER");
  });
});

describe("createPhoneticChallenge", () => {
  test("creates challenge for a callsign", () => {
    const challenge = createPhoneticChallenge("AB", "test-1");
    expect(challenge.id).toBe("test-1");
    expect(challenge.type).toBe("phonetic");
    expect(challenge.prompt).toBe("Spell: AB");
    expect(challenge.expectedAnswer).toBe("ALFA BRAVO");
  });

  test("handles numbers in callsign", () => {
    const challenge = createPhoneticChallenge("A1", "test-2");
    expect(challenge.expectedAnswer).toBe("ALFA WUN");
  });
});

describe("createScriptChallenge", () => {
  test("creates a script reading challenge", () => {
    const c = createScriptChallenge(0);
    expect(c.type).toBe("script-reading");
    expect(c.expectedAnswer).toContain("MAYDAY");
  });

  test("wraps around index", () => {
    const c = createScriptChallenge(100);
    expect(c.type).toBe("script-reading");
  });
});

describe("createScriptChallenge — new scripts", () => {
  test("creates channel switch script", () => {
    const c = createScriptChallenge(3);
    expect(c.expectedAnswer).toContain("REQUEST CHANNEL SEVEN TWO");
  });

  test("creates PAN PAN MEDICO script", () => {
    const c = createScriptChallenge(4);
    expect(c.expectedAnswer).toContain("MEDICAL ADVICE");
    expect(c.expectedAnswer).toContain("HEAD INJURY");
  });

  test("creates SECURITE correction script", () => {
    const c = createScriptChallenge(5);
    expect(c.expectedAnswer).toContain("CANCEL MY SECURITE");
    expect(c.expectedAnswer).toContain("NOW RELIT");
  });
});

describe("pronounceDigits", () => {
  test("single digit", () => {
    expect(pronounceDigits("0")).toBe("ZERO");
    expect(pronounceDigits("5")).toBe("FIFE");
  });

  test("multi-digit", () => {
    expect(pronounceDigits("15")).toBe("WUN FIFE");
  });

  test("zero-padded", () => {
    expect(pronounceDigits("005")).toBe("ZERO ZERO FIFE");
  });

  test("empty string", () => {
    expect(pronounceDigits("")).toBe("");
  });
});

describe("generatePhoneticChallenges", () => {
  test("returns requested count", () => {
    expect(generatePhoneticChallenges(6)).toHaveLength(6);
    expect(generatePhoneticChallenges(3)).toHaveLength(3);
  });

  test("all challenges have phonetic type", () => {
    const challenges = generatePhoneticChallenges(6);
    for (const c of challenges) {
      expect(c.type).toBe("phonetic");
    }
  });

  test("no duplicate prompts", () => {
    const challenges = generatePhoneticChallenges(6);
    const prompts = challenges.map((c) => c.prompt);
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  test("includes vessel names (prompt with space)", () => {
    const challenges = generatePhoneticChallenges(6);
    const hasVessel = challenges.some((c) => c.prompt.replace("Spell: ", "").includes(" "));
    expect(hasVessel).toBe(true);
  });

  test("generated expected answers score 100% against themselves", () => {
    const challenges = generatePhoneticChallenges(6);
    for (const c of challenges) {
      const result = scoreDrill(c, c.expectedAnswer);
      expect(result.score).toBe(100);
    }
  });
});

describe("generateNumberChallenges", () => {
  test("returns requested count", () => {
    expect(generateNumberChallenges(6)).toHaveLength(6);
    expect(generateNumberChallenges(3)).toHaveLength(3);
  });

  test("all challenges have number-pronunciation type", () => {
    const challenges = generateNumberChallenges(6);
    for (const c of challenges) {
      expect(c.type).toBe("number-pronunciation");
    }
  });

  test("expected answers contain only valid maritime tokens", () => {
    const validTokens =
      /^(ZERO|WUN|TOO|TREE|FOW-ER|FIFE|SIX|SEV-EN|AIT|NIN-ER|DEGREES|MINUTES|NORTH|SOUTH|EAST|WEST|UTC|CHANNEL)$/;
    const challenges = generateNumberChallenges(6);
    for (const c of challenges) {
      const tokens = c.expectedAnswer.split(/\s+/);
      for (const token of tokens) {
        expect(token).toMatch(validTokens);
      }
    }
  });

  test("generated expected answers score 100% against themselves", () => {
    const challenges = generateNumberChallenges(6);
    for (const c of challenges) {
      const result = scoreDrill(c, c.expectedAnswer);
      expect(result.score).toBe(100);
    }
  });

  test("two calls produce different sets", () => {
    const a = generateNumberChallenges(6).map((c) => c.expectedAnswer);
    const b = generateNumberChallenges(6).map((c) => c.expectedAnswer);
    expect(a).not.toEqual(b);
  });
});

describe("scoreDrill", () => {
  test("scores perfect answer at 100%", () => {
    const challenge = createPhoneticChallenge("AB", "test-1");
    const result = scoreDrill(challenge, "ALFA BRAVO");
    expect(result.score).toBe(100);
    expect(result.matchedWords).toEqual(["ALFA", "BRAVO"]);
    expect(result.missedWords).toHaveLength(0);
  });

  test("scores partial answer", () => {
    const challenge = createPhoneticChallenge("ABC", "test-2");
    const result = scoreDrill(challenge, "ALFA BRAVO");
    expect(result.score).toBe(67); // 2 of 3
    expect(result.missedWords).toContain("CHARLIE");
  });

  test("scores empty answer at 0%", () => {
    const challenge = createPhoneticChallenge("AB", "test-3");
    const result = scoreDrill(challenge, "");
    expect(result.score).toBe(0);
  });

  test("fuzzy matches minor typos", () => {
    const challenge = createPhoneticChallenge("AB", "test-4");
    // "ALPA" is 1 edit from "ALFA" — should match
    const result = scoreDrill(challenge, "ALPA BRAVO");
    expect(result.score).toBe(100);
  });

  test("case insensitive", () => {
    const challenge = createPhoneticChallenge("A", "test-5");
    const result = scoreDrill(challenge, "alfa");
    expect(result.score).toBe(100);
  });

  test("enforces sequential order", () => {
    const challenge = createPhoneticChallenge("ABCD", "test-6");
    // reversed order — DELTA before ALFA
    const result = scoreDrill(challenge, "DELTA CHARLIE BRAVO ALFA");
    expect(result.score).toBeLessThan(100);
  });

  test("does not double-count answer tokens", () => {
    // HAMSAT has A twice → ALFA appears twice in expected
    const challenge = createPhoneticChallenge("AA", "test-7");
    // Only one ALFA provided — should match first, miss second
    const result = scoreDrill(challenge, "ALFA");
    expect(result.score).toBe(50);
  });
});

describe("scoreDrill — number normalization", () => {
  function makeChallenge(expected: string): DrillChallenge {
    return { id: "num-test", type: "script-reading", prompt: "test", expectedAnswer: expected };
  }

  test("digit '10' from speech recognition matches expected ONE ZERO", () => {
    const challenge = makeChallenge("ONE ZERO");
    const result = scoreDrill(challenge, "10");
    expect(result.score).toBe(100);
  });

  test("digit '001' from speech recognition matches expected ZERO ZERO ONE", () => {
    const challenge = makeChallenge("ZERO ZERO ONE");
    const result = scoreDrill(challenge, "001");
    expect(result.score).toBe(100);
  });

  test("word 'TEN' does NOT match expected ONE ZERO (real pronunciation mistake)", () => {
    const challenge = makeChallenge("ONE ZERO");
    const result = scoreDrill(challenge, "TEN");
    expect(result.score).toBe(0);
  });

  test("word 'TWENTY-FIVE' does NOT match expected TWO FIVE", () => {
    const challenge = makeChallenge("TWO FIVE");
    const result = scoreDrill(challenge, "TWENTY-FIVE");
    expect(result.score).toBe(0);
  });

  test("° symbol normalizes to DEGREES", () => {
    const challenge = makeChallenge("TREE SIX DEGREES");
    const result = scoreDrill(challenge, "36°");
    expect(result.score).toBe(100);
  });

  test("digits with ° expand correctly: '001°' → ZERO ZERO ONE DEGREES", () => {
    const challenge = makeChallenge("ZERO ZERO ONE DEGREES");
    const result = scoreDrill(challenge, "001°");
    expect(result.score).toBe(100);
  });

  test("mixed digits and words: '10 MINUTES NORTH' matches ONE ZERO MINUTES NORTH", () => {
    const challenge = makeChallenge("ONE ZERO MINUTES NORTH");
    const result = scoreDrill(challenge, "10 MINUTES NORTH");
    expect(result.score).toBe(100);
  });

  test("single digit '5' matches FIVE", () => {
    const challenge = makeChallenge("FIVE");
    const result = scoreDrill(challenge, "5");
    expect(result.score).toBe(100);
  });

  test("digit '0' matches ZERO", () => {
    const challenge = makeChallenge("ZERO");
    const result = scoreDrill(challenge, "0");
    expect(result.score).toBe(100);
  });

  test("real-world speech recognition output scores correctly", () => {
    // Simulates the actual user report: speech recognition mixed digits and words
    const challenge = makeChallenge(
      "MAYDAY MAYDAY MAYDAY THIS IS BLUE DUCK BLUE DUCK BLUE DUCK MAYDAY BLUE DUCK POSITION FIVE ZERO DEGREES ONE ZERO MINUTES NORTH ZERO ZERO ONE DEGREES TWO FIVE MINUTES WEST FIRE IMMEDIATE ASSISTANCE ONE TWO PERSONS OVER",
    );
    const answer =
      "MAYDAY MAYDAY MAYDAY THIS IS BLUE DUCK BLUE DUCK BLUE DUCK MAYDAY BLUE DUCK POSITION 50 DEGREES 10 MINUTES NORTH 001 DEGREES 25 MINUTES WEST FIRE IMMEDIATE ASSISTANCE 12 PERSONS OVER";
    const result = scoreDrill(challenge, answer);
    // Should score very high — the content is correct, just digit representation differs
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  test("optional filler words don't penalize", () => {
    const challenge = makeChallenge("I HAVE FIRE ON BOARD");
    const result = scoreDrill(challenge, "FIRE");
    expect(result.score).toBe(100);
  });

  test("maritime EIGHT matches expected AIT", () => {
    const challenge = makeChallenge("ZERO AIT MINUTES");
    const result = scoreDrill(challenge, "08 MINUTES");
    expect(result.score).toBe(100);
  });

  test("maritime ONE matches expected WUN", () => {
    const challenge = makeChallenge("WUN TOO TREE");
    const result = scoreDrill(challenge, "ONE TWO THREE");
    expect(result.score).toBe(100);
  });

  test("standard FIVE matches expected FIFE", () => {
    const challenge = makeChallenge("FIFE ZERO");
    const result = scoreDrill(challenge, "FIVE ZERO");
    expect(result.score).toBe(100);
  });

  test("real number pronunciation drill input scores correctly", () => {
    const challenge = makeChallenge(
      "TREE SIX DEGREES ZERO AIT MINUTES NORTH ZERO ZERO FIFE DEGREES TOO WUN MINUTES WEST",
    );
    const result = scoreDrill(challenge, "36°, 08 MINUTES NORTH 005°, 21 MINUTES WEST");
    // digits expand and maritime equivalences apply
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  test("word TEN does NOT match maritime WUN ZERO", () => {
    const challenge = makeChallenge("WUN ZERO");
    const result = scoreDrill(challenge, "TEN");
    expect(result.score).toBe(0);
  });

  test("EAST does NOT fuzzy-match WEST (protected token)", () => {
    const challenge = makeChallenge("WEST");
    const result = scoreDrill(challenge, "EAST");
    expect(result.score).toBe(0);
  });

  test("NORTH does NOT fuzzy-match SOUTH (protected token)", () => {
    const challenge = makeChallenge("NORTH");
    const result = scoreDrill(challenge, "SOUTH");
    expect(result.score).toBe(0);
  });

  test("OVER matches exactly (protected but equal)", () => {
    const challenge = makeChallenge("OVER");
    const result = scoreDrill(challenge, "OVER");
    expect(result.score).toBe(100);
  });
});

describe("scoreDrill — STT corrections", () => {
  function makeChallenge(expected: string): DrillChallenge {
    return { id: "stt-test", type: "phonetic", prompt: "test", expectedAnswer: expected };
  }

  test("ALPHA from STT matches expected ALFA", () => {
    const challenge = makeChallenge("ALFA BRAVO");
    expect(scoreDrill(challenge, "ALPHA BRAVO").score).toBe(100);
  });

  test("FOR homophone matches FOW-ER via correction + maritime equivalence", () => {
    const challenge = makeChallenge("FOW-ER");
    expect(scoreDrill(challenge, "FOR").score).toBe(100);
  });

  test("WON matches WUN via correction + maritime equivalence", () => {
    const challenge = makeChallenge("WUN");
    expect(scoreDrill(challenge, "WON").score).toBe(100);
  });

  test("ATE matches AIT via correction + maritime equivalence", () => {
    const challenge = makeChallenge("AIT");
    expect(scoreDrill(challenge, "ATE").score).toBe(100);
  });

  test("NINER without hyphen matches NIN-ER", () => {
    const challenge = makeChallenge("NIN-ER");
    expect(scoreDrill(challenge, "NINER").score).toBe(100);
  });

  test("FOWER without hyphen matches FOW-ER", () => {
    const challenge = makeChallenge("FOW-ER");
    expect(scoreDrill(challenge, "FOWER").score).toBe(100);
  });

  test("SEVEN matches SEV-EN", () => {
    const challenge = makeChallenge("SEV-EN");
    expect(scoreDrill(challenge, "SEVEN").score).toBe(100);
  });
});

describe("bestDrillScore", () => {
  function makeChallenge(expected: string): DrillChallenge {
    return { id: "best-test", type: "phonetic", prompt: "test", expectedAnswer: expected };
  }

  test("picks highest-scoring candidate", () => {
    const challenge = makeChallenge("ALFA BRAVO CHARLIE");
    const result = bestDrillScore(challenge, ["ALFA", "ALFA BRAVO", "ALFA BRAVO CHARLIE"]);
    expect(result.score).toBe(100);
    expect(result.studentAnswer).toBe("ALFA BRAVO CHARLIE");
  });

  test("single candidate degrades to scoreDrill", () => {
    const challenge = makeChallenge("ALFA");
    const result = bestDrillScore(challenge, ["ALFA"]);
    expect(result.score).toBe(100);
  });

  test("empty candidate string scores 0", () => {
    const challenge = makeChallenge("ALFA");
    const result = bestDrillScore(challenge, [""]);
    expect(result.score).toBe(0);
  });
});
