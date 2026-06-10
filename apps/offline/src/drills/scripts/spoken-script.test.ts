// E2E coverage is intentionally skipped: headless browsers do not produce
// reliable speechSynthesis voices. These unit tests cover the pure builder.
//
// A materialized template now carries only spoken-radio chips (the DSC/equipment
// phase is owned by the panel, see ADR 0002), so every item is spoken — there is
// no procedure/decoy filtering left to test.

import type { RubricDefinition } from "@gmdss-simulator/utils";
import { describe, expect, test } from "vite-plus/test";
import { gradeScenario } from "./grade.ts";
import { materializeScenario } from "./materialize.ts";
import { buildSpokenTransmission } from "./spoken-script.ts";
import type { RubricsById, Scenario, SequenceItem, SequenceTemplate } from "./types.ts";

// The single source of truth for content is apps/frontend (the offline copy is a
// gitignored build mirror), so these regression cases read the authored rubric
// directly — the same tree the offline vite build copies from. import.meta.glob
// resolves the JSON at build time, so no node:fs (and no @types/node) is needed.
const RUBRIC_MODULES = import.meta.glob<RubricDefinition>(
  "../../../../frontend/public/content/en/rubrics/v1/{distress,distress-mob,urgency,safety}.json",
  { eager: true, import: "default" },
);

function loadRubric(file: string): RubricDefinition {
  const entry = Object.entries(RUBRIC_MODULES).find(([path]) => path.endsWith(`/${file}`));
  if (!entry) throw new Error(`rubric ${file} not found in content glob`);
  return entry[1];
}

function template(
  parts: readonly { readonly id: string; readonly items: readonly SequenceItem[] }[],
): SequenceTemplate {
  return {
    rubricId: "test",
    callLabel: "Test",
    priorityId: "mayday",
    parts: parts.map((p) => ({ id: p.id, label: p.id, items: p.items })),
    pool: [],
  };
}

