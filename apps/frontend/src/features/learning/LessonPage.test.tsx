import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import "../../i18n/index.ts";

import { LessonPage } from "./LessonPage.tsx";

vi.mock("../../lib/api-client.ts", () => ({
  apiFetch: vi.fn(),
  ApiError: class extends Error {
    status: number;
    constructor(s: number, m: string) {
      super(m);
      this.status = s;
    }
  },
}));

vi.mock("../../lib/offline-db.ts", () => ({
  addPendingAction: vi.fn(),
  cacheContent: vi.fn(),
  getCachedContent: vi.fn().mockResolvedValue(null),
}));

import { apiFetch } from "../../lib/api-client.ts";

const mockLessons = [
  {
    id: "lesson-1-1",
    title: "What is VHF?",
    orderIndex: 1,
    contentPath: "en/modules/1/lesson-1.json",
    completed: false,
  },
  {
    id: "lesson-1-2",
    title: "Radio Panel",
    orderIndex: 2,
    contentPath: "en/modules/1/lesson-2.json",
    completed: false,
  },
];

const mockContent = {
  version: 1,
  title: "What is VHF Maritime Radio?",
  sections: [
    {
      type: "text",
      content: "VHF maritime radio operates on frequencies between 156 and 174 MHz.",
    },
  ],
};

beforeEach(() => {
  vi.mocked(apiFetch).mockResolvedValue(mockLessons);
  // Mock global fetch for static content files
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContent),
    }),
  );
});

function renderLesson() {
  return render(
    <MemoryRouter initialEntries={["/learn/module-1/lesson-1-1"]}>
      <Routes>
        <Route path="/learn/:moduleId/:lessonId" element={<LessonPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LessonPage", () => {
  test("shows loading state initially", () => {
    vi.mocked(apiFetch).mockReturnValue(new Promise(() => {}));
    const { container } = renderLesson();
    expect(container.querySelector(".lesson-page__loading-bar")).not.toBeNull();
  });

  test("renders lesson content after loading", async () => {
    const { container } = renderLesson();
    await waitFor(() => {
      expect(container.textContent).toContain("VHF maritime radio operates");
    });
  });

  test("shows lesson title", async () => {
    renderLesson();
    await waitFor(() => {
      expect(screen.getByText("What is VHF?")).toBeDefined();
    });
  });

  test("shows mark complete button", async () => {
    const { container } = renderLesson();
    await waitFor(() => {
      expect(container.textContent).toContain("Mark as complete");
    });
  });

  test("shows back link to lessons", async () => {
    const { container } = renderLesson();
    await waitFor(() => {
      expect(container.textContent).toContain("Lessons");
    });
  });

  test("shows error when content unavailable and no cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const { container } = renderLesson();
    await waitFor(() => {
      expect(container.textContent).toContain("unavailable");
    });
  });

  test("falls back to cached content when fetch fails", async () => {
    const { getCachedContent } = await import("../../lib/offline-db.ts");
    vi.mocked(getCachedContent).mockResolvedValue(mockContent);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const { container } = renderLesson();
    await waitFor(() => {
      expect(container.textContent).toContain("VHF maritime radio operates");
    });
  });

  test("shows error when lesson not found and no cache", async () => {
    const { getCachedContent } = await import("../../lib/offline-db.ts");
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(apiFetch).mockResolvedValue([]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const { container } = renderLesson();
    await waitFor(() => {
      expect(container.textContent).toContain("Lesson not found");
    });
  });

  test("falls back to cache when API is unavailable", async () => {
    const { getCachedContent } = await import("../../lib/offline-db.ts");
    vi.mocked(getCachedContent).mockResolvedValue(mockContent);
    vi.mocked(apiFetch).mockRejectedValue(new Error("Network error"));

    const { container } = renderLesson();
    await waitFor(() => {
      expect(container.textContent).toContain("VHF maritime radio operates");
    });
  });

  test("shows error when API fails and no cache", async () => {
    const { getCachedContent } = await import("../../lib/offline-db.ts");
    vi.mocked(getCachedContent).mockResolvedValue(null);
    vi.mocked(apiFetch).mockRejectedValue(new Error("Network error"));

    const { container } = renderLesson();
    await waitFor(() => {
      expect(container.textContent).toContain("Lesson not found");
    });
  });
});
