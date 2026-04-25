import { fireEvent, render, screen } from "@testing-library/react";
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

let fakeSynth: FakeSynth;

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
});
