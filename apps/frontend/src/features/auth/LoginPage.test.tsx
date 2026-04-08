import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import "../../i18n/index.ts";

import { LoginPage } from "./LoginPage.tsx";

const mockSignIn = vi.fn();
const mockNavigate = vi.fn();

const mockUseSession = vi.fn(() => ({ data: null, isPending: false }));

vi.mock("../../lib/auth-client.ts", () => ({
  authClient: {
    signIn: { email: (...args: unknown[]) => mockSignIn(...args) },
    useSession: () => mockUseSession(),
  },
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSignIn.mockResolvedValue({ error: null });
  mockUseSession.mockReturnValue({ data: null, isPending: false });
});

describe("LoginPage", () => {
  test("renders login form with email and password", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
  });

  test("renders sign in button and register link", () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(container.textContent).toContain("Sign in");
    expect(container.textContent).toContain("Create account");
  });

  test("navigates on successful login", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pass1234" } });

    const form = screen.getByLabelText("Email").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: "a@b.com", password: "pass1234" });
      expect(mockNavigate).toHaveBeenCalledWith("/learn");
    });
  });

  test("shows error on failed login", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Bad credentials" } });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });

    const form = screen.getByLabelText("Email").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Bad credentials")).toBeDefined();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows fallback error when no message", async () => {
    mockSignIn.mockResolvedValue({ error: {} });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "x" } });

    const form = screen.getByLabelText("Email").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
  });

  test("renders nothing when session is pending", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: true });
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(container.innerHTML).toBe("");
  });

  test("redirects to dashboard when already authenticated", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1" } } as any, isPending: false });
    const { container } = render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(container.querySelector("form")).toBeNull();
  });
});
