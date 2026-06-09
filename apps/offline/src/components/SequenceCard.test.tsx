import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { Scenario, SequenceTemplate } from "../drills/scripts/types.ts";
import { SequenceCard } from "./SequenceCard.tsx";

const speakMock = vi.fn<(text: string, rate?: number, signal?: AbortSignal) => Promise<void>>();
const cancelMock = vi.fn<() => void>();
const isSupportedMock = vi.fn<() => boolean>();
const detectSupportMock = vi.fn<() => Promise<boolean>>();

vi.mock("../lib/tts.ts", () => ({
  isSupported: () => isSupportedMock(),
  detectSpeechSupport: () => detectSupportMock(),
  onVoicesChanged: () => () => {},
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
  detectSupportMock.mockReset();
  // By default the async voice probe agrees with the synchronous API check.
  detectSupportMock.mockImplementation(() => Promise.resolve(isSupportedMock()));
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

  test("withdraws the toggle when the API exists but no voices are installed", async () => {
    detectSupportMock.mockResolvedValue(false);
    renderCard();
    // Optimistically rendered from the synchronous API check…
    expect(screen.getByLabelText(/read correct transmission aloud/i)).toBeTruthy();
    // …then withdrawn once the async voice probe reports no usable voices.
    await act(async () => {
      await Promise.resolve();
    });
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

const PANEL_TEMPLATE: SequenceTemplate = {
  rubricId: "v1/distress",
  callLabel: "MAYDAY procedure",
  priorityId: "mayday",
  parts: [
    {
      id: "procedure",
      label: "MAYDAY procedure",
      items: [
        { id: "mayday", label: "MAYDAY" },
        { id: "vessel", label: "Blue Duck" },
        { id: "over", label: "OVER" },
      ],
    },
  ],
  pool: [],
};

const PANEL_SCENARIO: Scenario = {
  id: "panel-fire-blue-duck",
  priority: "mayday",
  rubricId: "v1/distress",
  brief: "Engine room fire on MV Blue Duck.",
  facts: { vessel: "Blue Duck", callsign: "5BCD2" },
  dsc: {
    state: "required",
    callType: "distress",
    nature: "fire",
    channel: 16,
    power: "high",
    epirb: true,
  },
};

describe("SequenceCard with DSC panel", () => {
  function renderPanelCard() {
    return render(
      <SequenceCard
        template={PANEL_TEMPLATE}
        scenario={PANEL_SCENARIO}
        onComplete={() => {}}
        onRetry={() => {}}
        onNewScenario={() => {}}
        onBack={() => {}}
      />,
    );
  }

  test("renders the DSC/equipment panel for a Scenario carrying a dsc block", () => {
    renderPanelCard();
    expect(screen.getByLabelText(/dsc and equipment controls/i)).toBeTruthy();
    expect(screen.getByRole("switch", { name: "EPIRB" })).toBeTruthy();
  });

  test("a correct panel + voice configuration submits to a passing grade", () => {
    renderPanelCard();
    // Configure the panel correctly: EPIRB on, Distress → Fire, send, Ch 16, High.
    fireEvent.click(screen.getByRole("switch", { name: "EPIRB" }));
    fireEvent.click(screen.getByRole("button", { name: "Distress" }));
    fireEvent.click(screen.getByRole("button", { name: "Fire / Explosion" }));
    fireEvent.click(screen.getByRole("button", { name: /send dsc alert/i }));
    fireEvent.click(screen.getByRole("button", { name: "Channel 16" }));
    submit();

    // Per-field panel feedback and the relabelled score dimension both render.
    expect(screen.getByLabelText(/dsc and equipment feedback/i)).toBeTruthy();
    expect(screen.getByText("DSC & equipment", { selector: ".seq-breakdown-label" })).toBeTruthy();
  });

  test("submitting an untouched panel surfaces the per-field DSC feedback", () => {
    renderPanelCard();
    submit();
    const feedback = screen.getByLabelText(/dsc and equipment feedback/i);
    expect(feedback.textContent).toMatch(/no DSC alert sent/i);
  });

  const ALL_SHIPS_SCENARIO: Scenario = {
    id: "panel-securite-cape-runner",
    priority: "securite",
    rubricId: "v1/safety",
    brief: "Floating container drifting in the shipping lane.",
    facts: { vessel: "Cape Runner" },
    dsc: {
      state: "required",
      callType: "all_ships",
      priority: "safety",
      channel: 16,
      power: "high",
      epirb: false,
    },
  };

  const INDIVIDUAL_SCENARIO: Scenario = {
    id: "panel-tr-sea-sprite",
    priority: "routine",
    rubricId: "v1/routine-tr",
    brief: "Transit report to Haifa Radio before departure.",
    facts: { vessel: "Sea Sprite" },
    dsc: {
      state: "required",
      callType: "individual",
      priority: "routine",
      addressee: "haifa_radio",
      channel: 26,
      power: "high",
      epirb: false,
    },
  };

  test("an Individual scenario reveals the addressee cascade, acks the channel, and grades it", () => {
    render(
      <SequenceCard
        template={PANEL_TEMPLATE}
        scenario={INDIVIDUAL_SCENARIO}
        onComplete={() => {}}
        onRetry={() => {}}
        onNewScenario={() => {}}
        onBack={() => {}}
      />,
    );
    // Individual → Routine → Haifa Radio → Ch 26 (EPIRB off, power High by default).
    fireEvent.click(screen.getByRole("button", { name: "Individual" }));
    fireEvent.click(screen.getByRole("button", { name: "Routine" }));
    fireEvent.click(screen.getByRole("button", { name: /Haifa Radio, MMSI/i }));
    fireEvent.click(screen.getByRole("button", { name: "Channel 26" }));
    fireEvent.click(screen.getByRole("button", { name: /send dsc alert/i }));

    // The scripted acknowledgement accepts the proposed channel.
    expect(screen.getByRole("status").textContent).toMatch(/Haifa Radio: affirmative, channel 26/i);

    submit();
    const feedback = screen.getByLabelText(/dsc and equipment feedback/i);
    expect(feedback.textContent).toContain("Addressee");
    expect(feedback.textContent).toContain("Haifa Radio");
    expect(feedback.textContent).not.toMatch(/no DSC alert sent/i);
    expect(feedback.textContent).not.toMatch(/should be/i);
    expect(feedback.textContent).not.toMatch(/expected/i);
  });

  const FORBIDDEN_SCENARIO: Scenario = {
    id: "panel-ack-vered",
    priority: "mayday",
    rubricId: "v1/distress-ack",
    brief: "Acknowledge the MAYDAY by voice on Channel 16.",
    facts: { vessel: "Vered" },
    dsc: { state: "forbidden", channel: 16, power: "high", epirb: false },
  };

  function renderForbidden() {
    return render(
      <SequenceCard
        template={PANEL_TEMPLATE}
        scenario={FORBIDDEN_SCENARIO}
        onComplete={() => {}}
        onRetry={() => {}}
        onNewScenario={() => {}}
        onBack={() => {}}
      />,
    );
  }

  test("a forbidden scenario keeps the panel active and rewards correct voice-only", () => {
    renderForbidden();
    // The panel stays visible and interactive (the judgment is when NOT to send).
    expect(screen.getByLabelText(/dsc and equipment controls/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Distress" })).toBeTruthy();
    // Voice on Ch 16 at high power (default), no DSC alert.
    fireEvent.click(screen.getByRole("button", { name: "Channel 16" }));
    submit();
    const feedback = screen.getByLabelText(/dsc and equipment feedback/i);
    expect(feedback.textContent).toMatch(/voice-only/i);
    expect(feedback.textContent).not.toMatch(/expected Channel/i);
  });

  test("a forbidden scenario flags a stray DSC alert and auto-fails it", () => {
    renderForbidden();
    // Voice on Ch 16 is correct, so the numeric score would otherwise pass —
    // but a false DSC distress alert is a critical failure (#98).
    fireEvent.click(screen.getByRole("button", { name: "Channel 16" }));
    fireEvent.click(screen.getByRole("button", { name: "Distress" }));
    fireEvent.click(screen.getByRole("button", { name: "Fire / Explosion" }));
    fireEvent.click(screen.getByRole("button", { name: /send dsc alert/i }));
    submit();
    const feedback = screen.getByLabelText(/dsc and equipment feedback/i);
    expect(feedback.textContent).toMatch(/none was required/i);
    // The auto-fail is attributed in the summary breakdown.
    const banner = screen.getByRole("alert");
    expect(banner.textContent).toMatch(/auto-fail/i);
    expect(banner.textContent).toMatch(/false distress alert/i);
  });

  test("an All Ships scenario reveals the precedence cascade and grades it correct", () => {
    render(
      <SequenceCard
        template={PANEL_TEMPLATE}
        scenario={ALL_SHIPS_SCENARIO}
        onComplete={() => {}}
        onRetry={() => {}}
        onNewScenario={() => {}}
        onBack={() => {}}
      />,
    );
    // Configure a correct SECURITE broadcast: All Ships → Safety → send, Ch 16.
    // (EPIRB stays off and power stays High by default — both already correct.)
    fireEvent.click(screen.getByRole("button", { name: "All Ships" }));
    fireEvent.click(screen.getByRole("button", { name: "Safety" }));
    fireEvent.click(screen.getByRole("button", { name: /send dsc alert/i }));
    fireEvent.click(screen.getByRole("button", { name: "Channel 16" }));
    submit();

    const feedback = screen.getByLabelText(/dsc and equipment feedback/i);
    expect(feedback.textContent).toContain("Precedence");
    expect(feedback.textContent).toContain("Safety");
    expect(feedback.textContent).not.toMatch(/no DSC alert sent/i);
    expect(feedback.textContent).not.toMatch(/should be/i);
  });
});
