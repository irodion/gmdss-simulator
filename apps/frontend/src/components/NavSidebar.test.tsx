import { render, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test } from "vite-plus/test";
import "../i18n/index.ts";

import { NavSidebar } from "./NavSidebar.tsx";

function renderSidebar(route = "/") {
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <NavSidebar />
    </MemoryRouter>,
  );
  const nav = result.container.querySelector("nav")!;
  return { ...result, nav: within(nav) };
}

describe("NavSidebar", () => {
  test("renders the logo block linking to dashboard", () => {
    const { nav } = renderSidebar();
    const logo = nav.getByLabelText("Home");
    expect(logo).toBeDefined();
    expect(logo.textContent).toBe("G");
  });

  test("renders enabled Learn and Ref nav links", () => {
    const { nav } = renderSidebar();
    const links = nav.getAllByRole("link");
    const linkTexts = links.map((l) => l.textContent);
    expect(linkTexts.some((t) => t?.includes("Learn"))).toBe(true);
    expect(linkTexts.some((t) => t?.includes("Ref"))).toBe(true);
  });

  test("renders no disabled nav items", () => {
    const { container } = renderSidebar();
    const disabledItems = container.querySelectorAll("[aria-disabled='true']");
    expect(disabledItems.length).toBe(0);
  });

  test("renders profile link and sign out button", () => {
    const { nav } = renderSidebar();
    const links = nav.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/progress")).toBe(true);

    const signout = nav.getByRole("button");
    expect(signout.textContent).toContain("Sign out");
  });

  test("marks active nav item based on current route", () => {
    const { container } = renderSidebar("/learn");
    const activeLinks = container.querySelectorAll(".nav-block--active");
    expect(activeLinks.length).toBeGreaterThan(0);
    expect(activeLinks[0]?.getAttribute("href")).toBe("/learn");
  });

  test("profile link is active on /progress route", () => {
    const { container } = renderSidebar("/progress");
    const activeLinks = container.querySelectorAll(".nav-block--active");
    expect([...activeLinks].some((l) => l.getAttribute("href") === "/progress")).toBe(true);
  });
});
