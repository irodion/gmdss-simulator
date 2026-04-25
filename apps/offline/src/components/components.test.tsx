import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { DrillResult } from "../drills/drill-types.ts";
import { MicButton } from "./MicButton.tsx";
import { ModeTabs } from "./ModeTabs.tsx";
import { PhoneticCheatsheet } from "./PhoneticCheatsheet.tsx";
import { ResultBadge } from "./ResultBadge.tsx";
import { SessionConfig } from "./SessionConfig.tsx";
import { SessionResults } from "./SessionResults.tsx";

describe("ModeTabs", () => {
  test("marks the active mode as selected", () => {
    render(<ModeTabs mode="phonetic" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "Callsigns" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("tab", { name: "Numbers" }).getAttribute("aria-selected")).toBe(
      "false",
    );
  });

  test("calls onChange with the new mode when a tab is clicked", () => {
    const onChange = vi.fn();
    render(<ModeTabs mode="phonetic" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Listen" }));
    expect(onChange).toHaveBeenCalledWith("reverse");
  });
});

describe("SessionConfig", () => {
  test("highlights the active count and starts when clicked", () => {
    const onCountChange = vi.fn();
    const onStart = vi.fn();
    render(<SessionConfig count={10} onCountChange={onCountChange} onStart={onStart} />);

    expect(screen.getByRole("button", { name: "10" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "20" }));
    expect(onCountChange).toHaveBeenCalledWith(20);
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));
    expect(onStart).toHaveBeenCalled();
  });
});

describe("ResultBadge", () => {
  function build(score: number, missed: string[] = []): DrillResult {
    return {
      challenge: { id: "t", type: "phonetic", prompt: "p", expectedAnswer: "ALFA" },
      studentAnswer: "x",
      score,
      matchedWords: [],
      missedWords: missed,
    };
  }

  test("shows correct state for a perfect score", () => {
    render(<ResultBadge result={build(100)} correctAnswer="ALFA" />);
    const row = screen.getByRole("status");
    expect(row.getAttribute("data-state")).toBe("correct");
  });

  test("shows partial state for a mid-range score", () => {
    render(<ResultBadge result={build(60, ["X"])} correctAnswer="ALFA" />);
    const row = screen.getByRole("status");
    expect(row.getAttribute("data-state")).toBe("partial");
    expect(screen.getByText(/missed: x/i)).toBeTruthy();
  });

  test("shows wrong state for a low score", () => {
    render(<ResultBadge result={build(0, ["ALFA"])} correctAnswer="ALFA" />);
    const row = screen.getByRole("status");
    expect(row.getAttribute("data-state")).toBe("wrong");
  });
});

describe("SessionResults", () => {
  test("renders an average score and a perfect-count summary", () => {
    const results: DrillResult[] = [
      {
        challenge: { id: "1", type: "phonetic", prompt: "p", expectedAnswer: "A" },
        studentAnswer: "ALFA",
        score: 100,
        matchedWords: ["ALFA"],
        missedWords: [],
      },
      {
        challenge: { id: "2", type: "phonetic", prompt: "p", expectedAnswer: "B" },
        studentAnswer: "x",
        score: 0,
        matchedWords: [],
        missedWords: ["BRAVO"],
      },
    ];
    const { container } = render(<SessionResults results={results} onRestart={() => {}} />);
    expect(screen.getByText(/logbook entry/i)).toBeTruthy();
    expect(screen.getByLabelText(/average score 50/i)).toBeTruthy();
    const detail = container.querySelector(".summary-detail");
    expect(detail?.textContent).toMatch(/1\s+perfect/);
    expect(detail?.textContent).toMatch(/over\s+2/);
  });

  test("handles an empty result list", () => {
    render(<SessionResults results={[]} onRestart={() => {}} />);
    expect(screen.getByLabelText(/average score 0/i)).toBeTruthy();
  });

  test("calls onRestart when the button is clicked", () => {
    const onRestart = vi.fn();
    render(<SessionResults results={[]} onRestart={onRestart} />);
    fireEvent.click(screen.getByRole("button", { name: /begin a new watch/i }));
    expect(onRestart).toHaveBeenCalled();
  });
});

describe("MicButton", () => {
  interface FakeRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((e: { results: { length: number; item: (i: number) => unknown } }) => void) | null;
    onerror: ((e: { error: string }) => void) | null;
    onend: (() => void) | null;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
  }

  let lastInstance: FakeRecognition | null = null;
  const captureInstance = (inst: FakeRecognition) => {
    lastInstance = inst;
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
      captureInstance(this);
    }
  }

  beforeEach(() => {
    lastInstance = null;
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders nothing when SpeechRecognition is unavailable", () => {
    const { container } = render(<MicButton onTranscript={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders disabled with the offline tooltip when navigator is offline", () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognitionCtor);
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
    render(<MicButton onTranscript={() => {}} />);
    const btn = screen.getByRole("button", {
      name: /voice input needs an internet connection/i,
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test("clicking starts recognition; result event triggers normalised onTranscript", () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognitionCtor);
    const onTranscript = vi.fn();
    render(<MicButton onTranscript={onTranscript} />);

    fireEvent.click(screen.getByRole("button", { name: /start voice dictation/i }));
    expect(lastInstance).not.toBeNull();
    expect(lastInstance!.start).toHaveBeenCalled();

    act(() => {
      lastInstance!.onresult!({
        results: {
          length: 1,
          item: () => ({
            isFinal: true,
            length: 1,
            item: () => ({ transcript: "ate niner" }),
          }),
        },
      });
    });

    expect(onTranscript).toHaveBeenCalledWith("EIGHT NINE", true);
  });

  test("permission-denied error transitions the button to a blocked state", () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognitionCtor);
    render(<MicButton onTranscript={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /start voice dictation/i }));
    act(() => lastInstance!.onerror!({ error: "not-allowed" }));

    const blocked = screen.getByRole("button", {
      name: /microphone access blocked/i,
    }) as HTMLButtonElement;
    expect(blocked.disabled).toBe(true);
  });
});

describe("PhoneticCheatsheet", () => {
  test("renders all 26 letters and 10 digits with their phonetic words", () => {
    render(<PhoneticCheatsheet />);
    expect(screen.getByText(/phonetic alphabet/i)).toBeTruthy();
    expect(screen.getByText("ALFA")).toBeTruthy();
    expect(screen.getByText("ZULU")).toBeTruthy();
    expect(screen.getByText("NIN-ER")).toBeTruthy();
    expect(screen.getByText("FIFE")).toBeTruthy();
    expect(screen.getByText("AIT")).toBeTruthy();
  });
});
