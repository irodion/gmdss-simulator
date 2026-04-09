import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import "../../../i18n/index.ts";

import { TakeawaySectionView } from "./TakeawaySection.tsx";

describe("TakeawaySectionView", () => {
  test("renders header and all bullet points", () => {
    const points = ["Channel 16 is the distress channel", "Always listen before transmitting"];
    render(<TakeawaySectionView points={points} />);
    expect(screen.getByText("Key Takeaways")).toBeDefined();
    expect(screen.getByText("Channel 16 is the distress channel")).toBeDefined();
    expect(screen.getByText("Always listen before transmitting")).toBeDefined();
  });

  test("renders nothing for empty points array", () => {
    const { container } = render(<TakeawaySectionView points={[]} />);
    expect(container.innerHTML).toBe("");
  });

  test("renders correct number of list items", () => {
    const points = ["Point one", "Point two", "Point three"];
    render(<TakeawaySectionView points={points} />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
  });
});
