import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vite-plus/test";

import { ProtectedRoute } from "./ProtectedRoute.tsx";

vi.mock("../lib/auth-client.ts", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

import { authClient } from "../lib/auth-client.ts";

describe("ProtectedRoute", () => {
  test("shows loading when session is pending", () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: true } as any);
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  test("redirects to login when no session", () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any);
    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(container.textContent).not.toContain("Protected content");
  });

  test("renders children when session exists", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: "1" } },
      isPending: false,
    } as any);
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );
    expect(screen.getByText("Protected content")).toBeDefined();
  });
});
