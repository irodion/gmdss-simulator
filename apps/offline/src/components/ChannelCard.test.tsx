import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import { scoreChannel } from "../drills/channel-mode.ts";
import type { DrillChallenge } from "../drills/drill-types.ts";
import { ChannelCard } from "./ChannelCard.tsx";

function challenge(over: Partial<DrillChallenge> = {}): DrillChallenge {
  return {
    id: "channel-test",
    type: "channel",
    channelDirection: "channel-to-usage",
    channelId: "16",
    prompt: "What is the primary use of Channel 16?",
    expectedAnswer: "Distress, safety, and calling",
    choices: [
      "Distress, safety, and calling",
      "Inter-ship — first choice",
      "Bridge-to-bridge navigation safety",
      "DSC distress, safety, and calling — DSC only",
    ],
    ...over,
  };
}

describe("ChannelCard", () => {
  test("renders the prompt and four choice buttons", () => {
    render(
      <ChannelCard
        challenge={challenge()}
        index={0}
        total={3}
        score={scoreChannel}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText(/primary use of Channel 16/i)).toBeTruthy();
    const choices = screen.getAllByRole("button", { pressed: false });
    // 4 mc choices, no "next" yet.
    expect(choices).toHaveLength(4);
  });

  test("clicking the correct option calls onSubmit with score 100 and reveals Next", () => {
    const onSubmit = vi.fn();
    render(
      <ChannelCard
        challenge={challenge()}
        index={0}
        total={3}
        score={scoreChannel}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Distress, safety, and calling" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0].score).toBe(100);
    expect(screen.getByRole("button", { name: /Next|See results/ })).toBeTruthy();
  });

  test("clicking a wrong option scores 0 and marks the picked choice as wrong", () => {
    const onSubmit = vi.fn();
    render(
      <ChannelCard
        challenge={challenge()}
        index={0}
        total={3}
        score={scoreChannel}
        onSubmit={onSubmit}
        onNext={() => {}}
      />,
    );
    const wrong = screen.getByRole("button", { name: "Inter-ship — first choice" });
    fireEvent.click(wrong);
    expect(onSubmit.mock.calls[0]![0].score).toBe(0);
    expect(wrong.getAttribute("data-state")).toBe("wrong");
    const right = screen.getByRole("button", { name: "Distress, safety, and calling" });
    expect(right.getAttribute("data-state")).toBe("correct");
  });

  test("eyebrow label reflects the direction", () => {
    const { rerender } = render(
      <ChannelCard
        challenge={challenge({ channelDirection: "channel-to-usage" })}
        index={0}
        total={1}
        score={scoreChannel}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText("channel → usage")).toBeTruthy();

    rerender(
      <ChannelCard
        challenge={challenge({
          channelDirection: "usage-to-channel",
          prompt: "Which channel is used for X?",
          expectedAnswer: "Channel 16",
          choices: ["Channel 06", "Channel 09", "Channel 13", "Channel 16"],
        })}
        index={0}
        total={1}
        score={scoreChannel}
        onSubmit={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText("usage → channel")).toBeTruthy();
  });

  test("suppressFeedback keeps choice states neutral and hides ResultBadge", () => {
    render(
      <ChannelCard
        challenge={challenge()}
        index={0}
        total={1}
        score={scoreChannel}
        onSubmit={() => {}}
        onNext={() => {}}
        suppressFeedback
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Distress, safety, and calling" }));
    const right = screen.getByRole("button", { name: "Distress, safety, and calling" });
    expect(right.getAttribute("data-state")).toBe("neutral");
    expect(screen.queryByRole("status")).toBeNull();
  });

  test("Next button calls onNext", () => {
    const onNext = vi.fn();
    render(
      <ChannelCard
        challenge={challenge()}
        index={0}
        total={2}
        score={scoreChannel}
        onSubmit={() => {}}
        onNext={onNext}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Distress, safety, and calling" }));
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(onNext).toHaveBeenCalled();
  });
});
