import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { DrillResult } from "../drills/drill-types.ts";
import type { Scenario, SequenceTemplate } from "../drills/scripts/types.ts";
import { setMatchMedia, setUserAgent } from "../test-utils.ts";
import { InstallChip } from "./InstallChip.tsx";
import { MicButton } from "./MicButton.tsx";
import { ModeTabs } from "./ModeTabs.tsx";
import { PhoneticCheatsheet } from "./PhoneticCheatsheet.tsx";
import { ProceduresHome } from "./ProceduresHome.tsx";
import { ResultBadge } from "./ResultBadge.tsx";
import { SequenceCard } from "./SequenceCard.tsx";
import { SessionConfig } from "./SessionConfig.tsx";
import { SessionResults } from "./SessionResults.tsx";

describe("ModeTabs", () => {
  test("marks the active mode as selected", () => {
    render(<ModeTabs mode="phonetic" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: "Callsigns" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("tab", { name: "Numbers" }).getAttribute("aria-selected")).toBe(
      "false",
    );
  });

  test("calls onChange with the new mode when a tab is clicked", () => {
    const onChange = vi.fn();
    render(<ModeTabs mode="phonetic" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Listen" }));
    expect(onChange).toHaveBeenCalledWith("reverse");
  });
});

describe("SessionConfig", () => {
  test("highlights the active count and starts when clicked", () => {
    const onCountChange = vi.fn();
    const onStart = vi.fn();
    render(<SessionConfig count={10} onCountChange={onCountChange} onStart={onStart} />);

    expect(screen.getByRole("button", { name: "10" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "20" }));
    expect(onCountChange).toHaveBeenCalledWith(20);
    fireEvent.click(screen.getByRole("button", { name: /^begin/i }));
    expect(onStart).toHaveBeenCalled();
  });
});

describe("ResultBadge", () => {
  function build(score: number, missed: string[] = []): DrillResult {
    return {
      challenge: { id: "t", type: "phonetic", prompt: "p", expectedAnswer: "ALFA" },
      studentAnswer: "x",
      score,
      matchedWords: [],
      missedWords: missed,
    };
  }

  test("shows correct state for a perfect score", () => {
    render(<ResultBadge result={build(100)} correctAnswer="ALFA" />);
    const row = screen.getByRole("status");
    expect(row.getAttribute("data-state")).toBe("correct");
  });

  test("shows partial state for a mid-range score", () => {
    render(<ResultBadge result={build(60, ["X"])} correctAnswer="ALFA" />);
    const row = screen.getByRole("status");
    expect(row.getAttribute("data-state")).toBe("partial");
    expect(screen.getByText(/missed: x/i)).toBeTruthy();
  });

  test("shows wrong state for a low score", () => {
    render(<ResultBadge result={build(0, ["ALFA"])} correctAnswer="ALFA" />);
    const row = screen.getByRole("status");
    expect(row.getAttribute("data-state")).toBe("wrong");
  });
});

describe("SessionResults", () => {
  test("renders an average score and a perfect-count summary", () => {
    const results: DrillResult[] = [
      {
        challenge: { id: "1", type: "phonetic", prompt: "p", expectedAnswer: "A" },
        studentAnswer: "ALFA",
        score: 100,
        matchedWords: ["ALFA"],
        missedWords: [],
      },
      {
        challenge: { id: "2", type: "phonetic", prompt: "p", expectedAnswer: "B" },
        studentAnswer: "x",
        score: 0,
        matchedWords: [],
        missedWords: ["BRAVO"],
      },
    ];
    const { container } = render(<SessionResults results={results} onRestart={() => {}} />);
    expect(screen.getByText(/logbook entry/i)).toBeTruthy();
    expect(screen.getByLabelText(/average score 50/i)).toBeTruthy();
    const detail = container.querySelector(".summary-detail");
    expect(detail?.textContent).toMatch(/1\s+perfect/);
    expect(detail?.textContent).toMatch(/over\s+2/);
  });

  test("handles an empty result list", () => {
    render(<SessionResults results={[]} onRestart={() => {}} />);
    expect(screen.getByLabelText(/average score 0/i)).toBeTruthy();
  });

  test("calls onRestart when the button is clicked", () => {
    const onRestart = vi.fn();
    render(<SessionResults results={[]} onRestart={onRestart} />);
    fireEvent.click(screen.getByRole("button", { name: /begin a new watch/i }));
    expect(onRestart).toHaveBeenCalled();
  });
});

describe("MicButton", () => {
  interface FakeRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((e: { results: { length: number; item: (i: number) => unknown } }) => void) | null;
    onerror: ((e: { error: string }) => void) | null;
    onend: (() => void) | null;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
  }

  let lastInstance: FakeRecognition | null = null;
  const captureInstance = (inst: FakeRecognition) => {
    lastInstance = inst;
  };

  class FakeRecognitionCtor implements FakeRecognition {
    continuous = false;
    interimResults = false;
    lang = "";
    onresult: FakeRecognition["onresult"] = null;
    onerror: FakeRecognition["onerror"] = null;
    onend: FakeRecognition["onend"] = null;
    start = vi.fn();
    stop = vi.fn();
    abort = vi.fn();
    constructor() {
      captureInstance(this);
    }
  }

  beforeEach(() => {
    lastInstance = null;
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders nothing when SpeechRecognition is unavailable", () => {
    const { container } = render(<MicButton onTranscript={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders disabled with the offline tooltip when navigator is offline", () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognitionCtor);
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
    render(<MicButton onTranscript={() => {}} />);
    const btn = screen.getByRole("button", {
      name: /voice input needs an internet connection/i,
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  test("clicking starts recognition; result event triggers normalised onTranscript", () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognitionCtor);
    const onTranscript = vi.fn();
    render(<MicButton onTranscript={onTranscript} />);

    fireEvent.click(screen.getByRole("button", { name: /start voice dictation/i }));
    expect(lastInstance).not.toBeNull();
    expect(lastInstance!.start).toHaveBeenCalled();

    act(() => {
      lastInstance!.onresult!({
        results: {
          length: 1,
          item: () => ({
            isFinal: true,
            length: 1,
            item: () => ({ transcript: "ate niner" }),
          }),
        },
      });
    });

    expect(onTranscript).toHaveBeenCalledWith("EIGHT NINE");
  });

  test("permission-denied error transitions the button to a blocked state", () => {
    vi.stubGlobal("SpeechRecognition", FakeRecognitionCtor);
    render(<MicButton onTranscript={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /start voice dictation/i }));
    act(() => lastInstance!.onerror!({ error: "not-allowed" }));

    const blocked = screen.getByRole("button", {
      name: /microphone access blocked/i,
    }) as HTMLButtonElement;
    expect(blocked.disabled).toBe(true);
  });
});

describe("InstallChip", () => {
  beforeEach(() => {
    setUserAgent("Mozilla/5.0 (X11; Linux x86_64) Chrome/120");
    setMatchMedia(false);
    window.localStorage.removeItem("roc-trainer:install-dismissed");
  });

  test("renders nothing when no install path is available", () => {
    const { container } = render(<InstallChip />);
    expect(container.firstChild).toBeNull();
  });

  test("renders chip and triggers the prompt on click when the event has fired", async () => {
    const promptFn = vi.fn(() => Promise.resolve());
    const ev = new Event("beforeinstallprompt") as Event & {
      prompt: typeof promptFn;
      userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
    };
    ev.prompt = promptFn;
    ev.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });

    render(<InstallChip />);
    act(() => {
      window.dispatchEvent(ev);
    });

    const button = screen.getByRole("button", { name: /install app/i });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(promptFn).toHaveBeenCalled();
  });

  test("dismiss button hides the chip and persists the choice", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17.0 Mobile/15E148 Safari",
    );
    const { container, rerender } = render(<InstallChip />);
    expect(container.firstChild).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(container.firstChild).toBeNull();

    rerender(<InstallChip />);
    expect(container.firstChild).toBeNull();
  });

  test("iOS path opens an instruction dialog instead of calling prompt()", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17.0 Mobile/15E148 Safari",
    );
    render(<InstallChip />);
    fireEvent.click(screen.getByRole("button", { name: /install app/i }));
    expect(screen.getByRole("dialog", { name: /add to home screen/i })).toBeTruthy();
  });
});

