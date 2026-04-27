import { act, fireEvent, render, screen } from "@testing-library/react";
import type { RubricDefinition, ScoreBreakdown } from "@gmdss-simulator/utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { DrillResult } from "../drills/drill-types.ts";
import type {
  ScriptDrillContent,
  SequenceTemplate,
  SituationalPrompt,
} from "../drills/scripts/types.ts";
import { setMatchMedia, setUserAgent } from "../test-utils.ts";
import { GradeBreakdown } from "./GradeBreakdown.tsx";
import { InstallChip } from "./InstallChip.tsx";
import { MicButton } from "./MicButton.tsx";
import { ModeTabs } from "./ModeTabs.tsx";
import { PhoneticCheatsheet } from "./PhoneticCheatsheet.tsx";
import { ProceduresHome } from "./ProceduresHome.tsx";
import { ResultBadge } from "./ResultBadge.tsx";
import { SequenceCard } from "./SequenceCard.tsx";
import { SessionConfig } from "./SessionConfig.tsx";
import { SessionResults } from "./SessionResults.tsx";
import { SituationalCard } from "./SituationalCard.tsx";

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

const SAMPLE_RUBRIC: RubricDefinition = {
  id: "v1/distress",
  version: "1.0.0",
  category: "distress",
  requiredFields: [
    { id: "mayday", label: "MAYDAY signal word", patterns: ["MAYDAY"], required: true },
    { id: "this_is", label: "THIS IS", patterns: ["THIS\\s+IS"], required: true },
    { id: "vessel_name", label: "Own vessel name", patterns: ["BLUE\\s*DUCK"], required: true },
    { id: "position", label: "Position", patterns: ["POSITION"], required: true },
    { id: "nature", label: "Nature of distress", patterns: ["FIRE"], required: true },
  ],
  prowordRules: [
    { id: "mayday", label: "MAYDAY x4", pattern: "MAYDAY", expectedCount: 4 },
    { id: "over", label: "OVER", pattern: "\\bOVER\\b" },
  ],
  sequenceRules: {
    fieldOrder: ["mayday", "this_is", "vessel_name", "position", "nature", "over"],
  },
  channelRules: { requiredChannel: 16, blockChannel70Voice: true },
};

const SAMPLE_PROMPT: SituationalPrompt = {
  scenarioId: "2.1",
  rubricId: "v1/distress",
  title: "MAYDAY — Fire on Board",
  description: "Engine room fire.",
  task: "Send a DSC alert then voice MAYDAY.",
  vessel: { name: "BLUE DUCK", callsign: "5BCD2", personsOnBoard: 8 },
  hints: ["Press distress 5s", "Say MAYDAY 3 times"],
  canonical:
    "MAYDAY MAYDAY MAYDAY, THIS IS BLUE DUCK BLUE DUCK BLUE DUCK, POSITION 50N, FIRE, 8 PERSONS ON BOARD, OVER",
  requiredChannel: 16,
  category: "distress",
};

const SAMPLE_TEMPLATE: SequenceTemplate = {
  rubricId: "v1/distress",
  callLabel: "MAYDAY call",
  correctOrder: [
    { id: "mayday", label: "MAYDAY signal word" },
    { id: "this_is", label: "THIS IS" },
    { id: "vessel_name", label: "Own vessel name" },
    { id: "position", label: "Position" },
    { id: "nature", label: "Nature of distress" },
    { id: "over", label: "OVER" },
  ],
};

const SAMPLE_CONTENT: ScriptDrillContent = {
  structuralRubric: SAMPLE_RUBRIC,
  scenarios: [SAMPLE_PROMPT],
  rubricsByScenario: new Map([[SAMPLE_PROMPT.scenarioId, SAMPLE_RUBRIC]]),
};

