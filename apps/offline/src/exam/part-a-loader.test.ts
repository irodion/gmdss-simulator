import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import {
  loadExamIndex,
  loadItemBank,
  indexBank,
  resolveExamItems,
  buildRandomMock,
  scoreExam,
} from "./part-a-loader.ts";
import type { ExamItem, ItemBank } from "./part-a-types.ts";

function item(id: string, answer = "a"): ExamItem {
  return {
    id,
    topic: "channels",
    sourceExams: [1],
    prompt: `Prompt ${id}`,
    options: [
      { key: "a", text: "A" },
      { key: "b", text: "B" },
    ],
    answer,
    explanation: "because",
    flagged: false,
  };
}

const bank: ItemBank = { version: 1, items: [item("x"), item("y", "b"), item("z")] };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("indexBank / resolveExamItems", () => {
  test("indexes by id and resolves order, dropping unknown ids", () => {
    const byId = indexBank(bank);
    expect(byId.size).toBe(3);
    expect(resolveExamItems(["z", "missing", "x"], byId).map((i) => i.id)).toEqual(["z", "x"]);
  });
});

describe("buildRandomMock", () => {
  test("returns a subset of the requested size", () => {
    const mock = buildRandomMock(bank.items, 2);
    expect(mock).toHaveLength(2);
    for (const m of mock) expect(bank.items).toContain(m);
  });

  test("caps at the bank size when count exceeds it", () => {
    expect(buildRandomMock(bank.items, 99)).toHaveLength(3);
  });
});

describe("scoreExam", () => {
  test("counts correct answers", () => {
    expect(scoreExam(bank.items, { x: "a", y: "a", z: "a" })).toEqual({
      correct: 2,
      total: 3,
      pct: 2 / 3,
    });
  });

  test("empty exam scores zero without dividing by zero", () => {
    expect(scoreExam([], {})).toEqual({ correct: 0, total: 0, pct: 0 });
  });
});

describe("loadExamIndex / loadItemBank", () => {
  test("fetches the exam index from the expected URL and returns parsed JSON", async () => {
    const payload = { version: 1, exams: [] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await loadExamIndex()).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith("/content/en/exams/exams-index.json");
  });

  test("throws on a non-ok response and requests the item-bank URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadItemBank()).rejects.toThrow("Failed to load");
    expect(fetchMock).toHaveBeenCalledWith("/content/en/exams/item-bank.json");
  });
});
