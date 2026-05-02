import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import { scoreAbbreviation } from "../drills/abbreviation-mode.ts";
import type { DrillChallenge, DrillResult } from "../drills/drill-types.ts";
import { AbbreviationCard } from "./AbbreviationCard.tsx";

const mcChallenge: DrillChallenge = {
  id: "abbr-mc-1",
  type: "abbreviation",
  direction: "abbr-to-expansion",
  prompt: "What does 'MRCC' stand for?",
  expectedAnswer: "Maritime Rescue Coordination Centre",
  choices: [
    "Maritime Rescue Coordination Centre",
    "Maritime Rescue Sub-Centre",
    "Joint Rescue Coordination Centre",
    "Mission Control Centre",
  ],
};

const textChallenge: DrillChallenge = {
  id: "abbr-text-1",
  type: "abbreviation",
  direction: "expansion-to-abbr",
  prompt: "What is the abbreviation for 'Maritime Rescue Coordination Centre'?",
  expectedAnswer: "MRCC",
};

describe("AbbreviationCard — multiple choice", () => {
  test("renders all 4 choices as buttons", () => {
    render(
      <AbbreviationCard
        challenge={mcChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    for (const c of mcChallenge.choices!) {
      expect(screen.getByRole("button", { name: c })).toBeTruthy();
    }
  });

  test("clicking the correct choice submits with score 100 and shows correct stamp", () => {
    const onSubmit = vi.fn<(r: DrillResult) => void>();
    render(
      <AbbreviationCard
        challenge={mcChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Maritime Rescue Coordination Centre" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0].score).toBe(100);
  });

  test("clicking a wrong choice scores 0 and disables further picks", () => {
    const onSubmit = vi.fn<(r: DrillResult) => void>();
    render(
      <AbbreviationCard
        challenge={mcChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mission Control Centre" }));
    expect(onSubmit.mock.calls[0]![0].score).toBe(0);
    // Subsequent click on the correct option should not re-submit.
    fireEvent.click(screen.getByRole("button", { name: "Maritime Rescue Coordination Centre" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("after submit, picked-correct gets data-state='correct'", () => {
    render(
      <AbbreviationCard
        challenge={mcChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    const correctBtn = screen.getByRole("button", { name: "Maritime Rescue Coordination Centre" });
    fireEvent.click(correctBtn);
    expect(correctBtn.getAttribute("data-state")).toBe("correct");
  });

  test("after a wrong submit, the correct choice is still highlighted as 'correct'", () => {
    render(
      <AbbreviationCard
        challenge={mcChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    const wrongBtn = screen.getByRole("button", { name: "Mission Control Centre" });
    const correctBtn = screen.getByRole("button", { name: "Maritime Rescue Coordination Centre" });
    fireEvent.click(wrongBtn);
    expect(wrongBtn.getAttribute("data-state")).toBe("wrong");
    expect(correctBtn.getAttribute("data-state")).toBe("correct");
  });

  test("MC variant does not render a Submit button", () => {
    render(
      <AbbreviationCard
        challenge={mcChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Submit" })).toBeNull();
  });

  test("after submit, Next button advances the session", () => {
    const onNext = vi.fn();
    render(
      <AbbreviationCard
        challenge={mcChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={() => {}}
        onNext={onNext}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Maritime Rescue Coordination Centre" }));
    fireEvent.click(screen.getByRole("button", { name: /next →/i }));
    expect(onNext).toHaveBeenCalled();
  });
});

describe("AbbreviationCard — free text", () => {
  test("renders a text input and Submit button", () => {
    render(
      <AbbreviationCard
        challenge={textChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByLabelText(/your answer/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Submit" })).toBeTruthy();
  });

  test("Submit is disabled until the user types something", () => {
    render(
      <AbbreviationCard
        challenge={textChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    const submit = screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: "MRCC" } });
    expect(submit.disabled).toBe(false);
  });

  test("Enter on an empty input does not submit", () => {
    const onSubmit = vi.fn<(r: DrillResult) => void>();
    render(
      <AbbreviationCard
        challenge={textChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    const input = screen.getByLabelText(/your answer/i);
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("Enter submits the typed answer", () => {
    const onSubmit = vi.fn<(r: DrillResult) => void>();
    render(
      <AbbreviationCard
        challenge={textChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    const input = screen.getByLabelText(/your answer/i);
    fireEvent.change(input, { target: { value: "mrcc" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0]![0].score).toBe(100);
  });

  test("on the last challenge, post-submit action says 'See results'", () => {
    render(
      <AbbreviationCard
        challenge={textChallenge}
        index={2}
        total={3}
        score={scoreAbbreviation}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: "MRCC" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByRole("button", { name: /see results/i })).toBeTruthy();
  });

  test("input is disabled after submit", () => {
    render(
      <AbbreviationCard
        challenge={textChallenge}
        index={0}
        total={3}
        score={scoreAbbreviation}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    const input = screen.getByLabelText(/your answer/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "MRCC" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(input.disabled).toBe(true);
  });
});
