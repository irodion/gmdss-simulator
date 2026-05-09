import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { App } from "./App.tsx";
import { getLocalDateKey } from "./lib/date-utils.ts";

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
  test("renders config screen with mode tabs, adaptive toggle, and start button", () => {
    window.localStorage.clear();
    render(<App />);
    expect(screen.getByRole("tab", { name: "Callsigns" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Numbers" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Listen" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^begin/i })).toBeTruthy();
    const toggle = screen.getByRole("switch", { name: /toggle adaptive practice/i });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(document.querySelector(".queue-preview")).not.toBeNull();
  });

  test("daily indicator renders on adaptive mode with default zero state", () => {
    window.localStorage.clear();
    render(<App />);
    expect(document.querySelector(".daily-indicator")).not.toBeNull();
    // Streak label hidden at 0.
    expect(screen.queryByText(/day streak/i)).toBeNull();
    // Progress text shows 0 / 30.
    const node = document.querySelector(".daily-indicator");
    expect(node?.textContent).toMatch(/0.*\/.*30/);
  });

  test("daily indicator hides on Free Practice mode", () => {
    window.localStorage.clear();
    window.localStorage.setItem("roc-trainer:adaptive-enabled", "false");
    render(<App />);
    expect(document.querySelector(".daily-indicator")).toBeNull();
  });

  test("Logbook is reachable from masthead and Back returns to config", () => {
    window.localStorage.clear();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /logbook/i }));
    // Logbook hides mode tabs.
    expect(screen.queryByRole("tab", { name: "Callsigns" })).toBeNull();
    // Back returns to config.
    fireEvent.click(screen.getByRole("button", { name: /^← back$/i }));
    expect(screen.getByRole("tab", { name: "Callsigns" })).toBeTruthy();
  });

  test("opening Logbook mid-drill and pressing Back resumes the drill", () => {
    window.localStorage.clear();
    render(<App />);

    // Start a 5-question drill, advance to transmission 2.
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));
    expect(screen.getByText(/transmission 1 of 5/i)).toBeTruthy();
    const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "ALFA" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    fireEvent.click(screen.getByRole("button", { name: /next →/i }));
    expect(screen.getByText(/transmission 2 of 5/i)).toBeTruthy();

    // Open Logbook from the drill.
    fireEvent.click(screen.getByRole("button", { name: /logbook/i }));
    expect(screen.queryByText(/transmission \d of 5/i)).toBeNull();

    // Back resumes the same drill at transmission 2 (not config).
    fireEvent.click(screen.getByRole("button", { name: /^← back$/i }));
    expect(screen.getByText(/transmission 2 of 5/i)).toBeTruthy();
  });

  test("Reset everything refreshes the adaptive toggle from storage", () => {
    window.localStorage.clear();
    window.localStorage.setItem("roc-trainer:adaptive-enabled", "false");
    render(<App />);

    // Toggle reads false from storage.
    expect(
      screen
        .getByRole("switch", { name: /toggle adaptive practice/i })
        .getAttribute("aria-checked"),
    ).toBe("false");

    // Open Logbook and click Reset (window.confirm auto-accepted).
    vi.stubGlobal("confirm", () => true);
    fireEvent.click(screen.getByRole("button", { name: /logbook/i }));
    fireEvent.click(screen.getByRole("button", { name: /reset everything/i }));

    // Reset wiped the adaptive-enabled key; default reads back as true.
    expect(window.localStorage.getItem("roc-trainer:adaptive-enabled")).toBeNull();
    // Back to config and verify the toggle UI now shows the new default.
    fireEvent.click(screen.getByRole("button", { name: /^← back$/i }));
    expect(
      screen
        .getByRole("switch", { name: /toggle adaptive practice/i })
        .getAttribute("aria-checked"),
    ).toBe("true");
  });

  test("completing an adaptive session bumps today's adaptiveItems", () => {
    window.localStorage.clear();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));

    for (let i = 0; i < 5; i++) {
      const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: "ALFA" } });
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      const next = screen.queryByRole("button", { name: /next →|see results/i });
      if (next) fireEvent.click(next);
    }

    const raw = window.localStorage.getItem("roc-trainer:daily-progress");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as {
      byDate: Record<string, { adaptiveItems: number; freeItems: number }>;
    };
    const todayKey = getLocalDateKey(Date.now());
    expect(parsed.byDate[todayKey]?.adaptiveItems).toBe(5);
  });

  test("Free Practice session bumps freeItems, not adaptiveItems", () => {
    window.localStorage.clear();
    window.localStorage.setItem("roc-trainer:adaptive-enabled", "false");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));

    for (let i = 0; i < 5; i++) {
      const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: "ALFA" } });
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      const next = screen.queryByRole("button", { name: /next →|see results/i });
      if (next) fireEvent.click(next);
    }

    const raw = window.localStorage.getItem("roc-trainer:daily-progress");
    const parsed = JSON.parse(raw!) as {
      byDate: Record<string, { adaptiveItems: number; freeItems: number }>;
      streak: { current: number };
    };
    const todayKey = Object.keys(parsed.byDate)[0]!;
    expect(parsed.byDate[todayKey]).toEqual({ adaptiveItems: 0, freeItems: 5 });
    expect(parsed.streak.current).toBe(0);
  });

  test("flipping the adaptive toggle to Free Practice hides the preview and persists", () => {
    window.localStorage.clear();
    const { unmount } = render(<App />);
    const toggle = screen.getByRole("switch", { name: /toggle adaptive practice/i });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(document.querySelector(".queue-preview")).toBeNull();
    expect(window.localStorage.getItem("roc-trainer:adaptive-enabled")).toBe("false");

    unmount();
    render(<App />);
    expect(
      screen
        .getByRole("switch", { name: /toggle adaptive practice/i })
        .getAttribute("aria-checked"),
    ).toBe("false");
  });

  test("queue preview reflects seeded weak events on first render", () => {
    window.localStorage.clear();
    // Pre-seed five wrongs each on letters A, B, C → 3 weak atoms in box 1.
    const baseTs = Date.now();
    const evs = ["A", "B", "C"].flatMap((L, i) =>
      Array.from({ length: 5 }, (_, j) => ({
        v: 1 as const,
        atomId: `phon:${L}`,
        mode: "phonetic" as const,
        correct: false,
        ts: baseTs + i * 10 + j,
      })),
    );
    window.localStorage.setItem("roc-trainer:learning-events", JSON.stringify(evs));

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "10" }));

    // Preview shows the bucket allocation, which now has weak > 0 thanks to seed.
    // The text is split across <strong> tags, so use textContent on the host node.
    const previewNode = document.querySelector(".queue-preview");
    expect(previewNode).not.toBeNull();
    const text = previewNode?.textContent ?? "";
    const weakMatch = /(\d+)\s*weak/.exec(text);
    expect(weakMatch).toBeTruthy();
    expect(Number(weakMatch![1])).toBeGreaterThan(0);
  });

  test("Free Practice mode still runs sessions when adaptive returns nothing meaningful", () => {
    // With the toggle off, generateChallenges (random) is used — verify a
    // session still completes end-to-end.
    window.localStorage.clear();
    window.localStorage.setItem("roc-trainer:adaptive-enabled", "false");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));
    expect(screen.getByText(/transmission 1 of 5/i)).toBeTruthy();
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

  test("Callsigns session writes phonetic events to the unified learning-events store", () => {
    window.localStorage.clear();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));

    for (let i = 0; i < 5; i++) {
      const input = screen.getByLabelText(/your answer/i) as HTMLTextAreaElement;
      fireEvent.change(input, { target: { value: "ALFA" } });
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      const next = screen.queryByRole("button", { name: /next →|see results/i });
      if (next) fireEvent.click(next);
    }

    const raw = window.localStorage.getItem("roc-trainer:learning-events");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { mode: string; atomId: string }[];
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed.every((e) => e.mode === "phonetic")).toBe(true);
    expect(parsed.every((e) => e.atomId.startsWith("phon:"))).toBe(true);
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

  test("Exam Mock launch from Logbook flips to exam screen with no per-item feedback", () => {
    window.localStorage.clear();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^logbook$/i }));
    fireEvent.click(screen.getByRole("button", { name: /take a 20-question exam mock/i }));
    // Mode tabs hidden, drill card visible.
    expect(screen.queryByRole("tab", { name: "Callsigns" })).toBeNull();
    expect(screen.getByText(/transmission 1 of 20/i)).toBeTruthy();
  });

  test("Exam Mock cooldown disables the Logbook button after completion", () => {
    window.localStorage.clear();
    // Pre-seed lastExamMockDate to today so the Logbook renders cooldown state directly.
    const todayKey = getLocalDateKey(Date.now());
    window.localStorage.setItem(
      "roc-trainer:daily-progress",
      JSON.stringify({
        v: 1,
        dailyGoalTarget: 30,
        byDate: {},
        streak: { current: 0, lastClearedDate: null, lastFreezeDate: null },
        unlockedBadges: [],
        lastExamMockDate: todayKey,
      }),
    );
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^logbook$/i }));
    const button = screen.getByRole("button", { name: /already taken today/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