describe("buildSpokenTransmission", () => {
  test("joins every voice chip with commas, keeping adjacent repeats (MAYDAY ×3, vessel ×3)", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "mayday", label: "MAYDAY" },
          { id: "mayday", label: "MAYDAY" },
          { id: "mayday", label: "MAYDAY" },
          { id: "vessel", label: "Blue Duck" },
          { id: "vessel", label: "Blue Duck" },
          { id: "vessel", label: "Blue Duck" },
          { id: "callsign", label: "5BCD2" },
          { id: "mayday", label: "MAYDAY" },
          { id: "vessel", label: "Blue Duck" },
          { id: "position", label: "Bay" },
          { id: "nature", label: "On fire" },
          { id: "assistance", label: "I require immediate assistance" },
          { id: "persons", label: "6 persons on board" },
          { id: "over", label: "OVER" },
        ],
      },
    ]);
    const out = buildSpokenTransmission(t);
    expect(out).toContain("MAYDAY, MAYDAY, MAYDAY, Blue Duck, Blue Duck, Blue Duck, 5BCD2, MAYDAY");
    expect(out.endsWith(", OVER")).toBe(true);
  });

  test("two-phase call: phases joined with '. '", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "addressee", label: "RCC Haifa" },
          { id: "this_is", label: "THIS IS" },
          { id: "vessel", label: "Grey Whale" },
          { id: "medico", label: "MEDICO / Need medical advice" },
          { id: "over", label: "OVER" },
        ],
      },
      {
        id: "medical_message",
        items: [
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "addressee", label: "RCC Haifa" },
          { id: "this_is", label: "THIS IS" },
          { id: "vessel", label: "Grey Whale" },
          { id: "patient_vitals", label: "Male, age 52, BP 160/100" },
          { id: "patient_status", label: "Severe chest pain" },
          { id: "over", label: "OVER" },
        ],
      },
    ]);
    const out = buildSpokenTransmission(t);
    expect(out).toContain(". ");
    const [phase1, phase2] = out.split(". ");
    expect(phase1!).toContain("PAN-PAN, PAN-PAN, PAN-PAN");
    expect(phase2!).toContain("PAN-PAN, PAN-PAN, PAN-PAN");
    expect(phase2!).toContain("Severe chest pain");
  });

  test("MAYDAY RELAY: relay structure is spoken in order with QUOTE/UNQUOTE markers", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "mayday_relay", label: "MAYDAY RELAY" },
          { id: "mayday_relay", label: "MAYDAY RELAY" },
          { id: "mayday_relay", label: "MAYDAY RELAY" },
          { id: "addressee", label: "All Stations" },
          { id: "this_is", label: "THIS IS" },
          { id: "vessel", label: "Vered" },
          { id: "following_received", label: "FOLLOWING RECEIVED FROM" },
          { id: "relayed_vessel", label: "Yacht Tami" },
          { id: "quote_marker", label: "QUOTE" },
          { id: "mayday", label: "MAYDAY" },
          { id: "relayed_vessel", label: "Yacht Tami" },
          { id: "relayed_nature", label: "Fire on board in danger of sinking" },
          { id: "unquote_marker", label: "UNQUOTE" },
          { id: "over", label: "OVER" },
        ],
      },
    ]);
    const out = buildSpokenTransmission(t);
    expect(out.match(/MAYDAY RELAY/g)).toHaveLength(3);
    expect(out).toContain("All Stations");
    expect(out).toContain("FOLLOWING RECEIVED FROM");
    expect(out).toContain("QUOTE");
    expect(out).toContain("UNQUOTE");
    // Relayed vessel name appears twice (header + quoted block).
    expect(out.match(/Yacht Tami/g)).toHaveLength(2);
    expect(out.endsWith(", OVER")).toBe(true);
  });

  test("position normalization: degrees / minutes / cardinal words", () => {
    const t = template([
      {
        id: "procedure",
        items: [{ id: "position", label: "32°05'N 034°45'E" }],
      },
    ]);
    const out = buildSpokenTransmission(t);
    expect(out).toContain("degrees");
    expect(out).toContain("minutes");
    expect(out).toContain("north");
    expect(out).toContain("east");
    expect(out).not.toMatch(/°/);
    expect(out).not.toMatch(/'/);
  });

  test("position normalization is scoped to id='position'; other labels keep punctuation", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "vessel", label: "O'Brien" },
          { id: "nature", label: "10°C drop" },
        ],
      },
    ]);
    const out = buildSpokenTransmission(t);
    expect(out).toContain("O'Brien");
    expect(out).toContain("10°C drop");
  });

  test("SART: sart_addressee ×3 reads as three comma-joined repetitions", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "mayday", label: "MAYDAY" },
          { id: "sart_addressee", label: "Ship who received my Radar SART" },
          { id: "sart_addressee", label: "Ship who received my Radar SART" },
          { id: "sart_addressee", label: "Ship who received my Radar SART" },
        ],
      },
    ]);
    const out = buildSpokenTransmission(t);
    expect(out).toBe(
      "MAYDAY, Ship who received my Radar SART, Ship who received my Radar SART, Ship who received my Radar SART",
    );
  });

  test("empty parts array returns empty string", () => {
    expect(buildSpokenTransmission(template([]))).toBe("");
  });

  test("an empty part contributes nothing (no leading '. ' artefact)", () => {
    const t = template([
      { id: "empty_phase", items: [] },
      { id: "voice", items: [{ id: "mayday", label: "MAYDAY" }] },
    ]);
    expect(buildSpokenTransmission(t)).toBe("MAYDAY");
  });
});

// The book (and ITU) put a single THIS IS in the call; the message header reads
// "MAYDAY <vessel>". A second THIS IS in the header would be marked down in the
// SRC exam, so guard the real distress rubrics against drifting back to it
// (#108, ADR-0003) by reading the authored content rather than a fixture.
describe("MAYDAY header is book-faithful in the real distress rubrics (#108)", () => {
  const cases = [
    {
      file: "distress.json",
      scenario: {
        id: "distress-fire-blue-duck",
        priority: "mayday",
        rubricId: "v1/distress",
        brief: "Engine room fire on MV Blue Duck.",
        facts: {
          vessel: "Blue Duck",
          callsign: "MMSI 211 239 680",
          position: "32°05'N 034°45'E",
          nature: "On fire, fire spreading",
          assistance: "I require immediate assistance",
          persons: "6 persons on board",
        },
      } satisfies Scenario,
    },
    {
      file: "distress-mob.json",
      scenario: {
        id: "distress-mob-tabor",
        priority: "mayday",
        rubricId: "v1/distress-mob",
        brief: "Man overboard from Tabor.",
        facts: {
          vessel: "Tabor",
          callsign: "MMSI 428 000 666",
          position: "36°24'N 025°28'E",
          nature: "Man overboard — male, age 35",
          assistance: "I require immediate assistance",
          persons: "9 persons on board",
        },
      } satisfies Scenario,
    },
  ];

  for (const { file, scenario } of cases) {
    const rubricId = scenario.rubricId;

    test(`${rubricId}: spoken call carries exactly one THIS IS`, () => {
      const rubrics: RubricsById = { [rubricId]: loadRubric(file) };
      const spoken = buildSpokenTransmission(materializeScenario(scenario, rubrics));
      expect(spoken.match(/THIS IS/g)).toHaveLength(1);
    });

    test(`${rubricId}: message header runs "MAYDAY <vessel> <position>" with no second THIS IS`, () => {
      const rubrics: RubricsById = { [rubricId]: loadRubric(file) };
      const items = materializeScenario(scenario, rubrics).parts.flatMap((p) => p.items);
      expect(items.filter((i) => i.id === "this_is")).toHaveLength(1);
      // The header follows the callsign: MAYDAY, <vessel>, <position> — never a this_is.
      const ids = items.map((i) => i.id);
      const callsignIndex = ids.indexOf("callsign");
      expect(callsignIndex).not.toBe(-1);
      const headerStart = callsignIndex + 1;
      expect(ids.slice(headerStart, headerStart + 3)).toEqual(["mayday", "vessel", "position"]);
    });

    test(`${rubricId}: a correct ordering of the corrected sequence still passes`, () => {
      const rubrics: RubricsById = { [rubricId]: loadRubric(file) };
      const tpl = materializeScenario(scenario, rubrics);
      const placements = new Map(tpl.parts.map((p) => [p.id, [...p.items]]));
      const grade = gradeScenario(tpl, placements);
      expect(grade.passed).toBe(true);
      expect(grade.dimensions.every((d) => d.status === "pass")).toBe(true);
    });
  }
});

