import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

vi.mock("../exam/part-a-loader.ts", async (importActual) => {
  const actual = await importActual<typeof import("../exam/part-a-loader.ts")>();
  return { ...actual, loadExamIndex: vi.fn(), loadItemBank: vi.fn() };
});

import { loadExamIndex, loadItemBank } from "../exam/part-a-loader.ts";
import { PartAExamPanel } from "./PartAExamPanel.tsx";
import type { ExamItem } from "../exam/part-a-types.ts";

function item(id: string, answer: string): ExamItem {
  return {
    id,
    topic: "channels",
    sourceExams: [1],
    prompt: `Question ${id}?`,
    options: [
      { key: "a", text: `${id}-A` },
      { key: "b", text: `${id}-B` },
    ],
    answer,
    explanation: `Why ${id}`,
    flagged: false,
  };
}

const bank = { version: 1, items: [item("q1", "a"), item("q2", "a")] };

function makeIndex(timeLimitMinutes = 30) {
  return {
    version: 1,
    exams: [
      {
        id: "sample-exam-1",
        title: "Sample Exam 1",
        source: "src",
        passThreshold: 0.8,
        timeLimitMinutes,
        itemIds: ["q1", "q2"],
      },
    ],
  };
}

beforeEach(() => {
  vi.mocked(loadExamIndex).mockResolvedValue(makeIndex());
  vi.mocked(loadItemBank).mockResolvedValue(bank);
});

async function openList() {
  render(<PartAExamPanel />);
  await waitFor(() => expect(screen.getByText("Sample Exam 1")).toBeTruthy());
}

describe("PartAExamPanel", () => {
  test("lists the papers and a random-mock card", async () => {
    await openList();
    expect(screen.getByText(/Random mock exam/)).toBeTruthy();
    expect(screen.getByText(/2 questions/)).toBeTruthy();
  });

  test("takes a paper and scores a perfect result as PASS", async () => {
    await openList();
    fireEvent.click(screen.getByText("Sample Exam 1"));
    await waitFor(() => expect(screen.getByText("Question q1?")).toBeTruthy());
    fireEvent.click(screen.getByText("q1-A"));
    fireEvent.click(screen.getByText("q2-A"));
    fireEvent.click(screen.getByText(/Submit & score/));
    await waitFor(() => expect(screen.getByText(/PASS — 2\/2 \(100%\)/)).toBeTruthy());
    expect(screen.getByText(/Why q1/)).toBeTruthy();
  });

  test("scores wrong answers as FAIL", async () => {
    await openList();
    fireEvent.click(screen.getByText("Sample Exam 1"));
    await waitFor(() => expect(screen.getByText("Question q1?")).toBeTruthy());
    fireEvent.click(screen.getByText("q1-B"));
    fireEvent.click(screen.getByText(/Submit & score/));
    await waitFor(() => expect(screen.getByText(/FAIL — 0\/2 \(0%\)/)).toBeTruthy());
  });

  test("auto-submits when the time limit is zero", async () => {
    vi.mocked(loadExamIndex).mockResolvedValue(makeIndex(0));
    await openList();
    fireEvent.click(screen.getByText("Sample Exam 1"));
    await waitFor(() => expect(screen.getByText(/Time is up/)).toBeTruthy());
  });

  test("starts a random mock paper", async () => {
    await openList();
    fireEvent.click(screen.getByText(/Random mock exam/));
    await waitFor(() => expect(screen.getByText("Question q1?")).toBeTruthy());
  });

  test("returns to the list with the back button", async () => {
    await openList();
    fireEvent.click(screen.getByText("Sample Exam 1"));
    await waitFor(() => expect(screen.getByText("Question q1?")).toBeTruthy());
    fireEvent.click(screen.getByText(/‹ Exams/));
    await waitFor(() => expect(screen.getByText(/Random mock exam/)).toBeTruthy());
  });

  test("shows the (*) flag and note for flagged items after submitting", async () => {
    const flagged: ExamItem = { ...item("q1", "a"), flagged: true, note: "(*) kept per policy" };
    vi.mocked(loadItemBank).mockResolvedValue({ version: 1, items: [flagged, item("q2", "a")] });
    await openList();
    fireEvent.click(screen.getByText("Sample Exam 1"));
    await waitFor(() => expect(screen.getByText("Question q1?")).toBeTruthy());
    fireEvent.click(screen.getByText("q1-A"));
    fireEvent.click(screen.getByText(/Submit & score/));
    await waitFor(() => expect(screen.getByText(/kept per policy/)).toBeTruthy());
  });

  test("renders the low-time timer near the deadline", async () => {
    vi.mocked(loadExamIndex).mockResolvedValue(makeIndex(1));
    await openList();
    fireEvent.click(screen.getByText("Sample Exam 1"));
    await waitFor(() => expect(screen.getByText("1:00")).toBeTruthy());
  });

  test("shows an error when content cannot load", async () => {
    vi.mocked(loadExamIndex).mockRejectedValue(new Error("offline"));
    render(<PartAExamPanel />);
    await waitFor(() => expect(screen.getByText(/Could not load the exam content/)).toBeTruthy());
  });
});
