import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach, afterEach } from "vite-plus/test";
import "../../../i18n/index.ts";
import { DistressButton } from "./DistressButton.tsx";

describe("DistressButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("renders with flip cover closed by default", () => {
    render(<DistressButton flipCover="closed" dscMenuScreen="closed" onCommand={vi.fn()} />);
    expect(screen.getByText("LIFT TO ACCESS")).not.toBeNull();
    expect(screen.getByText("DSC CONTROLS")).not.toBeNull();
  });

  test("opens flip cover on click", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="closed" dscMenuScreen="closed" onCommand={onCommand} />);
    fireEvent.click(screen.getByText("LIFT TO ACCESS"));
    expect(onCommand).toHaveBeenCalledWith({ type: "OPEN_FLIP_COVER" });
  });

  test("closes flip cover when open", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="open" dscMenuScreen="closed" onCommand={onCommand} />);
    fireEvent.click(screen.getByLabelText("Close flip cover"));
    expect(onCommand).toHaveBeenCalledWith({ type: "CLOSE_FLIP_COVER" });
  });

  test("starts distress hold on pointer down with open cover", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="open" dscMenuScreen="closed" onCommand={onCommand} />);
    fireEvent.pointerDown(screen.getByLabelText("Distress alert"));
    expect(onCommand).toHaveBeenCalledWith({ type: "START_DISTRESS_HOLD" });
  });

  test("cancels distress hold on pointer up before 5s", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="open" dscMenuScreen="closed" onCommand={onCommand} />);
    fireEvent.pointerDown(screen.getByLabelText("Distress alert"));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.pointerUp(screen.getByLabelText("Distress alert"));
    expect(onCommand).toHaveBeenCalledWith({ type: "CANCEL_DISTRESS_HOLD" });
  });

  test("completes distress hold after 5s", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="open" dscMenuScreen="closed" onCommand={onCommand} />);
    fireEvent.pointerDown(screen.getByLabelText("Distress alert"));
    act(() => {
      vi.advanceTimersByTime(5200);
    });
    expect(onCommand).toHaveBeenCalledWith({ type: "COMPLETE_DISTRESS_HOLD" });
  });

  test("shows countdown during hold", () => {
    render(<DistressButton flipCover="open" dscMenuScreen="closed" onCommand={vi.fn()} />);
    fireEvent.pointerDown(screen.getByLabelText("Distress alert"));
    expect(screen.getByText("5")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.getByText("4")).not.toBeNull();
  });

  test("renders CALL and MENU buttons", () => {
    render(<DistressButton flipCover="closed" dscMenuScreen="closed" onCommand={vi.fn()} />);
    expect(screen.getByText("CALL")).not.toBeNull();
    expect(screen.getByText("MENU")).not.toBeNull();
  });

  test("renders DSC status line", () => {
    render(<DistressButton flipCover="closed" dscMenuScreen="closed" onCommand={vi.fn()} />);
    expect(screen.getByLabelText("DSC status").textContent).toContain("MMSI");
    expect(screen.getByLabelText("DSC status").textContent).toContain("AUTO-SWITCH READY");
  });

  test("flip cover has open class when open", () => {
    const { container } = render(
      <DistressButton flipCover="open" dscMenuScreen="closed" onCommand={vi.fn()} />,
    );
    const cover = container.querySelector(".sim-flip-cover");
    expect(cover?.classList.contains("sim-flip-cover--open")).toBe(true);
  });

  test("opens flip cover on keyboard Enter", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="closed" dscMenuScreen="closed" onCommand={onCommand} />);
    const cover = screen.getByLabelText("Lift flip cover");
    fireEvent.keyDown(cover, { key: "Enter" });
    expect(onCommand).toHaveBeenCalledWith({ type: "OPEN_FLIP_COVER" });
  });

  test("opens flip cover on keyboard Space", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="closed" dscMenuScreen="closed" onCommand={onCommand} />);
    const cover = screen.getByLabelText("Lift flip cover");
    fireEvent.keyDown(cover, { key: " " });
    expect(onCommand).toHaveBeenCalledWith({ type: "OPEN_FLIP_COVER" });
  });

  test("does not start distress hold when cover is closed", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="closed" dscMenuScreen="closed" onCommand={onCommand} />);
    fireEvent.pointerDown(screen.getByLabelText("Distress alert"));
    // Should not dispatch START_DISTRESS_HOLD
    expect(onCommand).not.toHaveBeenCalledWith({ type: "START_DISTRESS_HOLD" });
  });

  test("cancels on pointerCancel", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="open" dscMenuScreen="closed" onCommand={onCommand} />);
    fireEvent.pointerDown(screen.getByLabelText("Distress alert"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.pointerCancel(screen.getByLabelText("Distress alert"));
    expect(onCommand).toHaveBeenCalledWith({ type: "CANCEL_DISTRESS_HOLD" });
  });

  test("MENU button dispatches OPEN_DSC_MENU when closed", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="closed" dscMenuScreen="closed" onCommand={onCommand} />);
    fireEvent.click(screen.getByText("MENU"));
    expect(onCommand).toHaveBeenCalledWith({ type: "OPEN_DSC_MENU" });
  });

  test("MENU button dispatches DSC_MENU_BACK when open", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="closed" dscMenuScreen="top-menu" onCommand={onCommand} />);
    fireEvent.click(screen.getByText("MENU"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_MENU_BACK" });
  });

  test("CALL button dispatches DSC_MENU_SELECT normally", () => {
    const onCommand = vi.fn();
    render(<DistressButton flipCover="closed" dscMenuScreen="top-menu" onCommand={onCommand} />);
    fireEvent.click(screen.getByText("CALL"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_MENU_SELECT" });
  });

  test("CALL button dispatches DSC_TOGGLE_HEMISPHERE on position-lat", () => {
    const onCommand = vi.fn();
    render(
      <DistressButton flipCover="closed" dscMenuScreen="position-lat" onCommand={onCommand} />,
    );
    fireEvent.click(screen.getByText("CALL"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_TOGGLE_HEMISPHERE" });
  });

  test("CALL button dispatches DSC_TOGGLE_HEMISPHERE on position-lon", () => {
    const onCommand = vi.fn();
    render(
      <DistressButton flipCover="closed" dscMenuScreen="position-lon" onCommand={onCommand} />,
    );
    fireEvent.click(screen.getByText("CALL"));
    expect(onCommand).toHaveBeenCalledWith({ type: "DSC_TOGGLE_HEMISPHERE" });
  });
});
