import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import { DscKeypad } from "./DscKeypad.tsx";

describe("DscKeypad", () => {
  test("renders digit buttons 0-9", () => {
    render(<DscKeypad onCommand={vi.fn()} />);
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(String(i))).not.toBeNull();
    }
  });

  test("dispatches DSC_DIGIT on digit click", () => {
    const onCommand = vi.fn();
    render(<DscKeypad onCommand={onCommand} />);
    fireEvent.click(screen.getByText("5"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_DIGIT", digit: 5 });
  });

  test("dispatches DSC_DIGIT for 0", () => {
    const onCommand = vi.fn();
    render(<DscKeypad onCommand={onCommand} />);
    fireEvent.click(screen.getByText("0"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_DIGIT", digit: 0 });
  });

  test("dispatches DSC_BACKSPACE on DEL click", () => {
    const onCommand = vi.fn();
    render(<DscKeypad onCommand={onCommand} />);
    fireEvent.click(screen.getByText("DEL"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_BACKSPACE" });
  });

  test("dispatches DSC_ENTER on ENT click", () => {
    const onCommand = vi.fn();
    render(<DscKeypad onCommand={onCommand} />);
    fireEvent.click(screen.getByText("ENT"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_ENTER" });
  });

  test("has accessible label", () => {
    render(<DscKeypad onCommand={vi.fn()} />);
    expect(screen.getByLabelText("Digital keypad")).not.toBeNull();
  });
});