describe("PhoneticCheatsheet", () => {
  test("renders all 26 letters and 10 digits with their phonetic words", () => {
    render(<PhoneticCheatsheet />);
    expect(screen.getByText(/phonetic alphabet/i)).toBeTruthy();
    expect(screen.getByText("ALFA")).toBeTruthy();
    expect(screen.getByText("ZULU")).toBeTruthy();
    expect(screen.getByText("NIN-ER")).toBeTruthy();
    expect(screen.getByText("FIFE")).toBeTruthy();
    expect(screen.getByText("AIT")).toBeTruthy();
  });
});

const SAMPLE_TEMPLATE: SequenceTemplate = {
  rubricId: "v1/distress",
  callLabel: "MAYDAY procedure",
  priorityId: "mayday",
  parts: [
    {
      id: "procedure",
      label: "MAYDAY procedure",
      items: [
        { id: "mayday", label: "MAYDAY" },
        { id: "mayday", label: "MAYDAY" },
        { id: "vessel", label: "Blue Duck" },
        { id: "callsign", label: "5BCD2" },
        { id: "over", label: "OVER" },
      ],
    },
  ],
  pool: [
    { id: "mayday", label: "MAYDAY" },
    { id: "mayday", label: "MAYDAY" },
    { id: "vessel", label: "Blue Duck" },
    { id: "callsign", label: "5BCD2" },
    { id: "over", label: "OVER" },
    { id: "pan_pan", label: "PAN-PAN" },
    { id: "pan_pan", label: "PAN-PAN" },
    { id: "pan_pan", label: "PAN-PAN" },
    { id: "securite", label: "SECURITE" },
    { id: "securite", label: "SECURITE" },
    { id: "securite", label: "SECURITE" },
  ],
};

