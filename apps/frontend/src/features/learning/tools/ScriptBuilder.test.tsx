import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import "../../../i18n/index.ts";

import { ScriptBuilder } from "./ScriptBuilder.tsx";

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

function clickTab(text: string) {
  const tab = screen.getAllByRole("button").find((b) => b.textContent === text)!;
  fireEvent.click(tab);
}

describe("ScriptBuilder", () => {
  test("renders with MAYDAY tab active by default", () => {
    render(<ScriptBuilder />);
    const tabs = screen.getAllByRole("button").filter((b) => b.classList.contains("tab"));
    const active = tabs.find((t) => t.classList.contains("tab--active"));
    expect(active?.textContent).toBe("MAYDAY");
  });

  test("shows vessel name field for MAYDAY", () => {
    const { container } = render(<ScriptBuilder />);
    expect(container.textContent).toContain("Vessel name");
  });

  test("shows station name field for SECURITE", () => {
    const { container } = render(<ScriptBuilder />);
    clickTab("SECURITE");
    expect(container.textContent).toContain("Station name");
  });

  test("generates a MAYDAY script", () => {
    const { container } = render(<ScriptBuilder />);

    fireEvent.change(getInputAfterLabel(container, "Vessel name"), {
      target: { value: "Blue Duck" },
    });
    fireEvent.change(getInputAfterLabel(container, "Position"), {
      target: { value: "36°08'N 005°21'W" },
    });
    fireEvent.change(getInputAfterLabel(container, "Nature of distress"), {
      target: { value: "on fire" },
    });
    fireEvent.change(getInputAfterLabel(container, "Assistance required"), {
      target: { value: "immediate assistance" },
    });
    fireEvent.change(getInputAfterLabel(container, "Persons on board"), {
      target: { value: "12" },
    });

    const genBtn = screen.getAllByRole("button").find((b) => b.textContent === "Generate Script")!;
    fireEvent.click(genBtn);

    expect(container.textContent).toContain("MAYDAY MAYDAY MAYDAY");
    expect(container.textContent).toContain("BLUE DUCK");
  });

  test("resets form fields when switching script type", () => {
    const { container } = render(<ScriptBuilder />);

    const vesselInput = getInputAfterLabel(container, "Vessel name");
    fireEvent.change(vesselInput, { target: { value: "Test Vessel" } });
    expect(vesselInput.value).toBe("Test Vessel");

    // Switch to SECURITE then back to MAYDAY
    clickTab("SECURITE");
    clickTab("MAYDAY");

    const resetInput = getInputAfterLabel(container, "Vessel name");
    expect(resetInput.value).toBe("");
  });

  test("validates config prop for initial script type", () => {
    render(<ScriptBuilder config={{ scriptType: "securite" }} />);
    const tabs = screen.getAllByRole("button").filter((b) => b.classList.contains("tab"));
    const active = tabs.find((t) => t.classList.contains("tab--active"));
    expect(active?.textContent).toBe("SECURITE");
  });

  test("falls back to mayday for invalid config", () => {
    render(<ScriptBuilder config={{ scriptType: "invalid" }} />);
    const tabs = screen.getAllByRole("button").filter((b) => b.classList.contains("tab"));
    const active = tabs.find((t) => t.classList.contains("tab--active"));
    expect(active?.textContent).toBe("MAYDAY");
  });

  test("generates a PAN PAN script", () => {
    const { container } = render(<ScriptBuilder config={{ scriptType: "pan-pan" }} />);
    fireEvent.change(getInputAfterLabel(container, "Vessel name"), {
      target: { value: "Sea Breeze" },
    });
    fireEvent.change(getInputAfterLabel(container, "Position"), {
      target: { value: "51°N 2°W" },
    });
    fireEvent.change(getInputAfterLabel(container, "Nature of urgency"), {
      target: { value: "Engine failure" },
    });
    fireEvent.change(getInputAfterLabel(container, "Assistance required"), {
      target: { value: "Tow needed" },
    });

    const genBtn = screen.getAllByRole("button").find((b) => b.textContent === "Generate Script")!;
    fireEvent.click(genBtn);

    expect(container.textContent).toContain("PAN PAN");
    expect(container.textContent).toContain("SEA BREEZE");
  });

  test("generates a SECURITE script", () => {
    const { container } = render(<ScriptBuilder config={{ scriptType: "securite" }} />);
    fireEvent.change(getInputAfterLabel(container, "Station name"), {
      target: { value: "Coast Guard" },
    });
    fireEvent.change(getInputAfterLabel(container, "Nature of safety message"), {
      target: { value: "Nav warning" },
    });
    fireEvent.change(getInputAfterLabel(container, "Details"), {
      target: { value: "Unlit buoy adrift" },
    });

    const genBtn = screen.getAllByRole("button").find((b) => b.textContent === "Generate Script")!;
    fireEvent.click(genBtn);

    expect(container.textContent).toContain("SECURITE");
    expect(container.textContent).toContain("COAST GUARD");
  });

  test("generates a MEDICO script", () => {
    const { container } = render(<ScriptBuilder config={{ scriptType: "medico" }} />);
    fireEvent.change(getInputAfterLabel(container, "Vessel name"), {
      target: { value: "Trader" },
    });
    fireEvent.change(getInputAfterLabel(container, "Position"), {
      target: { value: "35°S 150°E" },
    });
    fireEvent.change(getInputAfterLabel(container, "Patient details"), {
      target: { value: "Chest pain" },
    });
    fireEvent.change(getInputAfterLabel(container, "Assistance required"), {
      target: { value: "Medical advice" },
    });

    const genBtn = screen.getAllByRole("button").find((b) => b.textContent === "Generate Script")!;
    fireEvent.click(genBtn);

    expect(container.textContent).toContain("TRADER");
    expect(container.textContent).toContain("ALL STATIONS ALL STATIONS ALL STATIONS");
  });

  test("MEDICO addressee field is honoured when filled in", () => {
    const { container } = render(<ScriptBuilder config={{ scriptType: "medico" }} />);
    fireEvent.change(getInputAfterLabel(container, "Vessel name"), {
      target: { value: "Grey Whale" },
    });
    fireEvent.change(getInputAfterLabel(container, "Position"), {
      target: { value: "31°45'N 034°20'E" },
    });
    fireEvent.change(getInputAfterLabel(container, "Addressee (e.g. All Stations or RCC Haifa)"), {
      target: { value: "RCC Haifa" },
    });
    fireEvent.change(getInputAfterLabel(container, "Patient details"), {
      target: { value: "Chest pain" },
    });
    fireEvent.change(getInputAfterLabel(container, "Assistance required"), {
      target: { value: "Medical advice" },
    });

    const genBtn = screen.getAllByRole("button").find((b) => b.textContent === "Generate Script")!;
    fireEvent.click(genBtn);

    expect(container.textContent).toContain("RCC HAIFA RCC HAIFA RCC HAIFA");
    expect(container.textContent).not.toContain("ALL STATIONS");
  });
});
