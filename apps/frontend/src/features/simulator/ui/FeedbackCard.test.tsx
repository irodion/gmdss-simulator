import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import "../../../i18n/index.ts";
import type { ScoreBreakdown } from "@gmdss-simulator/utils";
import { FeedbackCard } from "./FeedbackCard.tsx";

const MOCK_SCORE: ScoreBreakdown = {
  overall: 82,
  rubricVersion: "1.0.0",
  timestamp: 10000,
  dimensions: [
    {
      id: "required_fields",
      label: "Required Fields",
      weight: 0.35,
      score: 100,
      maxScore: 100,
      matchedItems: [],
      missingItems: [],
    },
    {
      id: "prowords",
      label: "Prowords",
      weight: 0.25,
      score: 50,
      maxScore: 100,
      matchedItems: ["THIS IS"],
      missingItems: ["OVER"],
    },
    {
      id: "sequence",
      label: "Sequence",
      weight: 0.25,
      score: 75,
      maxScore: 100,
      matchedItems: [],
      missingItems: [],
    },
    {
      id: "channel",
      label: "Channel",
      weight: 0.15,
      score: 100,
      maxScore: 100,
      matchedItems: [],
      missingItems: [],
    },
  ],
};

describe("FeedbackCard", () => {
  test("renders dimension chips", () => {
    render(<FeedbackCard score={MOCK_SCORE} />);
    expect(screen.getByText(/Required fields/)).not.toBeNull();
    expect(screen.getByText(/Prowords/)).not.toBeNull();
    expect(screen.getByText(/Sequence/)).not.toBeNull();
    expect(screen.getByText(/Channel/)).not.toBeNull();
  });

  test("shows score percentages in chips", () => {
    render(<FeedbackCard score={MOCK_SCORE} />);
    expect(screen.getAllByText(/100%/).length).toBeGreaterThan(0);
    expect(screen.getByText(/50%/)).not.toBeNull();
  });

  test("renders feedback text", () => {
    render(<FeedbackCard score={null} feedbackText="Good attempt!" />);
    expect(screen.getByText("Good attempt!")).not.toBeNull();
  });

  test("renders without score", () => {
    render(<FeedbackCard score={null} />);
    expect(screen.getByText("Live Feedback")).not.toBeNull();
  });
});
