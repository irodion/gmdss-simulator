import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import "../../../i18n/index.ts";

import { ExerciseSectionView } from "./ExerciseSection.tsx";

const defaultProps = {
  prompt: "What is the distress channel?",
  options: [
    { key: "a", text: "Channel 9" },
    { key: "b", text: "Channel 16" },
    { key: "c", text: "Channel 70" },
  ],
  answer: "b",
  explanation: "Channel 16 is the international distress frequency.",
};

function clickOption(text: string) {
  const span = screen.getByText(text);
  const btn = span.closest("button")!;
  fireEvent.click(btn);
}

function clickCheckAnswer() {
  const btns = screen.getAllByRole("button");
  const checkBtn = btns.find((b) => b.classList.contains("btn--primary"))!;
  fireEvent.click(checkBtn);
}

describe("ExerciseSectionView", () => {
  test("renders prompt and all options", () => {
    render(<ExerciseSectionView {...defaultProps} />);
    expect(screen.getByText("What is the distress channel?")).toBeDefined();
    expect(screen.getByText("Channel 9")).toBeDefined();
    expect(screen.getByText("Channel 70")).toBeDefined();
    // "Channel 16" appears in options and explanation text; just check option count
    expect(screen.getAllByRole("button").length).toBe(3);
  });

  test("does not show check-answer button before selection", () => {
    render(<ExerciseSectionView {...defaultProps} />);
    // Only 3 option buttons, no "check answer"
    expect(screen.getAllByRole("button").length).toBe(3);
  });

  test("shows check-answer button after selecting an option", () => {
    render(<ExerciseSectionView {...defaultProps} />);
    clickOption("Channel 9");
    // 3 options + 1 check answer = 4
    expect(screen.getAllByRole("button").length).toBe(4);
  });

  test("shows correct feedback for right answer", () => {
    render(<ExerciseSectionView {...defaultProps} />);
    clickOption("Channel 16");
    clickCheckAnswer();
    expect(screen.getByText(/Correct!/)).toBeDefined();
  });

  test("shows incorrect feedback for wrong answer", () => {
    render(<ExerciseSectionView {...defaultProps} />);
    clickOption("Channel 9");
    clickCheckAnswer();
    expect(screen.getByText(/Incorrect/)).toBeDefined();
  });

  test("disables options after submission", () => {
    render(<ExerciseSectionView {...defaultProps} />);
    clickOption("Channel 9");
    clickCheckAnswer();
    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn.hasAttribute("disabled")).toBe(true);
    }
  });
});