const SAMPLE_SCENARIO: Scenario = {
  id: "fire-blue-duck",
  priority: "mayday",
  rubricId: "v1/distress",
  brief: "Engine room fire on MV Blue Duck. 6 persons on board.",
  facts: {
    vessel: "Blue Duck",
    callsign: "5BCD2",
    position: "32°05'N 034°45'E",
    nature: "Engine room fire",
    assistance: "I require immediate assistance",
    persons: "6 persons on board",
  },
};

describe("ProceduresHome", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("renders the scenario reconstruction tile with the scenario count", () => {
    render(
      <ProceduresHome
        statsKey="v1/scenarios"
        statsToken={0}
        scenarioCount={9}
        onStart={() => {}}
      />,
    );
    expect(screen.getByText(/scenario reconstruction/i)).toBeTruthy();
    expect(screen.getByText(/9 scenarios/)).toBeTruthy();
  });

  test("calls onStart when the tile is clicked", () => {
    const onStart = vi.fn();
    render(
      <ProceduresHome statsKey="v1/scenarios" statsToken={0} scenarioCount={9} onStart={onStart} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /scenario reconstruction drill/i }));
    expect(onStart).toHaveBeenCalled();
  });

  test("aria-label announces 'no attempts yet' when stats are empty", () => {
    render(
      <ProceduresHome
        statsKey="v1/scenarios"
        statsToken={0}
        scenarioCount={9}
        onStart={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /no attempts yet/i })).toBeTruthy();
  });
});

