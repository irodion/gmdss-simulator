import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import "../../i18n/index.ts";

import { ModuleListPage } from "./ModuleListPage.tsx";

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
    useSession: () => ({ data: { user: { id: "user-1" } } }),
  },
}));

vi.mock("../../lib/offline-db.ts", () => ({
  cacheContent: vi.fn(),
  getCachedContent: vi.fn().mockResolvedValue(null),
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

beforeEach(() => {
  vi.mocked(apiFetch).mockImplementation((url: string) => {
    if (url === "/api/progress") {
      return Promise.resolve({ modules: {} });
    }
    return Promise.resolve(mockModules);
  });
});

describe("ModuleListPage", () => {
  test("shows loading state initially", () => {
    vi.mocked(apiFetch).mockReturnValue(new Promise(() => {}));
    const { container } = render(
      <MemoryRouter>
        <ModuleListPage />
      </MemoryRouter>,
    );
    expect(container.querySelector(".lesson-page__loading-bar")).toBeDefined();
  });

  test("renders modules after loading", async () => {
    render(
      <MemoryRouter>
        <ModuleListPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("VHF Radio Fundamentals")).toBeDefined();
    });
    expect(screen.getByText("MMSI and DSC")).toBeDefined();
  });

  test("shows locked badge for locked modules", async () => {
    const { container } = render(
      <MemoryRouter>
        <ModuleListPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("VHF Radio Fundamentals")).toBeDefined();
    });
    const lockedCards = container.querySelectorAll(".card--locked");
    expect(lockedCards.length).toBe(1);
  });

  test("renders unlocked module as clickable link", async () => {
    render(
      <MemoryRouter>
        <ModuleListPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("VHF Radio Fundamentals")).toBeDefined();
    });
    const link = screen.getByText("VHF Radio Fundamentals").closest("a");
    expect(link?.getAttribute("href")).toBe("/learn/module-1");
  });
});
