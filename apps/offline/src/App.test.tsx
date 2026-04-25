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
    expect(screen.getByRole("button", { name: /start session/i })).toBeTruthy();
  });

  test("switches modes when a tab is clicked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Numbers" }));
    expect(screen.getByRole("tab", { name: "Numbers" }).getAttribute("aria-selected")).toBe("true");
  });

  test("runs a session: start → submit → next → summary", () => {
    render(<App />);

    // Start with 5 challenges
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /start session/i }));

    expect(screen.getByText(/challenge 1 of 5/i)).toBeTruthy();

    // Run all 5 with empty/wrong answers
    for (let i = 0; i < 5; i++) {
      const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: "ALFA" } });
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      const nextBtn = screen.queryByRole("button", { name: /next →|see results/i });
      if (nextBtn) fireEvent.click(nextBtn);
    }

    // Summary screen
    expect(screen.getByText(/average score/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /start a new session/i })).toBeTruthy();
  });

  test("Restart from summary returns to config", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /start session/i }));

    for (let i = 0; i < 5; i++) {
      const input = screen.getByLabelText(/your answer/i);
      fireEvent.change(input, { target: { value: "x" } });
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      const nextBtn = screen.queryByRole("button", { name: /next →|see results/i });
      if (nextBtn) fireEvent.click(nextBtn);
    }

    fireEvent.click(screen.getByRole("button", { name: /start a new session/i }));
    expect(screen.getByRole("button", { name: /start session/i })).toBeTruthy();
  });

  test("Listen mode has a Play prompt button", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Listen" }));
    fireEvent.click(screen.getByRole("button", { name: /start session/i }));

    expect(within(document.body).getByRole("button", { name: /play prompt/i })).toBeTruthy();
  });
});
