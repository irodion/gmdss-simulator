import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import "../../../i18n/index.ts";
import { INITIAL_RADIO_STATE } from "@gmdss-simulator/utils";
import { AccessibleRadioPanel } from "./AccessibleRadioPanel.tsx";

describe("AccessibleRadioPanel", () => {
  test("renders channel selector with current channel", () => {
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={vi.fn()} />);
    const select = screen.getByLabelText("Channel") as HTMLSelectElement;
    expect(select.value).toBe("16");
  });

  test("renders volume range input", () => {
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={vi.fn()} />);
    const vol = screen.getByLabelText(/VOL/i) as HTMLInputElement;
    expect(vol.value).toBe("75");
  });

  test("renders squelch range input", () => {
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={vi.fn()} />);
    const sql = screen.getByLabelText(/SQL/i) as HTMLInputElement;
    expect(sql.value).toBe("4");
  });

  test("dispatches SET_CHANNEL on select change", () => {
    const onCommand = vi.fn();
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={onCommand} />);
    fireEvent.change(screen.getByLabelText("Channel"), { target: { value: "9" } });
    expect(onCommand).toHaveBeenCalledWith({ type: "SET_CHANNEL", channel: 9 });
  });

  test("dispatches SET_VOLUME on range change", () => {
    const onCommand = vi.fn();
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={onCommand} />);
    fireEvent.change(screen.getByLabelText(/VOL/i), { target: { value: "50" } });
    expect(onCommand).toHaveBeenCalledWith({ type: "SET_VOLUME", value: 50 });
  });

  test("dispatches TOGGLE_DUAL_WATCH on checkbox", () => {
    const onCommand = vi.fn();
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={onCommand} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onCommand).toHaveBeenCalledWith({ type: "TOGGLE_DUAL_WATCH" });
  });

  test("dispatches TOGGLE_POWER on button click", () => {
    const onCommand = vi.fn();
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={onCommand} />);
    fireEvent.click(screen.getByText("Toggle H/L"));
    expect(onCommand).toHaveBeenCalledWith({ type: "TOGGLE_POWER" });
  });

  test("shows idle status by default", () => {
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={vi.fn()} />);
    expect(screen.getByText("Idle")).not.toBeNull();
  });

  test("shows transmitting status", () => {
    render(
      <AccessibleRadioPanel
        state={{ ...INITIAL_RADIO_STATE, txRx: "transmitting" }}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.getByText("TRANSMITTING")).not.toBeNull();
  });

  test("shows DSC ONLY for channel 70", () => {
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={vi.fn()} />);
    const select = screen.getByLabelText("Channel");
    const option70 = select.querySelector('option[value="70"]') as HTMLOptionElement;
    expect(option70.textContent).toContain("DSC ONLY");
    expect(option70.disabled).toBe(true);
  });

  test("shows GUARD label and disables channels 75/76", () => {
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={vi.fn()} />);
    const select = screen.getByLabelText("Channel");
    const option75 = select.querySelector('option[value="75"]') as HTMLOptionElement;
    const option76 = select.querySelector('option[value="76"]') as HTMLOptionElement;
    expect(option75.textContent).toContain("GUARD");
    expect(option75.disabled).toBe(true);
    expect(option76.textContent).toContain("GUARD");
    expect(option76.disabled).toBe(true);
  });

  test("renders DSC menu button", () => {
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={vi.fn()} />);
    expect(screen.getByText("Menu")).not.toBeNull();
  });

  test("DSC menu button shows Back when menu open", () => {
    const state = { ...INITIAL_RADIO_STATE, dscMenu: { screen: "top-menu" as const, cursor: 0 } };
    render(<AccessibleRadioPanel state={state} onCommand={vi.fn()} />);
    expect(screen.getByText("Back")).not.toBeNull();
  });

  test("dispatches OPEN_DSC_MENU when menu is closed", () => {
    const onCommand = vi.fn();
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={onCommand} />);
    fireEvent.click(screen.getByText("Menu"));
    expect(onCommand).toHaveBeenCalledWith({ type: "OPEN_DSC_MENU" });
  });

  test("dispatches DSC_MENU_BACK when menu is open", () => {
    const onCommand = vi.fn();
    const state = { ...INITIAL_RADIO_STATE, dscMenu: { screen: "top-menu" as const, cursor: 0 } };
    render(<AccessibleRadioPanel state={state} onCommand={onCommand} />);
    fireEvent.click(screen.getByText("Back"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_MENU_BACK" });
  });

  test("shows DSC screen readout when menu is open", () => {
    const state = { ...INITIAL_RADIO_STATE, dscMenu: { screen: "top-menu" as const, cursor: 0 } };
    render(<AccessibleRadioPanel state={state} onCommand={vi.fn()} />);
    expect(screen.getByText("> INDIVIDUAL CALL")).not.toBeNull();
  });

  test("renders keypad digits 0-9", () => {
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={vi.fn()} />);
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByText(String(i))).not.toBeNull();
    }
  });

  test("dispatches DSC_DIGIT from keypad", () => {
    const onCommand = vi.fn();
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={onCommand} />);
    fireEvent.click(screen.getByText("7"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_DIGIT", digit: 7 });
  });

  test("dispatches DSC_MENU_SELECT from Select button", () => {
    const onCommand = vi.fn();
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={onCommand} />);
    fireEvent.click(screen.getByText("Select"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_MENU_SELECT" });
  });

  test("dispatches DSC_BACKSPACE from DEL button", () => {
    const onCommand = vi.fn();
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={onCommand} />);
    fireEvent.click(screen.getByText("DEL"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_BACKSPACE" });
  });

  test("dispatches DSC_ENTER from ENT button", () => {
    const onCommand = vi.fn();
    render(<AccessibleRadioPanel state={INITIAL_RADIO_STATE} onCommand={onCommand} />);
    fireEvent.click(screen.getByText("ENT"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_ENTER" });
  });
});
