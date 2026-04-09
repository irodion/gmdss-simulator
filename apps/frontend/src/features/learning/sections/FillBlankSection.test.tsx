import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import "../../../i18n/index.ts";

import { FillBlankSectionView } from "./FillBlankSection.tsx";

const defaultProps = {
  prompt: "The distress channel is Channel ___",
  answer: "16",
  alternatives: ["sixteen"],
  explanation: "Channel 16 is the international distress frequency.",
};

describe("FillBlankSectionView", () => {
  test("renders prompt text", () => {
    render(<FillBlankSectionView {...defaultProps} />);
    expect(screen.getByText("The distress channel is Channel ___")).toBeDefined();
  });

  test("does not show check button when input is empty", () => {
    render(<FillBlankSectionView {...defaultProps} />);
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBe(0);
  });

  test("shows check button when input has text", () => {
    render(<FillBlankSectionView {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(input, { target: { value: "16" } });
    expect(screen.getAllByRole("button").length).toBe(1);
  });

  test("shows correct feedback for exact match", () => {
    render(<FillBlankSectionView {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(input, { target: { value: "16" } });
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/Correct!/)).toBeDefined();
  });

  test("shows correct feedback for alternative spelling", () => {
    render(<FillBlankSectionView {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(input, { target: { value: "sixteen" } });
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/Correct!/)).toBeDefined();
  });

  test("case-insensitive matching", () => {
    render(<FillBlankSectionView {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(input, { target: { value: "SIXTEEN" } });
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/Correct!/)).toBeDefined();
  });

  test("trims whitespace", () => {
    render(<FillBlankSectionView {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(input, { target: { value: "  16  " } });
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/Correct!/)).toBeDefined();
  });

  test("shows incorrect feedback for wrong answer", () => {
    render(<FillBlankSectionView {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(input, { target: { value: "70" } });
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/Incorrect/)).toBeDefined();
  });

  test("disables input after submission", () => {
    render(<FillBlankSectionView {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(input, { target: { value: "16" } });
    fireEvent.click(screen.getByRole("button"));
    expect(input.hasAttribute("disabled")).toBe(true);
  });

  test("submits on Enter key", () => {
    render(<FillBlankSectionView {...defaultProps} />);
    const input = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(input, { target: { value: "16" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText(/Correct!/)).toBeDefined();
  });
});
