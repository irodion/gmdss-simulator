import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import "../../i18n/index.ts";

import { QuizPage } from "./QuizPage.tsx";

vi.mock("../../lib/api-client.ts", () => ({
  apiFetch: vi.fn(),
  ApiError: class extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("../../lib/offline-db.ts", () => ({
  addPendingAction: vi.fn(),
}));

import { apiFetch } from "../../lib/api-client.ts";

const mockQuiz = {
  id: "module-1-checkpoint",
  title: "Module 1 Checkpoint Quiz",
  passThreshold: 70,
  questions: [
    {
      id: "q1",
      text: "What is the distress channel?",
      options: [
        { key: "a", text: "Channel 9" },
        { key: "b", text: "Channel 16" },
      ],
    },
  ],
};

beforeEach(() => {
  vi.mocked(apiFetch).mockResolvedValue(mockQuiz);
});

function renderQuiz() {
  return render(
    <MemoryRouter initialEntries={["/learn/module-1/quiz"]}>
      <Routes>
        <Route path="/learn/:moduleId/quiz" element={<QuizPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function selectOption(text: string) {
  const label = screen.getByText(text).closest("label")!;
  fireEvent.click(label);
}

describe("QuizPage", () => {
  test("renders quiz after loading", async () => {
    renderQuiz();
    await waitFor(() => {
      expect(screen.getByText("Module 1 Checkpoint Quiz")).toBeDefined();
    });
    expect(screen.getByText(/What is the distress channel/)).toBeDefined();
  });

  test("shows pass threshold", async () => {
    renderQuiz();
    await waitFor(() => {
      expect(screen.getByText("Pass threshold: 70%")).toBeDefined();
    });
  });

  test("shows error state when quiz fails to load", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error("fail"));
    renderQuiz();
    await waitFor(() => {
      expect(screen.getByText("Something went wrong.")).toBeDefined();
    });
  });

  test("shows failed result", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockQuiz).mockResolvedValueOnce({
      score: 40,
      passed: false,
      threshold: 70,
      results: [],
      unlocked: [],
    });

    renderQuiz();
    await waitFor(() => {
      expect(screen.getByText("Module 1 Checkpoint Quiz")).toBeDefined();
    });

    selectOption("Channel 9");
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("40%")).toBeDefined();
      expect(screen.getByText("Not passed. Try again.")).toBeDefined();
    });
  });

  test("shows unlocked modules after passing", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(mockQuiz)
      .mockResolvedValueOnce({
        score: 100,
        passed: true,
        threshold: 70,
        results: [],
        unlocked: ["module-2"],
      });

    renderQuiz();
    await waitFor(() => {
      expect(screen.getByText("Module 1 Checkpoint Quiz")).toBeDefined();
    });

    selectOption("Channel 16");
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText(/module-2/)).toBeDefined();
    });
  });

  test("queues submission when offline", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(mockQuiz)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    renderQuiz();
    await waitFor(() => {
      expect(screen.getByText("Module 1 Checkpoint Quiz")).toBeDefined();
    });

    selectOption("Channel 16");
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeDefined();
    });
  });

  test("allows selecting answers and submitting", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockQuiz).mockResolvedValueOnce({
      score: 100,
      passed: true,
      threshold: 70,
      results: [],
      unlocked: [],
    });

    renderQuiz();
    await waitFor(() => {
      expect(screen.getByText("Module 1 Checkpoint Quiz")).toBeDefined();
    });

    selectOption("Channel 16");
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("100%")).toBeDefined();
      expect(screen.getByText("Passed!")).toBeDefined();
    });
  });
});
