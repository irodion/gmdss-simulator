import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { DrillChallenge, DrillResult } from "../drills/drill-types.ts";
import { scoreDrill } from "../drills/drill-types.ts";
import { DrillCard } from "./DrillCard.tsx";

const phoneticChallenge: DrillChallenge = {
  id: "p1",
  type: "phonetic",
  prompt: "Spell: AB",
  expectedAnswer: "ALFA BRAVO",
};

const reverseChallenge: DrillChallenge = {
  id: "r1",
  type: "reverse",
  prompt: "Listen and type",
  expectedAnswer: "AB",
  spoken: "ALFA BRAVO",
};

interface FakeSynth {
  cancel: ReturnType<typeof vi.fn>;
  getVoices: () => SpeechSynthesisVoice[];
  speak: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
}

interface FakeRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: FakeResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
}

interface FakeResult {
  readonly isFinal: boolean;
  readonly length: number;
  item: (i: number) => { readonly transcript: string };
}
interface FakeResultList {
  readonly length: number;
  item: (i: number) => FakeResult;
}

let fakeSynth: FakeSynth;
let lastRecognition: FakeRecognition | null = null;
const captureRecognition = (inst: FakeRecognition) => {
  lastRecognition = inst;
};

class FakeRecognitionCtor implements FakeRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  onresult: FakeRecognition["onresult"] = null;
  onerror: FakeRecognition["onerror"] = null;
  onend: FakeRecognition["onend"] = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    captureRecognition(this);
  }
}

function makeResult(transcript: string, isFinal: boolean): FakeResult {
  return {
    isFinal,
    length: 1,
    item: () => ({ transcript }),
  };
}

function makeResultList(...results: FakeResult[]): FakeResultList {
  return {
    length: results.length,
    item: (i: number) => results[i]!,
  };
}

beforeEach(() => {
  fakeSynth = {
    cancel: vi.fn(),
    getVoices: () => [{ lang: "en-US" } as SpeechSynthesisVoice],
    speak: vi.fn((u: SpeechSynthesisUtterance) => {
      queueMicrotask(() => u.onend?.(new Event("end") as SpeechSynthesisEvent));
    }),
    addEventListener: vi.fn(),
  };
  vi.stubGlobal("speechSynthesis", fakeSynth);
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text: string;
      voice: SpeechSynthesisVoice | null = null;
      lang = "";
      rate = 1;
      onend: ((e: Event) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
      constructor(t: string) {
        this.text = t;
      }
    },
  );
  lastRecognition = null;
  vi.stubGlobal("SpeechRecognition", FakeRecognitionCtor);
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DrillCard", () => {
  test("Submit is disabled until the user types something", () => {
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={0}
        total={3}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    const submit = screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: "ALFA" } });
    expect(submit.disabled).toBe(false);
  });

  test("Ctrl+Enter submits and shows the result", () => {
    const onSubmit = vi.fn<(r: DrillResult) => void>();
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={0}
        total={3}
        score={scoreDrill}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    const input = screen.getByLabelText(/your answer/i);
    fireEvent.change(input, { target: { value: "ALFA BRAVO" } });
    fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0]![0].score).toBe(100);
  });

  test("plain Enter submits in reverse mode", () => {
    const onSubmit = vi.fn();
    render(
      <DrillCard
        challenge={reverseChallenge}
        index={0}
        total={1}
        score={scoreDrill}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    const input = screen.getByLabelText(/your answer/i);
    fireEvent.change(input, { target: { value: "AB" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalled();
  });

  test("plain Enter does NOT submit in phonetic mode", () => {
    const onSubmit = vi.fn();
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={0}
        total={3}
        score={scoreDrill}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    const input = screen.getByLabelText(/your answer/i);
    fireEvent.change(input, { target: { value: "ALFA" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("after submit, Next button advances", () => {
    const onNext = vi.fn();
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={0}
        total={3}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={onNext}
      />,
    );
    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: "ALFA BRAVO" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    fireEvent.click(screen.getByRole("button", { name: /next →/i }));
    expect(onNext).toHaveBeenCalled();
  });

  test("on the last challenge, the post-submit action is 'See results'", () => {
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={2}
        total={3}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: "ALFA" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByRole("button", { name: /see results/i })).toBeTruthy();
  });

  test("Play prompt button triggers TTS in reverse mode", async () => {
    render(
      <DrillCard
        challenge={reverseChallenge}
        index={0}
        total={1}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /play prompt/i }));
    // speak() awaits ensureVoiceReady() before invoking synth.speak; flush microtasks.
    await Promise.resolve();
    await Promise.resolve();
    expect(fakeSynth.speak).toHaveBeenCalled();
  });

  test("Hear correct button triggers TTS after submission", async () => {
    render(
      <DrillCard
        challenge={reverseChallenge}
        index={0}
        total={1}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: "AB" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    fakeSynth.speak.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /hear correct/i }));
    await Promise.resolve();
    await Promise.resolve();
    expect(fakeSynth.speak).toHaveBeenCalled();
  });

  test("mic button is rendered for phonetic challenges", () => {
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={0}
        total={3}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /start voice dictation/i })).toBeTruthy();
  });

  test("mic button is NOT rendered for reverse challenges", () => {
    render(
      <DrillCard
        challenge={reverseChallenge}
        index={0}
        total={1}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /start voice dictation/i })).toBeNull();
  });

  test("final transcript fills the empty answer field, normalised", () => {
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={0}
        total={3}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /start voice dictation/i }));
    expect(lastRecognition).not.toBeNull();

    act(() => {
      lastRecognition!.onresult!({
        results: makeResultList(makeResult("alpha bravo", true)),
      });
    });

    const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
    expect(input.value).toBe("ALFA BRAVO");
  });

  test("final transcript appends with a space when the field is non-empty", () => {
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={0}
        total={3}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "ALFA" } });

    fireEvent.click(screen.getByRole("button", { name: /start voice dictation/i }));
    act(() => {
      lastRecognition!.onresult!({
        results: makeResultList(makeResult("bravo charlie", true)),
      });
    });

    expect(input.value).toBe("ALFA BRAVO CHARLIE");
  });

  test("interim transcript streams into the answer field while listening", () => {
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={0}
        total={3}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /start voice dictation/i }));

    act(() => {
      lastRecognition!.onresult!({
        results: makeResultList(makeResult("alfa bra", false)),
      });
    });

    const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
    expect(input.value).toBe("ALFA BRA");
  });

  test("cumulative final transcripts replace rather than duplicate", () => {
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={0}
        total={3}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /start voice dictation/i }));

    act(() => {
      lastRecognition!.onresult!({
        results: makeResultList(makeResult("alfa bravo", true)),
      });
    });
    const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
    expect(input.value).toBe("ALFA BRAVO");

    act(() => {
      lastRecognition!.onresult!({
        results: makeResultList(makeResult("alfa bravo", true), makeResult("charlie delta", true)),
      });
    });
    expect(input.value).toBe("ALFA BRAVO CHARLIE DELTA");
  });

  test("textarea becomes readOnly while dictating and unlocks after stop", () => {
    render(
      <DrillCard
        challenge={phoneticChallenge}
        index={0}
        total={3}
        score={scoreDrill}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
    expect(input.readOnly).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /start voice dictation/i }));
    expect(input.readOnly).toBe(true);

    act(() => lastRecognition!.onend!());
    expect(input.readOnly).toBe(false);
  });
});
