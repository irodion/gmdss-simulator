import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import "../../i18n/index.ts";

import { LessonListPage } from "./LessonListPage.tsx";

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

const mockLessons = [
  { id: "lesson-1-1", title: "What is VHF?", orderIndex: 1, completed: true },
  { id: "lesson-1-2", title: "Radio Panel", orderIndex: 2, completed: false },
];

beforeEach(() => {
  vi.mocked(apiFetch).mockResolvedValue(mockLessons);
});

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={["/learn/module-1"]}>
      <Routes>
        <Route path="/learn/:moduleId" element={<LessonListPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LessonListPage", () => {
  test("renders lessons after loading", async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("What is VHF?")).toBeDefined();
    });
    expect(screen.getByText("Radio Panel")).toBeDefined();
  });

  test("shows completion indicator for completed lessons", async () => {
    const { container } = renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("What is VHF?")).toBeDefined();
    });
    expect(container.querySelector(".lesson-list__item--completed")).not.toBeNull();
    expect(screen.getByLabelText("Completed")).toBeDefined();
  });

  test("shows quiz link", async () => {
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("Start quiz")).toBeDefined();
    });
  });

  test("shows error on API failure", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error("Network error"));
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText("Failed to load lessons")).toBeDefined();
    });
  });
});
