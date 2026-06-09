// E2E coverage is intentionally skipped: headless browsers do not produce
// reliable speechSynthesis voices. These unit tests cover the pure builder.
//
// A materialized template now carries only spoken-radio chips (the DSC/equipment
// phase is owned by the panel, see ADR 0002), so every item is spoken — there is
// no procedure/decoy filtering left to test.

import { describe, expect, test } from "vite-plus/test";
import { buildSpokenTransmission } from "./spoken-script.ts";
import type { SequenceItem, SequenceTemplate } from "./types.ts";

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
