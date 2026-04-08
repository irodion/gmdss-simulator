import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import { RadioButton } from "./RadioButton.tsx";

describe("RadioButton", () => {
  test("renders with label", () => {
    render(<RadioButton label="16 / 9" onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: "16 / 9" })).not.toBeNull();
  });

  test("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<RadioButton label="DUAL" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "DUAL" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
