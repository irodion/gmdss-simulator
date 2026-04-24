import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import "../../../i18n/index.ts";
import type { Turn, ScoreBreakdown } from "@gmdss-simulator/utils";
import { DebriefPanel } from "./DebriefPanel.tsx";

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

describe("DebriefPanel", () => {
  test("displays overall score", () => {
    render(
      <DebriefPanel
        turns={MOCK_TURNS}
        score={MOCK_SCORE}
        stationPersona="COAST_STATION"
        onRetry={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText("82%")).not.toBeNull();
  });

  test("displays dimension scores", () => {
    render(
      <DebriefPanel
        turns={MOCK_TURNS}
        score={MOCK_SCORE}
        stationPersona="COAST_STATION"
        onRetry={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText("50%")).not.toBeNull();
    expect(screen.getByText("75%")).not.toBeNull();
  });

  test("shows missing items", () => {
    render(
      <DebriefPanel
        turns={MOCK_TURNS}
        score={MOCK_SCORE}
        stationPersona="COAST_STATION"
        onRetry={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText("OVER")).not.toBeNull();
  });

  test("shows transcript turns", () => {
    render(
      <DebriefPanel
        turns={MOCK_TURNS}
        score={MOCK_SCORE}
        stationPersona="COAST_STATION"
        onRetry={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText("RADIO CHECK")).not.toBeNull();
    expect(screen.getByText("LOUD AND CLEAR")).not.toBeNull();
  });

  test("calls onRetry when retry clicked", () => {
    const onRetry = vi.fn();
    render(
      <DebriefPanel
        turns={MOCK_TURNS}
        score={MOCK_SCORE}
        stationPersona="COAST_STATION"
        onRetry={onRetry}
        onBack={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Retry Scenario"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  test("calls onBack when back clicked", () => {
    const onBack = vi.fn();
    render(
      <DebriefPanel
        turns={MOCK_TURNS}
        score={MOCK_SCORE}
        stationPersona="COAST_STATION"
        onRetry={vi.fn()}
        onBack={onBack}
      />,
    );
    fireEvent.click(screen.getByText("Back to Scenarios"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  test("renders both sections when closingScore is provided", () => {
    const closingScore: ScoreBreakdown = {
      overall: 90,
      rubricVersion: "1.0.0",
      timestamp: 20000,
      dimensions: [
        {
          id: "required_fields",
          label: "Required Fields",
          weight: 0.5,
          score: 90,
          maxScore: 100,
          matchedItems: ["RECEIVED"],
          missingItems: [],
        },
        {
          id: "prowords",
          label: "Prowords",
          weight: 0.5,
          score: 80,
          maxScore: 100,
          matchedItems: ["OUT"],
          missingItems: [],
        },
      ],
    };

    render(
      <DebriefPanel
        turns={MOCK_TURNS}
        score={MOCK_SCORE}
        closingScore={closingScore}
        stationPersona="COAST_STATION"
        onRetry={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText("Opening — Radio Check Request")).not.toBeNull();
    expect(screen.getByText("Closing — Acknowledgment")).not.toBeNull();
    expect(screen.getByText("82%")).not.toBeNull();
    expect(screen.getAllByText("90%").length).toBeGreaterThanOrEqual(1);
  });

  test("does not render section titles when closingScore is absent", () => {
    render(
      <DebriefPanel
        turns={MOCK_TURNS}
        score={MOCK_SCORE}
        stationPersona="COAST_STATION"
        onRetry={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.queryByText("Opening — Radio Check Request")).toBeNull();
    expect(screen.queryByText("Closing — Acknowledgment")).toBeNull();
    expect(screen.getByText("82%")).not.toBeNull();
  });
});