describe("ProceduresHome", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("renders a tile for the structural drill and one per scenario", () => {
    render(
      <ProceduresHome
        content={SAMPLE_CONTENT}
        statsToken={0}
        onStartStructural={() => {}}
        onStartSituational={() => {}}
      />,
    );
    expect(screen.getByText(/order of fields/i)).toBeTruthy();
    expect(screen.getByText(SAMPLE_PROMPT.title)).toBeTruthy();
  });

  test("calls onStartStructural when the structural tile is clicked", () => {
    const onStart = vi.fn();
    render(
      <ProceduresHome
        content={SAMPLE_CONTENT}
        statsToken={0}
        onStartStructural={onStart}
        onStartSituational={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /structural drill/i }));
    expect(onStart).toHaveBeenCalled();
  });

  test("calls onStartSituational with the scenario id when the scenario tile is clicked", () => {
    const onStart = vi.fn();
    render(
      <ProceduresHome
        content={SAMPLE_CONTENT}
        statsToken={0}
        onStartStructural={() => {}}
        onStartSituational={onStart}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /situational drill: mayday/i }));
    expect(onStart).toHaveBeenCalledWith("2.1");
  });
});

describe("SequenceCard", () => {
  function poolItem(label: string): HTMLButtonElement {
    return screen.getByRole("button", { name: label }) as HTMLButtonElement;
  }
  function slot(index: number): HTMLButtonElement {
    const prefix = `Slot ${index},`;
    return screen.getByRole("button", {
      name: (accessible) => accessible.startsWith(prefix),
    }) as HTMLButtonElement;
  }
  function placeAll(template: SequenceTemplate, order: readonly string[]) {
    for (const id of order) {
      const item = template.correctOrder.find((c) => c.id === id)!;
      fireEvent.click(poolItem(item.label));
    }
  }

  test("tapping a pool item fills the first empty slot and removes it from the pool", () => {
    render(
      <SequenceCard
        template={SAMPLE_TEMPLATE}
        onComplete={() => {}}
        onRestart={() => {}}
        onBack={() => {}}
      />,
    );
    fireEvent.click(poolItem("Position"));
    expect(slot(1).textContent).toMatch(/Position/);
    expect(screen.queryByRole("button", { name: "Position" })).toBeNull();
  });

  test("tapping a filled slot returns the item to the pool", () => {
    render(
      <SequenceCard
        template={SAMPLE_TEMPLATE}
        onComplete={() => {}}
        onRestart={() => {}}
        onBack={() => {}}
      />,
    );
    fireEvent.click(poolItem("Position"));
    fireEvent.click(slot(1));
    expect(poolItem("Position")).toBeTruthy();
    expect(slot(1).textContent).not.toMatch(/Position/);
  });

  test("Submit is disabled until every slot has a placement", () => {
    render(
      <SequenceCard
        template={SAMPLE_TEMPLATE}
        onComplete={() => {}}
        onRestart={() => {}}
        onBack={() => {}}
      />,
    );
    const submit = screen.getByRole("button", { name: /^Submit$/ }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    placeAll(
      SAMPLE_TEMPLATE,
      SAMPLE_TEMPLATE.correctOrder.slice(0, -1).map((c) => c.id),
    );
    expect(submit.disabled).toBe(true);
    fireEvent.click(poolItem("OVER"));
    expect(submit.disabled).toBe(false);
  });

  test("submitting in correct order grades pass and paints all slots correct", () => {
    const onComplete = vi.fn();
    render(
      <SequenceCard
        template={SAMPLE_TEMPLATE}
        onComplete={onComplete}
        onRestart={() => {}}
        onBack={() => {}}
      />,
    );
    placeAll(
      SAMPLE_TEMPLATE,
      SAMPLE_TEMPLATE.correctOrder.map((c) => c.id),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Submit$/ }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![0]).toMatchObject({
      passed: true,
      correctCount: SAMPLE_TEMPLATE.correctOrder.length,
    });
    expect(screen.getByText(/perfect order/i)).toBeTruthy();
  });

  test("submitting a wrong order surfaces 'should be:' for each misplaced slot", () => {
    const onComplete = vi.fn();
    render(
      <SequenceCard
        template={SAMPLE_TEMPLATE}
        onComplete={onComplete}
        onRestart={() => {}}
        onBack={() => {}}
      />,
    );
    // Swap slots 1 and 2: place THIS IS first, then MAYDAY, then the rest in order.
    const swapped = ["this_is", "mayday", "vessel_name", "position", "nature", "over"];
    placeAll(SAMPLE_TEMPLATE, swapped);
    fireEvent.click(screen.getByRole("button", { name: /^Submit$/ }));
    expect(onComplete.mock.calls[0]![0]).toMatchObject({
      passed: false,
      correctCount: SAMPLE_TEMPLATE.correctOrder.length - 2,
    });
    expect(screen.getAllByText(/should be:/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/should be: MAYDAY signal word/i)).toBeTruthy();
  });

  test("Try again calls onRestart so the parent can remount with a fresh shuffle", () => {
    const onRestart = vi.fn();
    render(
      <SequenceCard
        template={SAMPLE_TEMPLATE}
        onComplete={() => {}}
        onRestart={onRestart}
        onBack={() => {}}
      />,
    );
    placeAll(
      SAMPLE_TEMPLATE,
      SAMPLE_TEMPLATE.correctOrder.map((c) => c.id),
    );
    fireEvent.click(screen.getByRole("button", { name: /^Submit$/ }));
    fireEvent.click(screen.getByRole("button", { name: /drill again|try again/i }));
    expect(onRestart).toHaveBeenCalled();
  });
});

