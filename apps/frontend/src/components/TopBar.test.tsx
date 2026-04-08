import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import "../i18n/index.ts";

vi.mock("../lib/use-online-status.ts", () => ({
  useOnlineStatus: vi.fn(() => true),
}));

import { useOnlineStatus } from "../lib/use-online-status.ts";
import { TopBar } from "./TopBar.tsx";

describe("TopBar", () => {
  test("renders app name", () => {
    render(<TopBar />);
    expect(screen.getByText("GMDSS Simulator")).not.toBeNull();
  });

  test("shows Online status when online", () => {
    vi.mocked(useOnlineStatus).mockReturnValue(true);
    render(<TopBar />);
    expect(screen.getByText("Online")).not.toBeNull();
  });

  test("shows Offline status when offline", () => {
    vi.mocked(useOnlineStatus).mockReturnValue(false);
    render(<TopBar />);
    expect(screen.getByText("Offline")).not.toBeNull();
  });
});
