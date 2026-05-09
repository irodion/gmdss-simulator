import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import { AdaptiveModeToggle } from "./AdaptiveModeToggle.tsx";

describe("AdaptiveModeToggle", () => {
  test("renders as a switch with the current label", () => {
    render(<AdaptiveModeToggle enabled={true} onChange={() => {}} />);
    const sw = screen.getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(sw.textContent).toMatch(/adaptive/i);
  });

  test("shows Free Practice label when disabled", () => {
    render(<AdaptiveModeToggle enabled={false} onChange={() => {}} />);
    const sw = screen.getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("false");
    expect(sw.textContent).toMatch(/free practice/i);
  });

  test("clicking flips the state via the callback", () => {
    const onChange = vi.fn();
    render(<AdaptiveModeToggle enabled={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
