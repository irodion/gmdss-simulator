import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import type { DrillResult } from "../drills/drill-types.ts";
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
    fireEvent.click(screen.getByRole("button", { name: /start session/i }));
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
    render(<SessionResults results={results} onRestart={() => {}} />);
    expect(screen.getByText(/1 of 2 perfect/i)).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy();
  });

  test("handles an empty result list", () => {
    render(<SessionResults results={[]} onRestart={() => {}} />);
    expect(screen.getByText("0")).toBeTruthy();
  });

  test("calls onRestart when the button is clicked", () => {
    const onRestart = vi.fn();
    render(<SessionResults results={[]} onRestart={onRestart} />);
    fireEvent.click(screen.getByRole("button", { name: /start a new session/i }));
    expect(onRestart).toHaveBeenCalled();
  });
});

describe("PhoneticCheatsheet", () => {
  test("renders all 26 letters and 10 digits with their phonetic words", () => {
    render(<PhoneticCheatsheet />);
    expect(screen.getByText(/phonetic alphabet reference/i)).toBeTruthy();
    expect(screen.getByText("ALFA")).toBeTruthy();
    expect(screen.getByText("ZULU")).toBeTruthy();
    expect(screen.getByText("NIN-ER")).toBeTruthy();
    expect(screen.getByText("FIFE")).toBeTruthy();
    expect(screen.getByText("AIT")).toBeTruthy();
  });
});
