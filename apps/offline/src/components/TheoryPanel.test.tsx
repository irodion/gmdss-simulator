import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { readDailyProgress } from "../drills/daily-progress.ts";
import { getLocalDateKey } from "../lib/date-utils.ts";
import { TheoryPanel } from "./TheoryPanel.tsx";

beforeEach(() => {
  window.localStorage.clear();
});

/** Answer every question (first choice) and advance to the summary. */
function playSession(count: number) {
  for (let i = 1; i <= count; i++) {
    expect(screen.getByText(`Question ${i} of ${count}`)).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]!);
    fireEvent.click(screen.getByRole("button", { name: i === count ? /see results/i : /next/i }));
  }
}

describe("TheoryPanel", () => {
  test("renders the session config — count buttons, no adaptive toggle, no cheatsheet", () => {
    const { container } = render(<TheoryPanel />);
    expect(screen.getByRole("button", { name: "5" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^begin/i })).toBeTruthy();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(container.querySelector("details.cheatsheet")).toBeNull();
  });

  test("starting a session shows the first question", () => {
    render(<TheoryPanel />);
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));
    expect(screen.getByText(/Question 1 of 5/i)).toBeTruthy();
  });

  test("completing a session records free-practice items and shows the summary", () => {
    const onSessionRecorded = vi.fn();
    render(<TheoryPanel onSessionRecorded={onSessionRecorded} />);
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));
    playSession(5);

    expect(screen.getByText(/theory review/i)).toBeTruthy();
    expect(onSessionRecorded).toHaveBeenCalledTimes(1);

    const today = readDailyProgress().byDate[getLocalDateKey(Date.now())];
    expect(today?.freeItems).toBe(5);
    expect(today?.adaptiveItems).toBe(0);
  });

  test("the summary's restart button returns to the config screen", () => {
    render(<TheoryPanel />);
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));
    playSession(5);
    fireEvent.click(screen.getByRole("button", { name: /begin a new watch/i }));
    expect(screen.getByRole("button", { name: "5" })).toBeTruthy();
  });

  test("a longer session length can be selected and played through", () => {
    render(<TheoryPanel />);
    fireEvent.click(screen.getByRole("button", { name: "10" }));
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));
    playSession(10);
    expect(screen.getByText(/theory review/i)).toBeTruthy();
    expect(readDailyProgress().byDate[getLocalDateKey(Date.now())]?.freeItems).toBe(10);
  });
});
