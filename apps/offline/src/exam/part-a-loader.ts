import { shuffle } from "../drills/drill-types.ts";
import { fetchContentJson } from "../lib/fetch-content.ts";
import type { ExamIndex, ExamItem, ItemBank } from "./part-a-types.ts";

const INDEX_URL = "/content/en/exams/exams-index.json";
const BANK_URL = "/content/en/exams/item-bank.json";

export function loadExamIndex(): Promise<ExamIndex> {
  return fetchContentJson<ExamIndex>(INDEX_URL);
}

export function loadItemBank(): Promise<ItemBank> {
  return fetchContentJson<ItemBank>(BANK_URL);
}

/** Index bank items by id for O(1) lookup when resolving an exam paper. */
export function indexBank(bank: ItemBank): Map<string, ExamItem> {
  const map = new Map<string, ExamItem>();
  for (const item of bank.items) map.set(item.id, item);
  return map;
}

/** Resolve a paper's ordered item ids to bank items, dropping any unknown id. */
export function resolveExamItems(
  itemIds: readonly string[],
  byId: ReadonlyMap<string, ExamItem>,
): ExamItem[] {
  const out: ExamItem[] = [];
  for (const id of itemIds) {
    const item = byId.get(id);
    if (item) out.push(item);
  }
  return out;
}

/** Build a random mock paper by shuffling the whole bank and taking `count` items. */
export function buildRandomMock(items: readonly ExamItem[], count: number): ExamItem[] {
  return shuffle(items).slice(0, Math.min(count, items.length));
}

/** Score selected answers against the correct keys. */
export function scoreExam(
  items: readonly ExamItem[],
  answers: Readonly<Record<string, string>>,
): { correct: number; total: number; pct: number } {
  let correct = 0;
  for (const item of items) {
    if (answers[item.id] === item.answer) correct++;
  }
  const total = items.length;
  return { correct, total, pct: total > 0 ? correct / total : 0 };
}
