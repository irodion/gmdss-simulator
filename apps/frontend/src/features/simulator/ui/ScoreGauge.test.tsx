import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import { ScoreGauge } from "./ScoreGauge.tsx";

describe("ScoreGauge", () => {
  test("displays score percentage", () => {
    render(<ScoreGauge value={82} />);
    expect(screen.getByText("82%")).not.toBeNull();
  });

  test("displays 0%", () => {
    render(<ScoreGauge value={0} />);
    expect(screen.getByText("0%")).not.toBeNull();
  });

  test("displays 100%", () => {
    render(<ScoreGauge value={100} />);
    expect(screen.getByText("100%")).not.toBeNull();
  });
});
