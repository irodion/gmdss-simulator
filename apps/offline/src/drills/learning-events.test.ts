import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { DrillChallenge, DrillResult } from "./drill-types.ts";
import {
  abbreviationAtomId,
  clearAllLearningEvents,
  clearLearningEventsForMode,
  LEARNING_EVENTS_KEY,
  listenAtomId,
  numberAtomId,
  phoneticAtomId,
  procedureAtomId,
  readEvents,
  recordDrillAttempt,
  recordLearningEvent,
  recordLearningEvents,
  type LearningEvent,
} from "./learning-events.ts";

function event(over: Partial<LearningEvent> = {}): LearningEvent {
  return {
    v: 1,
    atomId: "phon:A",
    mode: "phonetic",
    correct: true,
    ts: Date.now(),
    ...over,
  };
}

function challenge(over: Partial<DrillChallenge>): DrillChallenge {
  return {
    id: "test",
    type: "phonetic",
    prompt: "Spell: A",
    expectedAnswer: "ALFA",
    ...over,
  };
}

type ResultOver = Omit<Partial<DrillResult>, "challenge"> & {
  challenge?: Partial<DrillChallenge>;
};

function result(over: ResultOver): DrillResult {
  const { challenge: chOver, ...rest } = over;
  return {
    challenge: challenge(chOver ?? {}),
    studentAnswer: "",
    score: 100,
    matchedWords: [],
    missedWords: [],
    ...rest,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("recordLearningEvent + readEvents", () => {
  test("roundtrips a single event", () => {
    const e = event();
    recordLearningEvent(e);
    expect(readEvents()).toEqual([e]);
  });

  test("appends events in order", () => {
    recordLearningEvent(event({ ts: 1 }));
    recordLearningEvent(event({ ts: 2 }));
    recordLearningEvent(event({ ts: 3 }));
    expect(readEvents().map((e) => e.ts)).toEqual([1, 2, 3]);
  });

  test("FIFO-caps at 2000 events", () => {
    for (let i = 0; i < 2100; i++) {
      recordLearningEvent(event({ ts: i }));
    }
    const events = readEvents();
    expect(events).toHaveLength(2000);
    expect(events[0]!.ts).toBe(100);
    expect(events[events.length - 1]!.ts).toBe(2099);
  });

  test("survives JSON corruption", () => {
    window.localStorage.setItem(LEARNING_EVENTS_KEY, "{not json");
    expect(readEvents()).toEqual([]);
    recordLearningEvent(event());
    expect(readEvents()).toHaveLength(1);
  });

  test("filters out malformed entries on read", () => {
    const valid = event();
    window.localStorage.setItem(
      LEARNING_EVENTS_KEY,
      JSON.stringify([
        valid,
        null,
        "string",
        42,
        { v: 1 }, // missing fields
        { ...valid, mode: "bogus" },
        { ...valid, v: 2 }, // wrong version
      ]),
    );
    const events = readEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(valid);
  });

  test("survives a localStorage that throws on write", () => {
    const setItem = vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => recordLearningEvent(event())).not.toThrow();
    setItem.mockRestore();
  });
});

describe("recordLearningEvents (batch)", () => {
  test("writes all events in one storage round-trip", () => {
    recordLearningEvents([event({ ts: 1 }), event({ ts: 2 }), event({ ts: 3 })]);
    expect(readEvents()).toHaveLength(3);
  });

  test("empty batch is a no-op", () => {
    recordLearningEvents([]);
    expect(readEvents()).toEqual([]);
  });
});

describe("clearLearningEventsForMode", () => {
  test("removes only events of the given mode", () => {
    recordLearningEvent(event({ mode: "phonetic" }));
    recordLearningEvent(event({ mode: "abbreviation", atomId: "abbr:DSC:abbr-to-expansion" }));
    recordLearningEvent(event({ mode: "phonetic" }));

    clearLearningEventsForMode("phonetic");

    const remaining = readEvents();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.mode).toBe("abbreviation");
  });
});

describe("clearAllLearningEvents", () => {
  test("wipes every event regardless of mode", () => {
    recordLearningEvent(event({ mode: "phonetic" }));
    recordLearningEvent(event({ mode: "procedures", atomId: "proc:v1/distress:body" }));
    clearAllLearningEvents();
    expect(readEvents()).toEqual([]);
  });
});

describe("atom-id helpers", () => {
  test("phoneticAtomId uppercases the letter", () => {
    expect(phoneticAtomId("a")).toBe("phon:A");
    expect(phoneticAtomId("Z")).toBe("phon:Z");
    expect(phoneticAtomId("0")).toBe("phon:0");
  });

  test("listenAtomId is distinct from phonetic for the same letter", () => {
    expect(listenAtomId("A")).toBe("lstn:A");
    expect(listenAtomId("A")).not.toBe(phoneticAtomId("A"));
  });

  test("numberAtomId is one of the four formats", () => {
    expect(numberAtomId("position")).toBe("num:position");
    expect(numberAtomId("bearing")).toBe("num:bearing");
    expect(numberAtomId("time")).toBe("num:time");
    expect(numberAtomId("channel")).toBe("num:channel");
  });

  test("abbreviationAtomId encodes both abbr and direction", () => {
    expect(abbreviationAtomId("DSC", "abbr-to-expansion")).toBe("abbr:DSC:abbr-to-expansion");
    expect(abbreviationAtomId("EPIRB", "expansion-to-abbr")).toBe("abbr:EPIRB:expansion-to-abbr");
  });

  test("procedureAtomId pairs rubric and dimension", () => {
    expect(procedureAtomId("v1/distress", "body")).toBe("proc:v1/distress:body");
  });
});

