import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import { INITIAL_RADIO_STATE, type RadioState } from "@gmdss-simulator/utils";
import { RadioDisplay } from "./RadioDisplay.tsx";

describe("RadioDisplay", () => {
  test("displays channel and frequency for initial state", () => {
    render(<RadioDisplay state={INITIAL_RADIO_STATE} />);
    const lcd = screen.getByLabelText("Radio display");
    expect(lcd.textContent).toContain("CH 16");
    expect(lcd.textContent).toContain("156.800");
  });

  test("shows dual watch status", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, dualWatch: true };
    render(<RadioDisplay state={state} />);
    expect(screen.getByLabelText("Radio display").textContent).toContain("DUAL WATCH: CH 16");
  });

  test("shows low power", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, power: "low" };
    render(<RadioDisplay state={state} />);
    expect(screen.getByLabelText("Radio display").textContent).toContain("PWR 1W");
  });

  test("shows GPS lock status", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, gpsLock: false };
    render(<RadioDisplay state={state} />);
    expect(screen.getByLabelText("Radio display").textContent).toContain("NO GPS");
  });

  test("updates when channel changes", () => {
    const state: RadioState = { ...INITIAL_RADIO_STATE, channel: 9 };
    render(<RadioDisplay state={state} />);
    const lcd = screen.getByLabelText("Radio display");
    expect(lcd.textContent).toContain("CH 09");
    expect(lcd.textContent).toContain("156.450");
  });
});
