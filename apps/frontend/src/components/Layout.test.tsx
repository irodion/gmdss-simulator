import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vite-plus/test";
import "../i18n/index.ts";

vi.mock("../lib/auth-client.ts", () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    signOut: vi.fn(),
  },
}));

vi.mock("../lib/use-online-status.ts", () => ({
  useOnlineStatus: vi.fn(() => true),
}));

import { authClient } from "../lib/auth-client.ts";
import { Layout } from "./Layout.tsx";

describe("Layout", () => {
  test("renders without sidebar and with no-sidebar class when not logged in", () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any);
    const { container } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    expect(container.querySelector(".nav-sidebar")).toBeNull();
    expect(container.querySelector(".app-shell--no-sidebar")).not.toBeNull();
  });

  test("renders with sidebar and without no-sidebar class when logged in", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "1", name: "Test" } },
      isPending: false,
    } as any);
    const { container } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );
    expect(container.querySelector(".nav-sidebar")).not.toBeNull();
    expect(container.querySelector(".app-shell--no-sidebar")).toBeNull();
  });
});
