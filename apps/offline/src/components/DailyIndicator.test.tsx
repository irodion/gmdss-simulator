import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import { DailyIndicator } from "./DailyIndicator.tsx";

describe("DailyIndicator", () => {
  test("hides the streak label when streak is 0", () => {
    render(<DailyIndicator streak={0} itemsToday={0} target={30} />);
    expect(screen.queryByText(/day streak/i)).toBeNull();
  });

  test("renders the streak label when current > 0", () => {
    render(<DailyIndicator streak={3} itemsToday={5} target={30} />);
    expect(screen.getByText(/3 day streak/i)).toBeTruthy();
  });

  test("renders progress text when target not met", () => {
    render(<DailyIndicator streak={2} itemsToday={12} target={30} />);
    const node = document.querySelector(".daily-indicator");
    expect(node?.textContent).toMatch(/12.*\/.*30/);
  });

  test("shows 'Today met' with a check when itemsToday >= target", () => {
    render(<DailyIndicator streak={5} itemsToday={30} target={30} />);
    expect(screen.getByText(/today met/i)).toBeTruthy();
    expect(document.querySelector(".daily-indicator-check")).not.toBeNull();
  });

  test("progress-bar width reflects today's percentage", () => {
    render(<DailyIndicator streak={0} itemsToday={15} target={30} />);
    const fill = document.querySelector(".progress-bar-fill") as HTMLElement | null;
    expect(fill?.style.width).toBe("50%");
  });

  test("progress-bar is clamped at 100% even when over target", () => {
    render(<DailyIndicator streak={0} itemsToday={45} target={30} />);
    const fill = document.querySelector(".progress-bar-fill") as HTMLElement | null;
    expect(fill?.style.width).toBe("100%");
  });

  test("does not crash when target is 0 (defensive)", () => {
    render(<DailyIndicator streak={0} itemsToday={5} target={0} />);
    expect(document.querySelector(".daily-indicator")).not.toBeNull();
  });
});
