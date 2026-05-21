import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import type { TheoryQuestion } from "../drills/theory.ts";
import { TheoryCard } from "./TheoryCard.tsx";

function question(over: Partial<TheoryQuestion> = {}): TheoryQuestion {
  return {
    id: "theory-test-1",
    topic: "NAVTEX",
    prompt: "On which frequency is the International service broadcast?",
    correctAnswer: "518 kHz",
    distractors: ["490 kHz", "4209.5 kHz", "2187.5 kHz"],
    explanation: "International NAVTEX uses 518 kHz.",
    ...over,
  };
}

const OPTIONS = ["490 kHz", "518 kHz", "4209.5 kHz", "2187.5 kHz"];

describe("TheoryCard", () => {
  test("renders the prompt, topic eyebrow, progress, and four choice buttons", () => {
    const { container } = render(
      <TheoryCard
        question={question()}
        options={OPTIONS}
        index={0}
        total={5}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText(/International service/i)).toBeTruthy();
    expect(container.querySelector(".prompt-eyebrow")?.textContent).toBe("NAVTEX");
    expect(screen.getByText(/Question 1 of 5/i)).toBeTruthy();
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(4);
  });

  test("clicking the correct option submits a correct result and reveals the action button", () => {
    const onSubmit = vi.fn();
    render(
      <TheoryCard
        question={question()}
        options={OPTIONS}
        index={0}
        total={5}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "518 kHz" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0].correct).toBe(true);
    expect(screen.getByRole("button", { name: /Next/ })).toBeTruthy();
  });

  test("clicking a wrong option marks it wrong and highlights the correct one", () => {
    const onSubmit = vi.fn();
    render(
      <TheoryCard
        question={question()}
        options={OPTIONS}
        index={0}
        total={5}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    const wrong = screen.getByRole("button", { name: "490 kHz" });
    fireEvent.click(wrong);
    expect(onSubmit.mock.calls[0]![0].correct).toBe(false);
    expect(wrong.getAttribute("data-state")).toBe("wrong");
    expect(screen.getByRole("button", { name: "518 kHz" }).getAttribute("data-state")).toBe(
      "correct",
    );
  });

  test("the explanation appears only after answering, and only when present", () => {
    const { container, rerender } = render(
      <TheoryCard
        question={question()}
        options={OPTIONS}
        index={0}
        total={5}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    expect(container.querySelector(".theory-explanation")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "518 kHz" }));
    expect(container.querySelector(".theory-explanation")?.textContent).toMatch(/518 kHz/);

    rerender(
      <TheoryCard
        question={question({ id: "theory-test-2", explanation: undefined })}
        options={OPTIONS}
        index={0}
        total={5}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "518 kHz" }));
    expect(container.querySelector(".theory-explanation")).toBeNull();
  });

  test("the action button reads 'See results' on the last question and calls onNext", () => {
    const onNext = vi.fn();
    render(
      <TheoryCard
        question={question()}
        options={OPTIONS}
        index={4}
        total={5}
        onSubmit={() => {}}
        onNext={onNext}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "518 kHz" }));
    fireEvent.click(screen.getByRole("button", { name: /See results/ }));
    expect(onNext).toHaveBeenCalled();
  });
});