describe("recordDrillAttempt — phonetic", () => {
  test("emits one event per matched and missed phonetic word", () => {
    recordDrillAttempt(
      "phonetic",
      result({
        matchedWords: ["ALFA", "BRAVO"],
        missedWords: ["CHARLIE"],
      }),
    );
    const events = readEvents();
    expect(events).toHaveLength(3);
    expect(events.map((e) => `${e.atomId}:${e.correct}`).sort()).toEqual([
      "phon:A:true",
      "phon:B:true",
      "phon:C:false",
    ]);
    expect(events.every((e) => e.mode === "phonetic")).toBe(true);
  });

  test("emits one event per occurrence (no aggregation within a challenge)", () => {
    recordDrillAttempt("phonetic", result({ matchedWords: ["ALFA", "ALFA"], missedWords: [] }));
    const events = readEvents();
    expect(events).toHaveLength(2);
    expect(events.every((e) => e.atomId === "phon:A" && e.correct)).toBe(true);
  });

  test("digits route through the same phonetic atom space", () => {
    recordDrillAttempt(
      "phonetic",
      result({ matchedWords: ["ZERO", "WUN"], missedWords: ["NIN-ER"] }),
    );
    const events = readEvents();
    expect(events.map((e) => e.atomId).sort()).toEqual(["phon:0", "phon:1", "phon:9"]);
  });

  test("ignores unknown phonetic words", () => {
    recordDrillAttempt("phonetic", result({ matchedWords: ["NOTAPHONETIC"], missedWords: [] }));
    expect(readEvents()).toEqual([]);
  });
});

describe("recordDrillAttempt — reverse", () => {
  test("emits one event per character", () => {
    recordDrillAttempt(
      "reverse",
      result({
        challenge: { type: "reverse" },
        matchedWords: ["A", "B"],
        missedWords: ["C"],
      }),
    );
    const events = readEvents();
    expect(events).toHaveLength(3);
    expect(events.map((e) => `${e.atomId}:${e.correct}`).sort()).toEqual([
      "lstn:A:true",
      "lstn:B:true",
      "lstn:C:false",
    ]);
  });

  test("repeated characters produce repeated events", () => {
    recordDrillAttempt(
      "reverse",
      result({
        challenge: { type: "reverse" },
        matchedWords: ["A", "A"],
        missedWords: [],
      }),
    );
    expect(readEvents()).toHaveLength(2);
  });
});

describe("recordDrillAttempt — number-pronunciation", () => {
  test("emits one event tagged with the format", () => {
    recordDrillAttempt(
      "number-pronunciation",
      result({
        challenge: { type: "number-pronunciation", format: "position" },
        score: 100,
      }),
    );
    const events = readEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      atomId: "num:position",
      mode: "number-pronunciation",
      correct: true,
      meta: { format: "position", score: 100 },
    });
  });

  test("score < 100 is recorded as incorrect", () => {
    recordDrillAttempt(
      "number-pronunciation",
      result({
        challenge: { type: "number-pronunciation", format: "bearing" },
        score: 50,
      }),
    );
    expect(readEvents()[0]!.correct).toBe(false);
  });

  test("missing format is a no-op with a console warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    recordDrillAttempt(
      "number-pronunciation",
      result({
        challenge: { type: "number-pronunciation" },
        score: 100,
      }),
    );
    expect(readEvents()).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});

describe("recordDrillAttempt — abbreviation", () => {
  test("recovers abbr from prompt for abbr-to-expansion", () => {
    recordDrillAttempt(
      "abbreviation",
      result({
        challenge: {
          type: "abbreviation",
          direction: "abbr-to-expansion",
          prompt: "What does 'DSC' stand for?",
          expectedAnswer: "Digital Selective Calling",
        },
        score: 100,
      }),
    );
    const events = readEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      atomId: "abbr:DSC:abbr-to-expansion",
      mode: "abbreviation",
      correct: true,
      meta: { direction: "abbr-to-expansion" },
    });
  });

  test("recovers abbr from expectedAnswer for expansion-to-abbr", () => {
    recordDrillAttempt(
      "abbreviation",
      result({
        challenge: {
          type: "abbreviation",
          direction: "expansion-to-abbr",
          prompt: "What is the abbreviation for 'Digital Selective Calling'?",
          expectedAnswer: "DSC",
        },
        score: 0,
      }),
    );
    const events = readEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      atomId: "abbr:DSC:expansion-to-abbr",
      mode: "abbreviation",
      correct: false,
      meta: { direction: "expansion-to-abbr" },
    });
  });

  test("missing direction is a no-op", () => {
    recordDrillAttempt(
      "abbreviation",
      result({
        challenge: { type: "abbreviation", prompt: "...", expectedAnswer: "DSC" },
        score: 100,
      }),
    );
    expect(readEvents()).toEqual([]);
  });
});
