import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import { CHANNELS } from "../drills/channels.ts";
import { ChannelCheatsheet } from "./ChannelCheatsheet.tsx";

describe("ChannelCheatsheet", () => {
  test("collapsed by default (no `open` attribute on <details>)", () => {
    const { container } = render(<ChannelCheatsheet />);
    const details = container.querySelector("details") as HTMLDetailsElement;
    expect(details).toBeTruthy();
    expect(details.open).toBe(false);
  });

  test("clicking the summary toggles the open state", () => {
    const { container } = render(<ChannelCheatsheet />);
    const details = container.querySelector("details") as HTMLDetailsElement;
    const summary = details.querySelector("summary") as HTMLElement;
    fireEvent.click(summary);
    // happy-dom honors <details> click toggling.
    expect(details.open).toBe(true);
  });

  test("renders every channel id and its short usage label", () => {
    render(<ChannelCheatsheet />);
    expect(screen.getByText(/VHF channel usage/i)).toBeTruthy();
    for (const entry of CHANNELS) {
      expect(screen.getByText(`Ch ${entry.channel}`)).toBeTruthy();
      expect(screen.getByText(entry.usage)).toBeTruthy();
    }
  });
});
