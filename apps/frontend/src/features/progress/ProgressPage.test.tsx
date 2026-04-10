import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

vi.mock("../../lib/auth-client.ts", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: { name: "Test User", email: "test@example.com" },
      },
      isPending: false,
    }),
    signOut: vi.fn(),
  },
}));

import { apiFetch } from "../../lib/api-client.ts";

const mockModules = [
  {
    id: "module-1",
    title: "VHF Fundamentals",
    description: "Learn VHF basics",
    orderIndex: 0,
    locked: false,
  },
  {
    id: "module-2",
    title: "MMSI and DSC",
    description: "Digital selective calling",
    orderIndex: 1,
    locked: false,
  },
];

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
  vi.mocked(apiFetch).mockImplementation((path: string) => {
    if (path === "/api/content/modules") return Promise.resolve(mockModules);
    if (path === "/api/progress") return Promise.resolve(mockProgress);
    return Promise.resolve({ success: true });
  });
});

describe("ProgressPage", () => {
  test("renders user name and email", async () => {
    render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeDefined();
    });
    expect(screen.getByText("test@example.com")).toBeDefined();
  });

  test("renders overall progress percentage", async () => {
    // 4 of 12 total lessons = 33%
    render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("33%")).toBeDefined();
    });
  });

  test("shows module titles", async () => {
    render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("VHF Fundamentals")).toBeDefined();
    });
    expect(screen.getByText("MMSI and DSC")).toBeDefined();
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
      expect(container.textContent).toContain("Best: 80%");
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

  test("clear progress button shows confirmation", async () => {
    render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("Clear progress")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Clear progress"));
    expect(screen.getByText("Clear everything")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  test("cancel hides confirmation", async () => {
    render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("Clear progress")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Clear progress"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("Clear progress")).toBeDefined();
  });

  test("confirming clear calls DELETE endpoint", async () => {
    render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("Clear progress")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Clear progress"));
    fireEvent.click(screen.getByText("Clear everything"));
    await waitFor(() => {
      expect(vi.mocked(apiFetch)).toHaveBeenCalledWith("/api/progress", { method: "DELETE" });
    });
  });

  test("shows error when clear progress fails", async () => {
    render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("Clear progress")).toBeDefined();
    });

    vi.mocked(apiFetch).mockImplementation((path: string, opts?: RequestInit) => {
      if (opts?.method === "DELETE") return Promise.reject(new Error("fail"));
      if (path === "/api/content/modules") return Promise.resolve(mockModules);
      return Promise.resolve(mockProgress);
    });

    fireEvent.click(screen.getByText("Clear progress"));
    fireEvent.click(screen.getByText("Clear everything"));
    await waitFor(() => {
      expect(screen.getByText("Failed to clear progress")).toBeDefined();
    });
    // Progress data should still be visible (error is inline, not page-replacing)
    expect(screen.getByText("VHF Fundamentals")).toBeDefined();
  });

  test("renders completed module with badge", async () => {
    const completedProgress = {
      modules: {
        "module-1": {
          lessonsCompleted: 6,
          lessonsTotal: 6,
          quizBestScore: 90,
          quizPassed: true,
          status: "completed",
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

    vi.mocked(apiFetch).mockImplementation((path: string) => {
      if (path === "/api/content/modules") return Promise.resolve(mockModules);
      if (path === "/api/progress") return Promise.resolve(completedProgress);
      return Promise.resolve({ success: true });
    });

    const { container } = render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("VHF Fundamentals")).toBeDefined();
    });
    expect(container.querySelector(".me-mod--completed")).not.toBeNull();
    expect(container.querySelector(".me-mod__badge")).not.toBeNull();
  });

  test("shows 0% when no lessons exist", async () => {
    const emptyProgress = { modules: {} };
    vi.mocked(apiFetch).mockImplementation((path: string) => {
      if (path === "/api/content/modules") return Promise.resolve([]);
      if (path === "/api/progress") return Promise.resolve(emptyProgress);
      return Promise.resolve({ success: true });
    });

    render(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByText("0%")).toBeDefined();
    });
  });
});
