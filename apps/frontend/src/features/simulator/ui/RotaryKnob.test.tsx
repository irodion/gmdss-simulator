import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import { RotaryKnob } from "./RotaryKnob.tsx";

describe("RotaryKnob", () => {
  test("renders with label and slider role", () => {
    render(<RotaryKnob value={50} label="VOL" onChange={vi.fn()} />);
    const slider = screen.getByRole("slider", { name: "VOL" });
    expect(slider).not.toBeNull();
    expect(slider.getAttribute("aria-valuenow")).toBe("50");
    expect(slider.getAttribute("aria-valuemin")).toBe("0");
    expect(slider.getAttribute("aria-valuemax")).toBe("100");
  });

  test("displays label text", () => {
    render(<RotaryKnob value={75} label="SQL" onChange={vi.fn()} />);
    expect(screen.getByText("SQL")).not.toBeNull();
  });

  test("displays min and max marks", () => {
    render(<RotaryKnob value={50} label="VOL" onChange={vi.fn()} />);
    expect(screen.getByText("0")).not.toBeNull();
    expect(screen.getByText("100")).not.toBeNull();
  });

  test("increments on ArrowUp", () => {
    const onChange = vi.fn();
    render(<RotaryKnob value={50} label="VOL" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith(55);
  });

  test("decrements on ArrowDown", () => {
    const onChange = vi.fn();
    render(<RotaryKnob value={50} label="VOL" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith(45);
  });

  test("increments on ArrowRight", () => {
    const onChange = vi.fn();
    render(<RotaryKnob value={50} label="VOL" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(55);
  });

  test("decrements on ArrowLeft", () => {
    const onChange = vi.fn();
    render(<RotaryKnob value={50} label="VOL" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith(45);
  });

  test("clamps at max", () => {
    const onChange = vi.fn();
    render(<RotaryKnob value={98} label="VOL" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith(100);
  });

  test("clamps at min", () => {
    const onChange = vi.fn();
    render(<RotaryKnob value={2} label="VOL" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  test("ignores non-arrow keys", () => {
    const onChange = vi.fn();
    render(<RotaryKnob value={50} label="VOL" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  test("handles pointer interaction", () => {
    const onChange = vi.fn();
    render(<RotaryKnob value={50} label="VOL" onChange={onChange} />);
    const slider = screen.getByRole("slider");
    // Simulate pointer down to start interaction
    fireEvent.pointerDown(slider, { pointerId: 1 });
    // Just verify no crash — actual angle calculation requires getBoundingClientRect
  });

  test("renders indicator with correct rotation", () => {
    const { container } = render(<RotaryKnob value={0} label="VOL" onChange={vi.fn()} />);
    const indicator = container.querySelector(".sim-knob__indicator");
    expect(indicator).not.toBeNull();
    // value 0 → angle -135deg
    expect(indicator?.getAttribute("style")).toContain("rotate(-135deg)");
  });

  test("renders indicator rotation for max value", () => {
    const { container } = render(<RotaryKnob value={100} label="VOL" onChange={vi.fn()} />);
    const indicator = container.querySelector(".sim-knob__indicator");
    expect(indicator?.getAttribute("style")).toContain("rotate(135deg)");
  });

  test("renders ticks element", () => {
    const { container } = render(<RotaryKnob value={50} label="VOL" onChange={vi.fn()} />);
    expect(container.querySelector(".sim-knob__ticks")).not.toBeNull();
  });
});
