import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import { QueuePreview } from "./QueuePreview.tsx";

describe("QueuePreview", () => {
  test("renders the three counts inline", () => {
    render(<QueuePreview weak={6} review={3} fresh={1} />);
    const line = screen.getByText(/today/i);
    expect(line.textContent).toMatch(/6.*weak/);
    expect(line.textContent).toMatch(/3.*review/);
    expect(line.textContent).toMatch(/1.*new/);
  });

  test("uses an aria-live polite region so updates announce", () => {
    render(<QueuePreview weak={0} review={0} fresh={5} />);
    const line = screen.getByText(/today/i);
    expect(line.getAttribute("aria-live")).toBe("polite");
  });

  test("renders zeroes without collapsing", () => {
    render(<QueuePreview weak={0} review={0} fresh={0} />);
    expect(screen.getByText(/today/i).textContent).toMatch(/0.*weak/);
  });
});
