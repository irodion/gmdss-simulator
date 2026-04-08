import { renderHook, act } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import type { ScenarioDefinition } from "@gmdss-simulator/utils";
import { useSession } from "./use-session.ts";

const MOCK_SCENARIO: ScenarioDefinition = {
  id: "1.1",
  tier: 1,
  category: "routine",
  title: "Radio Check",
  description: "Test",
  stationPersona: "COAST_STATION",
  vessel: { name: "BLUE DUCK" },
  requiredChannel: 16,
  task: "Radio check",
  scriptedResponses: [],
  rubricId: "v1/routine",
};

describe("useSession", () => {
  test("returns initial session state", () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.state.phase).toBe("loading");
    expect(result.current.state.scenario).toBeNull();
  });

  test("loads scenario and transitions to briefing", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.dispatch({ type: "LOAD_SCENARIO", scenario: MOCK_SCENARIO });
    });
    expect(result.current.state.phase).toBe("briefing");
    expect(result.current.state.scenario).toBe(MOCK_SCENARIO);
  });

  test("starts scenario", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.dispatch({ type: "LOAD_SCENARIO", scenario: MOCK_SCENARIO });
    });
    act(() => {
      result.current.dispatch({ type: "START_SCENARIO" });
    });
    expect(result.current.state.phase).toBe("active");
  });

  test("resets to initial state", () => {
    const { result } = renderHook(() => useSession());
    act(() => {
      result.current.dispatch({ type: "LOAD_SCENARIO", scenario: MOCK_SCENARIO });
    });
    act(() => {
      result.current.dispatch({ type: "RESET" });
    });
    expect(result.current.state.phase).toBe("loading");
    expect(result.current.state.scenario).toBeNull();
  });
});
