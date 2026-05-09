import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import type { ExamMockSummary } from "../drills/exam-mock.ts";
import { ExamMockResults } from "./ExamMockResults.tsx";

function summary(over: Partial<ExamMockSummary> = {}): ExamMockSummary {
  return {
    perMode: [
      { mode: "phonetic", correct: 4, total: 5 },
      { mode: "number-pronunciation", correct: 3, total: 5 },
      { mode: "reverse", correct: 4, total: 5 },
      { mode: "abbreviation", correct: 5, total: 5 },
    ],
    correct: 16,
    total: 20,
    pct: 80,
    passed: true,
    ...over,
  };
}

describe("ExamMockResults", () => {
  test("renders pass verdict when passed=true", () => {
    render(<ExamMockResults summary={summary()} onClose={() => {}} />);
    expect(screen.getByText(/likely exam-ready/i)).toBeTruthy();
  });

  test("renders fail verdict when passed=false", () => {
    render(
      <ExamMockResults
        summary={summary({ correct: 12, pct: 60, passed: false })}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/keep drilling/i)).toBeTruthy();
  });

  test("renders the percent prominently", () => {
    render(<ExamMockResults summary={summary()} onClose={() => {}} />);
    const node = document.querySelector(".summary-score");
    expect(node?.textContent).toMatch(/80/);
  });

  test("renders the heading with correct/total", () => {
    render(<ExamMockResults summary={summary()} onClose={() => {}} />);
    expect(screen.getByText(/16 of 20 answered perfectly/i)).toBeTruthy();
  });

  test("renders a row per mode using MODE_LABELS strings", () => {
    render(<ExamMockResults summary={summary()} onClose={() => {}} />);
    expect(screen.getByText("Callsigns")).toBeTruthy();
    expect(screen.getByText("Numbers")).toBeTruthy();
    expect(screen.getByText("Listen")).toBeTruthy();
    expect(screen.getByText("Abbreviations")).toBeTruthy();
  });

  test("'Begin a new watch' calls onClose", () => {
    const onClose = vi.fn();
    render(<ExamMockResults summary={summary()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /begin a new watch/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("data-state on summary-detail reflects passed flag", () => {
    const { rerender } = render(<ExamMockResults summary={summary()} onClose={() => {}} />);
    expect(document.querySelector(".summary-detail")?.getAttribute("data-state")).toBe("pass");
    rerender(<ExamMockResults summary={summary({ passed: false, pct: 50 })} onClose={() => {}} />);
    expect(document.querySelector(".summary-detail")?.getAttribute("data-state")).toBe("fail");
  });
});
