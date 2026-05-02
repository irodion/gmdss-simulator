import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { Scenario, SequenceTemplate } from "../drills/scripts/types.ts";
import { SequenceCard } from "./SequenceCard.tsx";

const speakMock = vi.fn<(text: string, rate?: number, signal?: AbortSignal) => Promise<void>>();
const cancelMock = vi.fn<() => void>();
const isSupportedMock = vi.fn<() => boolean>();

vi.mock("../lib/tts.ts", () => ({
  isSupported: () => isSupportedMock(),
  speak: (text: string, rate?: number, signal?: AbortSignal) => speakMock(text, rate, signal),
  cancel: () => cancelMock(),
}));

const TEMPLATE: SequenceTemplate = {
  rubricId: "v1/distress",
  callLabel: "MAYDAY procedure",
  priorityId: "mayday",
  parts: [
    {
      id: "procedure",
      label: "MAYDAY procedure",
      items: [
        { id: "epirb_on", label: "Turn on EPIRB" },
        { id: "dsc_channel70", label: "DSC: Channel 70, High 25W" },
        { id: "mayday", label: "MAYDAY" },
        { id: "mayday", label: "MAYDAY" },
        { id: "vessel", label: "Blue Duck" },
        { id: "callsign", label: "5BCD2" },
        { id: "position", label: "32°05'N 034°45'E" },
        { id: "over", label: "OVER" },
      ],
    },
  ],
  pool: [],
};

const SCENARIO: Scenario = {
  id: "fire-blue-duck",
  priority: "mayday",
  rubricId: "v1/distress",
  brief: "Engine room fire on MV Blue Duck.",
  facts: { vessel: "Blue Duck", callsign: "5BCD2" },
};

function renderCard() {
  return render(
    <SequenceCard
      template={TEMPLATE}
      scenario={SCENARIO}
      onComplete={() => {}}
      onRetry={() => {}}
      onNewScenario={() => {}}
      onBack={() => {}}
    />,
  );
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /^Submit/ }));
}

beforeEach(() => {
  window.localStorage.clear();
  speakMock.mockReset();
  speakMock.mockResolvedValue(undefined);
  cancelMock.mockReset();
  isSupportedMock.mockReset();
  isSupportedMock.mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SequenceCard TTS toggle", () => {
  test("renders the toggle when speech is supported, default unchecked", () => {
    renderCard();
    const toggle = screen.getByLabelText(/read correct transmission aloud/i) as HTMLInputElement;
    expect(toggle).toBeTruthy();
    expect(toggle.checked).toBe(false);
  });

  test("does not render the toggle when speech is unsupported", () => {
    isSupportedMock.mockReturnValue(false);
    renderCard();
    expect(screen.queryByLabelText(/read correct transmission aloud/i)).toBeNull();
  });

  test("does not render the Play button before submit, even with toggle on", () => {
    renderCard();
    fireEvent.click(screen.getByLabelText(/read correct transmission aloud/i));
    expect(screen.queryByRole("button", { name: /play correct/i })).toBeNull();
  });

  test("Play button is hidden after submit when toggle is off", () => {
    renderCard();
    submit();
    expect(screen.queryByRole("button", { name: /play correct/i })).toBeNull();
  });

  test("Play button shows after submit when toggle is on, and clicking it speaks the transmission", async () => {
    renderCard();
    fireEvent.click(screen.getByLabelText(/read correct transmission aloud/i));
    submit();
    const play = screen.getByRole("button", { name: /play correct radio transmission/i });
    await act(async () => {
      fireEvent.click(play);
    });
    expect(speakMock).toHaveBeenCalledTimes(1);
    const spoken = speakMock.mock.calls[0]![0];
    expect(spoken).toContain("MAYDAY, MAYDAY");
    expect(spoken).toContain("Blue Duck");
    expect(spoken).toContain("5BCD2");
    expect(spoken).toContain("degrees");
    expect(spoken).toContain("north");
    expect(spoken).not.toContain("EPIRB");
    expect(spoken).not.toContain("DSC");
  });

  test("button reads 'Stop' while speech is in flight; clicking it cancels", () => {
    let resolveSpeak: () => void = () => {};
    speakMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSpeak = resolve;
        }),
    );
    renderCard();
    fireEvent.click(screen.getByLabelText(/read correct transmission aloud/i));
    submit();
    fireEvent.click(screen.getByRole("button", { name: /play correct radio transmission/i }));
    const stop = screen.getByRole("button", { name: /stop transmission playback/i });
    expect(stop.textContent).toBe("Stop");
    fireEvent.click(stop);
    expect(cancelMock).toHaveBeenCalled();
    // Resolve the lingering promise so React/Vitest don't complain about unhandled work.
    resolveSpeak();
  });

  test("toggling off mid-playback cancels speech", () => {
    let resolveSpeak: () => void = () => {};
    speakMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSpeak = resolve;
        }),
    );
    renderCard();
    const toggle = screen.getByLabelText(/read correct transmission aloud/i);
    fireEvent.click(toggle);
    submit();
    fireEvent.click(screen.getByRole("button", { name: /play correct radio transmission/i }));
    fireEvent.click(toggle);
    expect(cancelMock).toHaveBeenCalled();
    resolveSpeak();
  });

  test("Stop aborts the AbortSignal passed to speak()", () => {
    let resolveSpeak: () => void = () => {};
    let receivedSignal: AbortSignal | undefined;
    speakMock.mockImplementationOnce(
      (_text, _rate, signal) =>
        new Promise<void>((resolve) => {
          receivedSignal = signal;
          resolveSpeak = resolve;
        }),
    );
    renderCard();
    fireEvent.click(screen.getByLabelText(/read correct transmission aloud/i));
    submit();
    fireEvent.click(screen.getByRole("button", { name: /play correct radio transmission/i }));
    expect(receivedSignal?.aborted).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /stop transmission playback/i }));
    expect(receivedSignal?.aborted).toBe(true);
    resolveSpeak();
  });

  test("toggle preference persists across remount via localStorage", () => {
    const view = renderCard();
    fireEvent.click(screen.getByLabelText(/read correct transmission aloud/i));
    view.unmount();

    renderCard();
    const toggle = screen.getByLabelText(/read correct transmission aloud/i) as HTMLInputElement;
    expect(toggle.checked).toBe(true);
  });
});
