import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import "../../../i18n/index.ts";
import type { Turn, ScoreBreakdown } from "@gmdss-simulator/utils";
import { TranscriptView } from "./TranscriptView.tsx";

const MOCK_TURNS: Turn[] = [
  {
    index: 0,
    speaker: "student",
    text: "RADIO CHECK",
    timestamp: 1000,
    channel: 16,
    durationMs: 3000,
  },
  {
    index: 1,
    speaker: "station",
    text: "LOUD AND CLEAR",
    timestamp: 2000,
    channel: 16,
    durationMs: 0,
  },
];

const MOCK_SCORE: ScoreBreakdown = {
  overall: 75,
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
      matchedItems: [],
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

describe("TranscriptView", () => {
  test("renders student and station bubbles", () => {
    render(<TranscriptView turns={MOCK_TURNS} stationPersona="COAST_STATION" score={null} />);
    expect(screen.getByText("RADIO CHECK")).not.toBeNull();
    expect(screen.getByText("LOUD AND CLEAR")).not.toBeNull();
  });

  test("shows speaker tags", () => {
    render(<TranscriptView turns={MOCK_TURNS} stationPersona="COAST_STATION" score={null} />);
    expect(screen.getByText("YOU")).not.toBeNull();
    expect(screen.getByText("COAST_STATION")).not.toBeNull();
  });

  test("shows score gauge when score provided", () => {
    render(<TranscriptView turns={MOCK_TURNS} stationPersona="COAST_STATION" score={MOCK_SCORE} />);
    expect(screen.getByText("75%")).not.toBeNull();
  });

  test("shows missing field when present in score", () => {
    render(<TranscriptView turns={MOCK_TURNS} stationPersona="COAST_STATION" score={MOCK_SCORE} />);
    expect(screen.getByText("OVER")).not.toBeNull();
  });

  test("renders empty when no turns", () => {
    const { container } = render(
      <TranscriptView turns={[]} stationPersona="COAST_STATION" score={null} />,
    );
    expect(container.querySelectorAll(".sim-bubble").length).toBe(0);
  });
});
