import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import type { TheoryResult } from "../drills/theory-mode.ts";
import type { TheoryQuestion } from "../drills/theory.ts";
import { TheorySummary } from "./TheorySummary.tsx";

function result(correct: boolean): TheoryResult {
  const question: TheoryQuestion = {
    id: "q",
    topic: "VHF",
    prompt: "?",
    correctAnswer: "Right",
    distractors: ["A", "B", "C"],
  };
  return {
    question,
    options: ["Right", "A", "B", "C"],
    studentAnswer: correct ? "Right" : "A",
    correct,
  };
}

describe("TheorySummary", () => {
  test("shows the question count and the percentage score", () => {
    render(
      <TheorySummary
        results={[result(true), result(true), result(false), result(true)]}
        onRestart={() => {}}
      />,
    );
    expect(screen.getByText(/4 questions, marked/i)).toBeTruthy();
    expect(screen.getByLabelText(/score 75 out of 100/i)).toBeTruthy();
  });

  test("handles an empty result set without dividing by zero", () => {
    render(<TheorySummary results={[]} onRestart={() => {}} />);
    expect(screen.getByText(/0 questions, marked/i)).toBeTruthy();
    expect(screen.getByLabelText(/score 0 out of 100/i)).toBeTruthy();
  });

  test("calls onRestart when the restart button is clicked", () => {
    const onRestart = vi.fn();
    render(<TheorySummary results={[result(true)]} onRestart={onRestart} />);
    fireEvent.click(screen.getByRole("button", { name: /begin a new watch/i }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