describe("GradeBreakdown", () => {
  test("renders the overall score and one row per dimension", () => {
    const breakdown: ScoreBreakdown = {
      overall: 73,
      rubricVersion: "1.0.0",
      timestamp: 0,
      dimensions: [
        {
          id: "required_fields",
          label: "Required Fields",
          weight: 0.35,
          score: 80,
          maxScore: 100,
          matchedItems: ["MAYDAY"],
          missingItems: ["Position"],
        },
        {
          id: "sequence",
          label: "Sequence",
          weight: 0.25,
          score: 100,
          maxScore: 100,
          matchedItems: [],
          missingItems: [],
        },
      ],
    };
    render(<GradeBreakdown breakdown={breakdown} />);
    expect(screen.getByLabelText(/overall score 73/i)).toBeTruthy();
    expect(screen.getByText(/required fields/i)).toBeTruthy();
    expect(screen.getByText(/missed: position/i)).toBeTruthy();
  });
});

describe("SituationalCard", () => {
  test("disables Submit until text is entered, then grades and shows the breakdown", () => {
    render(
      <SituationalCard
        prompt={SAMPLE_PROMPT}
        rubric={SAMPLE_RUBRIC}
        onComplete={() => {}}
        onRestart={() => {}}
        onBack={() => {}}
      />,
    );
    const submit = screen.getByRole("button", { name: "Submit" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    const textarea = screen.getByLabelText(/your transmission/i);
    fireEvent.change(textarea, { target: { value: SAMPLE_PROMPT.canonical } });
    expect(submit.disabled).toBe(false);

    fireEvent.click(submit);
    expect(screen.getByText(/required fields/i)).toBeTruthy();
  });

  test("Reveal canonical shows the canonical script and warns the attempt won't be recorded", () => {
    render(
      <SituationalCard
        prompt={SAMPLE_PROMPT}
        rubric={SAMPLE_RUBRIC}
        onComplete={() => {}}
        onRestart={() => {}}
        onBack={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /reveal canonical/i }));
    expect(screen.getByLabelText(/canonical script/i)).toBeTruthy();
    expect(screen.getByText(/won't be recorded/i)).toBeTruthy();
  });

  test("does not call onComplete when grading after reveal", () => {
    const onComplete = vi.fn();
    render(
      <SituationalCard
        prompt={SAMPLE_PROMPT}
        rubric={SAMPLE_RUBRIC}
        onComplete={onComplete}
        onRestart={() => {}}
        onBack={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /reveal canonical/i }));
    fireEvent.change(screen.getByLabelText(/your transmission/i), {
      target: { value: "MAYDAY" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("revealing then hiding the canonical still suppresses recording (latched)", () => {
    const onComplete = vi.fn();
    render(
      <SituationalCard
        prompt={SAMPLE_PROMPT}
        rubric={SAMPLE_RUBRIC}
        onComplete={onComplete}
        onRestart={() => {}}
        onBack={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /reveal canonical/i }));
    fireEvent.click(screen.getByRole("button", { name: /hide canonical/i }));
    expect(screen.getByText(/won't be recorded/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/your transmission/i), {
      target: { value: SAMPLE_PROMPT.canonical },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onComplete).not.toHaveBeenCalled();
  });
});
