import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import "../../i18n/index.ts";

import { ProgressPage } from "./ProgressPage.tsx";

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

import { apiFetch } from "../../lib/api-client.ts";

const mockProgress = {
  modules: {
    "module-1": {
      lessonsCompleted: 4,
      lessonsTotal: 6,
      quizBestScore: 80,
      quizPassed: true,
      status: "in_progress",
    },
    "module-2": {
      lessonsCompleted: 0,
      lessonsTotal: 6,
      quizBestScore: null,
      quizPassed: false,
      status: "locked",
    },
  },
};

beforeEach(() => {
  vi.mocked(apiFetch).mockResolvedValue(mockProgress);
});

describe("ProgressPage", () => {
  test("renders progress after loading", async () => {
    render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("Progress")).toBeDefined();
    });
    expect(screen.getByText("module-1")).toBeDefined();
  });

  test("shows lesson completion counts", async () => {
    const { container } = render(<ProgressPage />);
    await waitFor(() => {
      expect(container.textContent).toContain("4/6 lessons");
    });
  });

  test("shows quiz scores when available", async () => {
    const { container } = render(<ProgressPage />);
    await waitFor(() => {
      expect(container.textContent).toContain("Score: 80%");
    });
  });

  test("shows error and retry button on failure", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error("fail"));
    render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load progress")).toBeDefined();
    });
    expect(screen.getByText("Retry")).toBeDefined();
  });
});
