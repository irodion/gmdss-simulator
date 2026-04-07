import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import "../../i18n/index.ts";

import { DashboardPage } from "./DashboardPage.tsx";

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

const mockModules = [
  {
    id: "module-1",
    title: "VHF Radio Fundamentals",
    description: "Learn VHF basics",
    orderIndex: 1,
    locked: false,
  },
  {
    id: "module-2",
    title: "MMSI and DSC",
    description: "Decode MMSIs",
    orderIndex: 2,
    locked: true,
  },
];

const mockProgress = {
  modules: {
    "module-1": {
      lessonsCompleted: 3,
      lessonsTotal: 6,
      quizBestScore: null,
      quizPassed: false,
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
    if (path.includes("/modules")) return Promise.resolve(mockModules);
    if (path.includes("/progress")) return Promise.resolve(mockProgress);
    return Promise.reject(new Error("unexpected"));
  });
});

describe("DashboardPage", () => {
  test("renders dashboard with modules after loading", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getAllByText("VHF Radio Fundamentals").length).toBeGreaterThan(0);
    });
  });

  test("shows continue learning card for in-progress module", async () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(container.textContent).toContain("Continue learning");
    });
  });

  test("shows reference tools section", async () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(container.textContent).toContain("Reference Tools");
    });
    const toolLinks = container.querySelectorAll('a[href^="/tools/"]');
    expect(toolLinks.length).toBe(4);
  });

  test("shows progress bars", async () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(container.querySelectorAll(".progress-bar").length).toBeGreaterThan(0);
    });
  });
});
