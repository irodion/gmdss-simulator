import { describe, expect, test } from "vite-plus/test";
import { daysBetween, getLocalDateKey, previousLocalDateKey } from "./date-utils.ts";

function localTimestamp(y: number, m: number, d: number, hh = 0, mm = 0): number {
  return new Date(y, m - 1, d, hh, mm).getTime();
}

describe("getLocalDateKey", () => {
  test("formats as YYYY-MM-DD with zero-padded month and day", () => {
    expect(getLocalDateKey(localTimestamp(2026, 1, 5))).toBe("2026-01-05");
    expect(getLocalDateKey(localTimestamp(2026, 12, 31))).toBe("2026-12-31");
  });

  test("11pm and 1am next morning are two distinct calendar days", () => {
    const lateNight = localTimestamp(2026, 5, 8, 23, 30);
    const nextMorning = localTimestamp(2026, 5, 9, 1, 30);
    expect(getLocalDateKey(lateNight)).toBe("2026-05-08");
    expect(getLocalDateKey(nextMorning)).toBe("2026-05-09");
  });

  test("midnight boundary is handled by the local day", () => {
    expect(getLocalDateKey(localTimestamp(2026, 5, 8, 23, 59))).toBe("2026-05-08");
    expect(getLocalDateKey(localTimestamp(2026, 5, 9, 0, 0))).toBe("2026-05-09");
  });
});

describe("previousLocalDateKey", () => {
  test("steps back one day mid-month", () => {
    expect(previousLocalDateKey("2026-05-09")).toBe("2026-05-08");
  });

  test("rolls month boundary", () => {
    expect(previousLocalDateKey("2026-03-01")).toBe("2026-02-28");
  });

  test("rolls year boundary", () => {
    expect(previousLocalDateKey("2026-01-01")).toBe("2025-12-31");
  });

  test("returns Feb 29 in a leap year", () => {
    expect(previousLocalDateKey("2024-03-01")).toBe("2024-02-29");
  });

  test("returns Feb 28 in a non-leap year", () => {
    expect(previousLocalDateKey("2025-03-01")).toBe("2025-02-28");
  });
});

describe("daysBetween", () => {
  test("same day returns 0", () => {
    expect(daysBetween("2026-05-09", "2026-05-09")).toBe(0);
  });

  test("adjacent days return 1", () => {
    expect(daysBetween("2026-05-08", "2026-05-09")).toBe(1);
  });

  test("a week", () => {
    expect(daysBetween("2026-05-01", "2026-05-08")).toBe(7);
  });

  test("crosses month boundaries", () => {
    expect(daysBetween("2026-02-26", "2026-03-02")).toBe(4);
  });

  test("crosses year boundaries", () => {
    expect(daysBetween("2025-12-30", "2026-01-02")).toBe(3);
  });

  test("leap-day distance", () => {
    expect(daysBetween("2024-02-28", "2024-03-01")).toBe(2);
  });
});

describe("malformed date key handling", () => {
  test("previousLocalDateKey throws on garbage input", () => {
    expect(() => previousLocalDateKey("not-a-date")).toThrow(/invalid date key/i);
    expect(() => previousLocalDateKey("")).toThrow(/invalid date key/i);
    expect(() => previousLocalDateKey("2026-13-01")).toThrow(/invalid date key/i);
    expect(() => previousLocalDateKey("2026-02-30")).toThrow(/invalid date key/i);
    expect(() => previousLocalDateKey("2026-1-1")).toThrow(/invalid date key/i);
  });

  test("daysBetween throws on garbage input on either side", () => {
    expect(() => daysBetween("invalid", "2026-05-09")).toThrow(/invalid date key/i);
    expect(() => daysBetween("2026-05-09", "garbage")).toThrow(/invalid date key/i);
  });
});
