import { renderHook, act } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import { useRadio } from "./use-radio.ts";

describe("useRadio", () => {
  test("returns initial radio state", () => {
    const { result } = renderHook(() => useRadio());
    expect(result.current.state.channel).toBe(16);
    expect(result.current.state.power).toBe("high");
    expect(result.current.state.txRx).toBe("idle");
  });

  test("send updates state", () => {
    const { result } = renderHook(() => useRadio());
    act(() => {
      result.current.send({ type: "CHANNEL_UP" });
    });
    expect(result.current.state.channel).toBe(17);
  });

  test("logs events", () => {
    const { result } = renderHook(() => useRadio());
    act(() => {
      result.current.send({ type: "TOGGLE_POWER" });
    });
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]!.command.type).toBe("TOGGLE_POWER");
    expect(result.current.events[0]!.prevState.power).toBe("high");
    expect(result.current.events[0]!.nextState.power).toBe("low");
  });

  test("multiple sends accumulate events", () => {
    const { result } = renderHook(() => useRadio());
    act(() => {
      result.current.send({ type: "CHANNEL_UP" });
    });
    act(() => {
      result.current.send({ type: "CHANNEL_UP" });
    });
    expect(result.current.events).toHaveLength(2);
    expect(result.current.state.channel).toBe(18);
  });

  test("reset restores initial state and clears events", () => {
    const { result } = renderHook(() => useRadio());
    act(() => {
      result.current.send({ type: "CHANNEL_UP" });
      result.current.send({ type: "TOGGLE_POWER" });
    });
    expect(result.current.state.channel).toBe(17);
    expect(result.current.state.power).toBe("low");
    act(() => {
      result.current.reset();
    });
    expect(result.current.state.channel).toBe(16);
    expect(result.current.state.power).toBe("high");
    expect(result.current.events).toHaveLength(0);
  });
});
