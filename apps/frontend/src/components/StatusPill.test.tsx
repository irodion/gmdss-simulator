import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import { StatusPill } from "./StatusPill.tsx";

describe("StatusPill", () => {
  test("renders label text", () => {
    render(<StatusPill label="Online" />);
    expect(screen.getByText("Online")).not.toBeNull();
  });

  test("shows online dot when online is true", () => {
    const { container } = render(<StatusPill label="Online" online={true} />);
    expect(container.querySelector(".status-pill__dot--online")).not.toBeNull();
  });

  test("shows offline dot when online is false", () => {
    const { container } = render(<StatusPill label="Offline" online={false} />);
    expect(container.querySelector(".status-pill__dot--offline")).not.toBeNull();
  });

  test("hides dot when online is undefined", () => {
    const { container } = render(<StatusPill label="Ch 16" />);
    expect(container.querySelector(".status-pill__dot")).toBeNull();
  });

  test("has status role and polite aria-live", () => {
    render(<StatusPill label="Online" online={true} />);
    const pill = screen.getByRole("status");
    expect(pill.getAttribute("aria-live")).toBe("polite");
  });
});
