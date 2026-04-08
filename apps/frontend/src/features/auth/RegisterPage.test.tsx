import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import "../../i18n/index.ts";

import { RegisterPage } from "./RegisterPage.tsx";

const mockSignUp = vi.fn();
const mockNavigate = vi.fn();

const mockUseSession = vi.fn(() => ({ data: null, isPending: false }));

vi.mock("../../lib/auth-client.ts", () => ({
  authClient: {
    signUp: { email: (...args: unknown[]) => mockSignUp(...args) },
    useSession: () => mockUseSession(),
  },
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSignUp.mockResolvedValue({ error: null });
  mockUseSession.mockReturnValue({ data: null, isPending: false });
});

describe("RegisterPage", () => {
  test("renders registration form", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("Display name")).toBeDefined();
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
  });

  test("navigates on successful registration", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pass1234" } });

    const form = screen.getByLabelText("Email").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: "Test",
        email: "a@b.com",
        password: "pass1234",
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith("/learn");
  });

  test("shows error from API response", async () => {
    mockSignUp.mockResolvedValue({ error: { message: "Email taken" } });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pass1234" } });

    const form = screen.getByLabelText("Email").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Email taken")).toBeDefined();
    });
  });

  test("shows generic error on exception", async () => {
    mockSignUp.mockRejectedValue(new Error("Network failure"));

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pass1234" } });

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
        <RegisterPage />
      </MemoryRouter>,
    );
    expect(container.innerHTML).toBe("");
  });

  test("redirects to dashboard when already authenticated", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "1" } } as any, isPending: false });
    const { container } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <RegisterPage />
      </MemoryRouter>,
    );
    expect(container.querySelector("form")).toBeNull();
  });
});
