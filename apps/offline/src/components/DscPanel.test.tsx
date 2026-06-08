import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, test } from "vite-plus/test";
import type { DscPanelState, ProcedureGrade } from "../drills/scripts/types.ts";
import { DscPanel, INITIAL_PANEL_STATE } from "./DscPanel.tsx";

function Harness({
  locked = false,
  result = null,
}: {
  readonly locked?: boolean;
  readonly result?: ProcedureGrade | null;
}) {
  const [state, setState] = useState<DscPanelState>(INITIAL_PANEL_STATE);
  return <DscPanel state={state} onChange={setState} locked={locked} result={result} />;
}

function ariaChecked(name: string): string | null {
  return screen.getByRole("switch", { name }).getAttribute("aria-checked");
}

function button(name: RegExp | string): HTMLButtonElement {
  return screen.getByRole("button", { name }) as HTMLButtonElement;
}

describe("DscPanel", () => {
  test("equipment toggles flip their aria-checked state", () => {
    render(<Harness />);
    expect(ariaChecked("EPIRB")).toBe("false");
    fireEvent.click(screen.getByRole("switch", { name: "EPIRB" }));
    expect(ariaChecked("EPIRB")).toBe("true");
  });

  test("choosing Distress reveals the nature selector; choosing Individual reveals priority", () => {
    render(<Harness />);
    // No nature/priority controls until a call type is picked.
    expect(screen.queryByRole("group", { name: /nature of distress/i })).toBeNull();

    fireEvent.click(button("Distress"));
    expect(screen.getByRole("group", { name: /nature of distress/i })).toBeTruthy();

    fireEvent.click(button("Individual"));
    // Switching call type swaps the cascade: nature gone, priority shown.
    expect(screen.queryByRole("group", { name: /nature of distress/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Routine" })).toBeTruthy();
  });

  test("Send is disabled until a distress nature is chosen, then sends and is reversible", () => {
    render(<Harness />);
    fireEvent.click(button("Distress"));
    // Distress chosen but no nature yet → cannot send.
    expect(button(/send dsc alert/i).disabled).toBe(true);

    fireEvent.click(button("Fire / Explosion"));
    expect(button(/send dsc alert/i).disabled).toBe(false);

    fireEvent.click(button(/send dsc alert/i));
    // The scripted acknowledgement appears.
    expect(screen.getByRole("status").textContent).toMatch(/transmitted on Channel 70/i);

    // Cancel reverts to the un-sent state.
    fireEvent.click(button(/^cancel$/i));
    expect(screen.queryByRole("status")).toBeNull();
    expect(button(/send dsc alert/i)).toBeTruthy();
  });

  test("All Ships: Send is disabled until a precedence is chosen, then sends", () => {
    render(<Harness />);
    fireEvent.click(button("All Ships"));
    // Precedence selector revealed; Send blocked until a precedence is picked.
    expect(screen.getByRole("group", { name: /call priority/i })).toBeTruthy();
    expect(button(/send dsc alert/i).disabled).toBe(true);

    fireEvent.click(button("Safety"));
    expect(button(/send dsc alert/i).disabled).toBe(false);

    fireEvent.click(button(/send dsc alert/i));
    expect(screen.getByRole("status").textContent).toMatch(/transmitted on Channel 70/i);
  });

  test("transmit power can be switched between High and Low", () => {
    render(<Harness />);
    // High is the default selection.
    expect(button("High 25 W").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(button("Low 1 W"));
    expect(button("Low 1 W").getAttribute("aria-pressed")).toBe("true");
    expect(button("High 25 W").getAttribute("aria-pressed")).toBe("false");
  });

  test("when locked, controls are disabled and per-field feedback renders", () => {
    const result: ProcedureGrade = {
      fields: [
        { id: "epirb", label: "EPIRB", correct: false, detail: "EPIRB should be ON" },
        { id: "channel", label: "Working channel", correct: true, detail: "Channel 16" },
      ],
      correct: 1,
      total: 2,
      status: "partial",
      criticalFailure: false,
    };
    render(<Harness locked result={result} />);
    expect(screen.getByRole("switch", { name: "EPIRB" })).toHaveProperty("disabled", true);
    const feedback = screen.getByLabelText(/dsc and equipment feedback/i);
    expect(feedback.textContent).toContain("EPIRB should be ON");
    expect(feedback.textContent).toContain("Channel 16");
  });
});
