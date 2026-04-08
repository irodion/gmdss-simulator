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
});
