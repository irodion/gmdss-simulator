import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import "../../../i18n/index.ts";

import { DscBuilder } from "./DscBuilder.tsx";

function getInputAfterLabel(container: HTMLElement, labelText: string): HTMLInputElement {
  const labels = container.querySelectorAll(".form-label");
  for (const label of labels) {
    if (label.textContent === labelText) {
      const group = label.closest(".form-group")!;
      return group.querySelector("input, select")! as HTMLInputElement;
    }
  }
  throw new Error(`Input for label "${labelText}" not found`);
}

describe("DscBuilder", () => {
  test("renders with distress category selected by default", () => {
    render(<DscBuilder />);
    const tabs = screen.getAllByRole("button").filter((b) => b.classList.contains("tab"));
    const activeTab = tabs.find((t) => t.classList.contains("tab--active"));
    expect(activeTab?.textContent).toBe("Distress");
  });

  test("shows nature of distress for distress category", () => {
    const { container } = render(<DscBuilder />);
    expect(container.textContent).toContain("Nature of distress");
  });

  test("hides nature of distress when switching to urgency", () => {
    const { container } = render(<DscBuilder />);
    const urgencyTab = screen.getAllByRole("button").find((b) => b.textContent === "Urgency")!;
    fireEvent.click(urgencyTab);
    expect(container.querySelector(".form-label")?.textContent).not.toBe("Nature of distress");
  });

  test("shows target MMSI for routine category", () => {
    const { container } = render(<DscBuilder />);
    const routineTab = screen.getAllByRole("button").find((b) => b.textContent === "Routine")!;
    fireEvent.click(routineTab);
    expect(container.textContent).toContain("Target MMSI");
  });

  test("generates a distress DSC message", () => {
    const { container } = render(<DscBuilder />);

    const mmsiInput = getInputAfterLabel(container, "Your MMSI");
    fireEvent.change(mmsiInput, { target: { value: "211239680" } });

    const generateBtn = screen
      .getAllByRole("button")
      .find((b) => b.textContent === "Generate DSC Message")!;
    fireEvent.click(generateBtn);

    expect(container.textContent).toContain("DSC Message Fields");
    expect(container.textContent).toContain("211 239 680");
  });

  test("validates config prop for initial category", () => {
    render(<DscBuilder config={{ category: "safety" }} />);
    const tabs = screen.getAllByRole("button").filter((b) => b.classList.contains("tab"));
    const activeTab = tabs.find((t) => t.classList.contains("tab--active"));
    expect(activeTab?.textContent).toBe("Safety");
  });

  test("falls back to distress for invalid config category", () => {
    render(<DscBuilder config={{ category: "invalid" }} />);
    const tabs = screen.getAllByRole("button").filter((b) => b.classList.contains("tab"));
    const activeTab = tabs.find((t) => t.classList.contains("tab--active"));
    expect(activeTab?.textContent).toBe("Distress");
  });
});
