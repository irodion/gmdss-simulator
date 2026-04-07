import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import "../../../i18n/index.ts";

import { MmsiDecoder } from "./MmsiDecoder.tsx";

function getInput() {
  return screen.getByPlaceholderText("Enter 9-digit MMSI") as HTMLInputElement;
}

describe("MmsiDecoder", () => {
  test("renders input field", () => {
    render(<MmsiDecoder />);
    expect(getInput()).toBeDefined();
  });

  test("does not show results for empty input", () => {
    render(<MmsiDecoder />);
    expect(screen.queryByText(/Station type/i)).toBeNull();
  });

  test("decodes a valid ship MMSI in real time", () => {
    const { container } = render(<MmsiDecoder />);
    fireEvent.change(getInput(), { target: { value: "211239680" } });
    expect(container.textContent).toContain("ship");
    expect(container.textContent).toContain("Germany");
    expect(container.textContent).toContain("211");
  });

  test("shows error for invalid MMSI", () => {
    const { container } = render(<MmsiDecoder />);
    fireEvent.change(getInput(), { target: { value: "12345" } });
    expect(container.textContent).toContain("MMSI must be exactly 9 digits");
  });

  test("accepts pre-filled config", () => {
    const { container } = render(<MmsiDecoder config={{ mmsi: "366123456" }} />);
    expect(container.textContent).toContain("United States");
  });

  test("decodes coast station", () => {
    const { container } = render(<MmsiDecoder />);
    fireEvent.change(getInput(), { target: { value: "002320001" } });
    expect(container.textContent).toContain("coast");
    expect(container.textContent).toContain("United Kingdom");
  });
});
