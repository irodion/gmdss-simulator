import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test } from "vite-plus/test";
import "../../../i18n/index.ts";

import { ToolIndexPage } from "./ToolIndexPage.tsx";

function renderPage() {
  return render(
    <MemoryRouter>
      <ToolIndexPage />
    </MemoryRouter>,
  );
}

describe("ToolIndexPage", () => {
  test("renders page title", () => {
    renderPage();
    expect(screen.getByText("Reference Tools")).toBeDefined();
  });

  test("renders all 4 tool cards with links", () => {
    renderPage();
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(4);
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/tools/channel-explorer");
    expect(hrefs).toContain("/tools/mmsi-decoder");
    expect(hrefs).toContain("/tools/dsc-builder");
    expect(hrefs).toContain("/tools/script-builder");
  });

  test("shows tool descriptions", () => {
    const { container } = renderPage();
    const descriptions = container.querySelectorAll(".card__description");
    expect(descriptions.length).toBe(4);
  });
});
