import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { App } from "./App.tsx";

beforeEach(() => {
  // Provide a no-op speechSynthesis so isSupported() is true and TTS calls don't blow up.
  const fakeSynth = {
    cancel: vi.fn(),
    getVoices: () => [{ lang: "en-US" } as SpeechSynthesisVoice],
    speak: (u: SpeechSynthesisUtterance) => {
      queueMicrotask(() => u.onend?.(new Event("end") as SpeechSynthesisEvent));
    },
    addEventListener: vi.fn(),
  };
  Object.defineProperty(window, "speechSynthesis", {
    value: fakeSynth,
    configurable: true,
    writable: true,
  });
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

describe("App", () => {
  test("renders config screen with mode tabs and start button", () => {
    render(<App />);
    expect(screen.getByRole("tab", { name: "Callsigns" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Numbers" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Listen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^begin/i })).toBeTruthy();
  });

  test("switches modes when a tab is clicked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Numbers" }));
    expect(screen.getByRole("tab", { name: "Numbers" }).getAttribute("aria-selected")).toBe("true");
  });

  test("runs a session: start → submit → next → summary", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));

    expect(screen.getByText(/transmission 1 of 5/i)).toBeTruthy();

    for (let i = 0; i < 5; i++) {
      const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: "ALFA" } });
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      const nextBtn = screen.queryByRole("button", { name: /next →|see results/i });
      if (nextBtn) fireEvent.click(nextBtn);
    }

    expect(screen.getByText(/logbook entry/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /begin a new watch/i })).toBeTruthy();
  });

  test("Restart from summary returns to config", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));

    for (let i = 0; i < 5; i++) {
      const input = screen.getByLabelText(/your answer/i);
      fireEvent.change(input, { target: { value: "x" } });
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      const nextBtn = screen.queryByRole("button", { name: /next →|see results/i });
      if (nextBtn) fireEvent.click(nextBtn);
    }

    fireEvent.click(screen.getByRole("button", { name: /begin a new watch/i }));
    expect(screen.getByRole("button", { name: /^begin/i })).toBeTruthy();
  });

  test("Listen mode has a Play prompt button", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Listen" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));

    expect(within(document.body).getByRole("button", { name: /play prompt/i })).toBeTruthy();
  });

  test("Abbreviations tab is reachable and starts a drill", () => {
    window.localStorage.clear();
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Abbreviations" }));
    // Empty-state stats panel before any attempts.
    expect(screen.getByText(/no attempts yet/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));

    expect(screen.getByText(/transmission 1 of 5/i)).toBeTruthy();
  });

  test("Abbreviations tab records per-item stats after submitting answers", () => {
    window.localStorage.clear();
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Abbreviations" }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));

    // Answer all 5 questions; for both MC and free-text variants we just submit
    // *something* so the recordAbbreviationAttempt branch is exercised.
    for (let i = 0; i < 5; i++) {
      const input = screen.queryByLabelText(/your answer/i) as HTMLInputElement | null;
      if (input) {
        fireEvent.change(input, { target: { value: "answer" } });
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      } else {
        const choices = document.querySelectorAll<HTMLButtonElement>(".mc-choice");
        fireEvent.click(choices[0]!);
      }
      const next = screen.queryByRole("button", { name: /next →|see results/i });
      if (next) fireEvent.click(next);
    }

    expect(screen.getByText(/logbook entry/i)).toBeTruthy();

    // Walking back to config exposes the (now non-empty) stats panel.
    fireEvent.click(screen.getByRole("button", { name: /begin a new watch/i }));
    expect(screen.queryByText(/no attempts yet/i)).toBeNull();
    expect(screen.getByRole("button", { name: /reset stats/i })).toBeTruthy();
  });
});