describe("SequenceCard", () => {
  const ITEMS = SAMPLE_TEMPLATE.parts[0]!.items;
  const TOTAL = ITEMS.length;

  /** First pool button matching `label`. Throws if none. */
  function poolItem(label: string): HTMLButtonElement {
    const matches = screen.getAllByRole("button", { name: label });
    const btn = matches.find((el) => el.className.includes("seq-pool-item")) as
      | HTMLButtonElement
      | undefined;
    if (!btn) throw new Error(`No pool item with label "${label}"`);
    return btn;
  }
  function slot(index: number): HTMLButtonElement {
    const partLabel = SAMPLE_TEMPLATE.parts[0]!.label;
    const prefix = `${partLabel} slot ${index},`;
    return screen.getByRole("button", {
      name: (accessible) => accessible.startsWith(prefix),
    }) as HTMLButtonElement;
  }
  function placeInOrder() {
    for (const item of ITEMS) {
      fireEvent.click(poolItem(item.label));
    }
  }

  function renderCard(
    over: Partial<{
      onComplete: () => void;
      onRetry: () => void;
      onNewScenario: () => void;
      onBack: () => void;
    }> = {},
  ) {
    return render(
      <SequenceCard
        template={SAMPLE_TEMPLATE}
        scenario={SAMPLE_SCENARIO}
        onComplete={over.onComplete ?? (() => {})}
        onRetry={over.onRetry ?? (() => {})}
        onNewScenario={over.onNewScenario ?? (() => {})}
        onBack={over.onBack ?? (() => {})}
      />,
    );
  }

  test("renders the scenario brief above the slots", () => {
    renderCard();
    expect(screen.getByText(/engine room fire on mv blue duck/i)).toBeTruthy();
  });

  test("does not render the part header when there is only one part", () => {
    renderCard();
    expect(screen.queryByRole("heading", { name: /MAYDAY procedure/i })).toBeNull();
  });

  test("pool contains priority decoys for the wrong priorities", () => {
    renderCard();
    expect(
      screen
        .getAllByRole("button", { name: "PAN-PAN" })
        .filter((el) => el.className.includes("seq-pool-item")),
    ).toHaveLength(3);
    expect(
      screen
        .getAllByRole("button", { name: "SECURITE" })
        .filter((el) => el.className.includes("seq-pool-item")),
    ).toHaveLength(3);
  });

  test("tapping a pool item fills the first empty slot", () => {
    renderCard();
    fireEvent.click(poolItem("5BCD2"));
    expect(slot(1).textContent).toMatch(/5BCD2/);
  });

  test("tapping a filled slot returns the item to the pool", () => {
    renderCard();
    fireEvent.click(poolItem("5BCD2"));
    fireEvent.click(slot(1));
    expect(poolItem("5BCD2")).toBeTruthy();
    expect(slot(1).textContent).not.toMatch(/5BCD2/);
  });

  test("Submit is disabled until every slot is filled", () => {
    renderCard();
    const submit = screen.getByRole("button", { name: /^Submit$/ }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    for (let i = 0; i < TOTAL - 1; i++) {
      fireEvent.click(poolItem(ITEMS[i]!.label));
    }
    expect(submit.disabled).toBe(true);
    fireEvent.click(poolItem(ITEMS.at(-1)!.label));
    expect(submit.disabled).toBe(false);
  });

  test("submitting in correct order grades pass and shows the breakdown", () => {
    const onComplete = vi.fn();
    renderCard({ onComplete });
    placeInOrder();
    fireEvent.click(screen.getByRole("button", { name: /^Submit$/ }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![0]).toMatchObject({
      passed: true,
      correctCount: TOTAL,
      total: TOTAL,
    });
    expect(screen.getByText(/perfect call/i)).toBeTruthy();
    // Breakdown rows for the four dimensions present in the sample template.
    expect(screen.getByText(/^priority$/i)).toBeTruthy();
    expect(screen.getByText(/vessel identification/i)).toBeTruthy();
    expect(screen.getByText(/message body/i)).toBeTruthy();
    expect(screen.getByText(/^ending$/i)).toBeTruthy();
  });

  test("placing a wrong-priority chip in the opening slot triggers a partial score", () => {
    const onComplete = vi.fn();
    renderCard({ onComplete });
    // Expected: [mayday, mayday, vessel, callsign, over].
    // Swap the first opening with a PAN-PAN decoy → priority dimension partial.
    fireEvent.click(poolItem("PAN-PAN"));
    fireEvent.click(poolItem("MAYDAY"));
    fireEvent.click(poolItem("Blue Duck"));
    fireEvent.click(poolItem("5BCD2"));
    fireEvent.click(poolItem("OVER"));
    fireEvent.click(screen.getByRole("button", { name: /^Submit$/ }));
    expect(onComplete.mock.calls[0]![0].passed).toBe(false);
    expect(screen.getByText(/should be:/i)).toBeTruthy();
  });

  test("Try again calls onRetry; New scenario calls onNewScenario", () => {
    const onRetry = vi.fn();
    const onNewScenario = vi.fn();
    renderCard({ onRetry, onNewScenario });
    placeInOrder();
    fireEvent.click(screen.getByRole("button", { name: /^Submit$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Try again$/ }));
    expect(onRetry).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^New scenario$/ }));
    expect(onNewScenario).toHaveBeenCalled();
  });
});
