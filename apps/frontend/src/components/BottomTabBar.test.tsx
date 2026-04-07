import { render, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vite-plus/test";
import "../i18n/index.ts";

vi.mock("../lib/auth-client.ts", () => ({
  authClient: { signOut: vi.fn() },
}));

import { BottomTabBar } from "./BottomTabBar.tsx";

function renderBar(route = "/") {
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <BottomTabBar />
    </MemoryRouter>,
  );
  const nav = result.container.querySelector("nav")!;
  return { ...result, nav: within(nav) };
}

describe("BottomTabBar", () => {
  test("renders enabled tabs as links including dashboard", () => {
    const { nav } = renderBar();
    const links = nav.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/learn");
    expect(hrefs).toContain("/tools");
    expect(hrefs).toContain("/progress");
  });

  test("renders sign out button", () => {
    const { nav } = renderBar();
    expect(nav.getByLabelText("Sign out")).toBeDefined();
  });

  test("renders disabled tabs with aria-disabled", () => {
    const { container } = renderBar();
    const disabled = container.querySelectorAll("[aria-disabled='true']");
    expect(disabled.length).toBe(2);
  });

  test("highlights active tab", () => {
    const { container } = renderBar("/tools");
    const activeTab = container.querySelector(".bottom-tab--active");
    expect(activeTab?.getAttribute("href")).toBe("/tools");
  });
});
