import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import { recordAbbreviationAttempt } from "../drills/abbreviation-stats.ts";
import { AbbreviationStats } from "./AbbreviationStats.tsx";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("AbbreviationStats", () => {
  test("renders empty state when no attempts have been recorded", () => {
    render(<AbbreviationStats refreshToken={0} />);
    expect(screen.getByText(/no attempts yet/i)).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  test("renders a row per abbreviation with attempts and pct", () => {
    recordAbbreviationAttempt({
      abbr: "MRCC",
      direction: "abbr-to-expansion",
      correct: true,
      ts: 100,
    });
    recordAbbreviationAttempt({
      abbr: "MRCC",
      direction: "expansion-to-abbr",
      correct: false,
      ts: 200,
    });
    recordAbbreviationAttempt({
      abbr: "EPIRB",
      direction: "abbr-to-expansion",
      correct: true,
      ts: 300,
    });

    render(<AbbreviationStats refreshToken={1} />);

    expect(screen.getByText("MRCC")).toBeTruthy();
    expect(screen.getByText("EPIRB")).toBeTruthy();
    // Cells exist for the percentages.
    expect(screen.getByText("50%")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();
  });

  test("sorts rows weakest first (lowest pctCorrect)", () => {
    recordAbbreviationAttempt({
      abbr: "STRONG",
      direction: "abbr-to-expansion",
      correct: true,
      ts: 1,
    });
    recordAbbreviationAttempt({
      abbr: "WEAK",
      direction: "abbr-to-expansion",
      correct: false,
      ts: 2,
    });

    render(<AbbreviationStats refreshToken={1} />);
    const cells = screen
      .getAllByRole("cell")
      .filter((c) => /^(STRONG|WEAK)$/.test(c.textContent ?? ""));
    expect(cells[0]!.textContent).toBe("WEAK");
    expect(cells[1]!.textContent).toBe("STRONG");
  });

  test("Reset stats button clears storage and reverts to empty state", () => {
    recordAbbreviationAttempt({
      abbr: "MRCC",
      direction: "abbr-to-expansion",
      correct: true,
      ts: 1,
    });

    render(<AbbreviationStats refreshToken={1} />);
    expect(screen.getByText("MRCC")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /reset stats/i }));
    expect(screen.queryByText("MRCC")).toBeNull();
    expect(screen.getByText(/no attempts yet/i)).toBeTruthy();
  });

  test("ties on pctCorrect break by attempts desc", () => {
    // Both 100% correct, but A has more attempts than B → A first.
    for (let i = 0; i < 3; i++) {
      recordAbbreviationAttempt({
        abbr: "AAA",
        direction: "abbr-to-expansion",
        correct: true,
        ts: i,
      });
    }
    recordAbbreviationAttempt({
      abbr: "BBB",
      direction: "abbr-to-expansion",
      correct: true,
      ts: 99,
    });

    render(<AbbreviationStats refreshToken={1} />);
    const cells = screen
      .getAllByRole("cell")
      .filter((c) => /^(AAA|BBB)$/.test(c.textContent ?? ""));
    expect(cells[0]!.textContent).toBe("AAA");
    expect(cells[1]!.textContent).toBe("BBB");
  });
});