// The book requires PAN PAN and SECURITE broadcasts to address ALL STATIONS ×3
// right after the signal word, before THIS IS. Guard the real urgency/safety
// rubrics + the five plain Scenarios (#109, ADR-0003) against dropping it again.
describe("PAN PAN / SECURITE carry the ALL STATIONS addressee in the real rubrics (#109)", () => {
  const cases = [
    {
      file: "urgency.json",
      signal: "pan_pan",
      scenario: {
        id: "urgency-engine-failure-red-fox",
        priority: "pan_pan",
        rubricId: "v1/urgency",
        brief: "Engine failure on Red Fox, drifting toward a TSS.",
        facts: {
          vessel: "Red Fox",
          callsign: "MMSI 211 888 040",
          position: "32°15'N 034°40'E",
          nature: "Engine failure, drifting toward TSS",
          assistance: "I require a tow",
          addressee: "All Stations",
        },
      } satisfies Scenario,
    },
    {
      file: "safety.json",
      signal: "securite",
      scenario: {
        id: "safety-container-cape-runner",
        priority: "securite",
        rubricId: "v1/safety",
        brief: "Floating container reported by Cape Runner.",
        facts: {
          vessel: "Cape Runner",
          position: "32°20'N 034°50'E, drifting south",
          nature: "Floating container, hazard to navigation",
          addressee: "All Stations",
        },
      } satisfies Scenario,
    },
  ];

  for (const { file, signal, scenario } of cases) {
    const rubricId = scenario.rubricId;

    test(`${rubricId}: addressee ×3 sits between the signal word and THIS IS`, () => {
      const rubrics: RubricsById = { [rubricId]: loadRubric(file) };
      const ids = materializeScenario(scenario, rubrics).parts.flatMap((p) =>
        p.items.map((i) => i.id),
      );
      expect(ids.filter((id) => id === "addressee")).toHaveLength(3);
      // The three addressee chips immediately follow the three signal words.
      const signalEnd = ids.lastIndexOf(signal) + 1;
      expect(ids.slice(signalEnd, signalEnd + 4)).toEqual([
        "addressee",
        "addressee",
        "addressee",
        "this_is",
      ]);
    });

    test(`${rubricId}: the spoken call reads the addressee after the signal word`, () => {
      const rubrics: RubricsById = { [rubricId]: loadRubric(file) };
      const spoken = buildSpokenTransmission(materializeScenario(scenario, rubrics));
      expect(spoken).toContain("All Stations, All Stations, All Stations");
    });

    test(`${rubricId}: a correct ordering passes and the addressee scores in the body dimension`, () => {
      const rubrics: RubricsById = { [rubricId]: loadRubric(file) };
      const tpl = materializeScenario(scenario, rubrics);
      const placements = new Map(tpl.parts.map((p) => [p.id, [...p.items]]));
      const grade = gradeScenario(tpl, placements);
      expect(grade.passed).toBe(true);
      expect(grade.dimensions.every((d) => d.status === "pass")).toBe(true);
      // The addressee folds into "body" (not "priority"), so the three chips
      // lift the body total — never the priority dimension.
      const priority = grade.dimensions.find((d) => d.id === "priority")!;
      expect(priority.total).toBe(3); // the signal word ×3 only — no addressee bleed
    });
  }
});
