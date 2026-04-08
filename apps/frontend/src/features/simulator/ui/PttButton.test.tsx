import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import "../../../i18n/index.ts";
import { PttButton } from "./PttButton.tsx";

describe("PttButton", () => {
  test("renders with PTT label", () => {
    render(<PttButton disabled={false} active={false} onCommand={vi.fn()} />);
    expect(screen.getByRole("button", { name: /push to talk/i })).not.toBeNull();
  });

  test("dispatches PRESS_PTT on pointerdown", () => {
    const onCommand = vi.fn();
    render(<PttButton disabled={false} active={false} onCommand={onCommand} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: /push to talk/i }));
    expect(onCommand).toHaveBeenCalledWith({ type: "PRESS_PTT" });
  });

  test("dispatches RELEASE_PTT on pointerup when active", () => {
    const onCommand = vi.fn();
    render(<PttButton disabled={false} active={true} onCommand={onCommand} />);
    fireEvent.pointerUp(screen.getByRole("button", { name: /push to talk/i }));
    expect(onCommand).toHaveBeenCalledWith({ type: "RELEASE_PTT" });
  });

  test("does not dispatch when disabled", () => {
    const onCommand = vi.fn();
    render(<PttButton disabled={true} active={false} onCommand={onCommand} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: /push to talk/i }));
    expect(onCommand).not.toHaveBeenCalled();
  });

  test("applies active class when active", () => {
    render(<PttButton disabled={false} active={true} onCommand={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /push to talk/i });
    expect(btn.classList.contains("sim-ptt--active")).toBe(true);
  });

  test("applies disabled class when disabled", () => {
    render(<PttButton disabled={true} active={false} onCommand={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /push to talk/i });
    expect(btn.classList.contains("sim-ptt--disabled")).toBe(true);
  });

  test("dispatches PRESS_PTT on spacebar keydown", () => {
    const onCommand = vi.fn();
    render(<PttButton disabled={false} active={false} onCommand={onCommand} />);
    fireEvent.keyDown(window, { code: "Space" });
    expect(onCommand).toHaveBeenCalledWith({ type: "PRESS_PTT" });
  });

  test("dispatches RELEASE_PTT on spacebar keyup", () => {
    const onCommand = vi.fn();
    render(<PttButton disabled={false} active={false} onCommand={onCommand} />);
    // Press first to set spaceHeld ref
    fireEvent.keyDown(window, { code: "Space" });
    fireEvent.keyUp(window, { code: "Space" });
    expect(onCommand).toHaveBeenCalledWith({ type: "RELEASE_PTT" });
  });

  test("does not dispatch on spacebar when disabled", () => {
    const onCommand = vi.fn();
    render(<PttButton disabled={true} active={false} onCommand={onCommand} />);
    fireEvent.keyDown(window, { code: "Space" });
    expect(onCommand).not.toHaveBeenCalled();
  });

  test("ignores repeated spacebar", () => {
    const onCommand = vi.fn();
    render(<PttButton disabled={false} active={false} onCommand={onCommand} />);
    fireEvent.keyDown(window, { code: "Space" });
    fireEvent.keyDown(window, { code: "Space", repeat: true });
    // Should only fire once
    expect(onCommand).toHaveBeenCalledTimes(1);
  });

  test("handles pointerCancel like pointerUp", () => {
    const onCommand = vi.fn();
    render(<PttButton disabled={false} active={true} onCommand={onCommand} />);
    fireEvent.pointerCancel(screen.getByRole("button", { name: /push to talk/i }));
    expect(onCommand).toHaveBeenCalledWith({ type: "RELEASE_PTT" });
  });
});
