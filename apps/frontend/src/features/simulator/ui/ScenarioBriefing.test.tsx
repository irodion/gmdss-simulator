import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import "../../../i18n/index.ts";
import type { ScenarioDefinition } from "@gmdss-simulator/utils";
import { ScenarioBriefing } from "./ScenarioBriefing.tsx";

const MOCK_SCENARIO: ScenarioDefinition = {
  id: "1.1",
  tier: 1,
  category: "routine",
  title: "Radio Check",
  description: "Perform a radio check.",
  stationPersona: "COAST_STATION",
  vessel: { name: "BLUE DUCK", callsign: "5BCD2", mmsi: "211239680" },
  requiredChannel: 16,
  task: "Perform a radio check on Channel 16.",
  scriptReference: "ANYTOWN RADIO, THIS IS BLUE DUCK, RADIO CHECK, OVER",
  scriptedResponses: [],
  rubricId: "v1/routine",
};

describe("ScenarioBriefing", () => {
  test("displays scenario title", () => {
    render(<ScenarioBriefing scenario={MOCK_SCENARIO} />);
    expect(screen.getByText("Radio Check")).not.toBeNull();
  });

  test("displays vessel info", () => {
    render(<ScenarioBriefing scenario={MOCK_SCENARIO} />);
    expect(screen.getByText(/BLUE DUCK.*5BCD2/)).not.toBeNull();
  });

  test("displays task", () => {
    render(<ScenarioBriefing scenario={MOCK_SCENARIO} />);
    expect(screen.getByText("Perform a radio check on Channel 16.")).not.toBeNull();
  });

  test("shows script reference on button click", () => {
    render(<ScenarioBriefing scenario={MOCK_SCENARIO} />);
    const btn = screen.getByText("SCRIPT REFERENCE");
    expect(btn).not.toBeNull();
    fireEvent.click(btn);
    expect(screen.getByText(/ANYTOWN RADIO, THIS IS BLUE DUCK/)).not.toBeNull();
  });

  test("displays category pill", () => {
    render(<ScenarioBriefing scenario={MOCK_SCENARIO} />);
    expect(screen.getByText("ROUTINE")).not.toBeNull();
  });

  test("displays position when provided", () => {
    const scenario: ScenarioDefinition = {
      ...MOCK_SCENARIO,
      vessel: { ...MOCK_SCENARIO.vessel, position: "51°28'N 003°12'W" },
    };
    render(<ScenarioBriefing scenario={scenario} />);
    expect(screen.getByText(/51°28'N 003°12'W/)).not.toBeNull();
  });
});
