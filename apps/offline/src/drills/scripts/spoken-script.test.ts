// E2E coverage is intentionally skipped: headless browsers do not produce
// reliable speechSynthesis voices. These unit tests cover the pure builder.

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
  test("distress single-phase: voice items only, no DSC, MAYDAY ×4 kept", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "epirb_on", label: "Turn on EPIRB" },
          { id: "dsc_channel70", label: "DSC: Channel 70, High 25W" },
          { id: "dsc_time_location", label: "DSC: confirm time and location" },
          { id: "nature_fire", label: "DSC: Fire & Explosion" },
          { id: "dsc_button", label: "DSC: press distress button 5 sec" },
          { id: "dsc_channel16", label: "Radio: Channel 16, High" },
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
    expect(out).not.toMatch(/DSC/);
    expect(out).not.toMatch(/EPIRB/);
    expect(out).toContain("MAYDAY, MAYDAY, MAYDAY, Blue Duck, Blue Duck, Blue Duck, 5BCD2, MAYDAY");
    expect(out.endsWith(", OVER")).toBe(true);
  });

  test("returns empty string when every item is procedural", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "epirb_on", label: "Turn on EPIRB" },
          { id: "dsc_channel70", label: "DSC: Channel 70" },
          { id: "dsc_button", label: "DSC: press distress button" },
        ],
      },
    ]);
    expect(buildSpokenTransmission(t)).toBe("");
  });

  test("two-phase MEDICO: phases joined with '. ', working_channel_switch dropped", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "dsc_channel70", label: "DSC: Channel 70" },
          { id: "dsc_send_urgency", label: "DSC: send urgency alert" },
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "addressee", label: "RCC Haifa" },
          { id: "this_is", label: "THIS IS" },
          { id: "vessel", label: "Grey Whale" },
          { id: "callsign", label: "MMSI 211 555 200" },
          { id: "medico", label: "MEDICO / Need medical advice" },
          { id: "over", label: "OVER" },
        ],
      },
      {
        id: "medical_message",
        items: [
          { id: "working_channel_switch", label: "Switch to working channel (e.g., Ch 24)" },
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "pan_pan", label: "PAN-PAN" },
          { id: "addressee", label: "RCC Haifa" },
          { id: "this_is", label: "THIS IS" },
          { id: "vessel", label: "Grey Whale" },
          { id: "patient_vitals", label: "Male, age 52, BP 160/100" },
          { id: "patient_status", label: "Severe chest pain" },
          { id: "actions_taken", label: "Aspirin administered" },
          { id: "over", label: "OVER" },
        ],
      },
    ]);
    const out = buildSpokenTransmission(t);
    expect(out).toContain(". ");
    const [phase1, phase2] = out.split(". ");
    expect(phase1).toContain("PAN-PAN, PAN-PAN, PAN-PAN");
    expect(phase2).toContain("PAN-PAN, PAN-PAN, PAN-PAN");
    expect(out).not.toContain("Switch to working channel");
    expect(out).not.toContain("DSC");
  });

  test("requiresAbandon scenario: in_raft is filtered out", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "mayday", label: "MAYDAY" },
          { id: "vessel", label: "River Hawk" },
          { id: "in_raft", label: "In raft: EPIRB, SART, portable VHF" },
        ],
      },
    ]);
    const out = buildSpokenTransmission(t);
    expect(out).toBe("MAYDAY, River Hawk");
    expect(out).not.toContain("raft");
  });

  test("requiresSpareAntenna scenario: antenna_spare is filtered out", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "epirb_on", label: "Turn on EPIRB" },
          { id: "antenna_spare", label: "Rig spare antenna (coax cable)" },
          { id: "mayday", label: "MAYDAY" },
          { id: "vessel", label: "Wandering Albatross" },
        ],
      },
    ]);
    const out = buildSpokenTransmission(t);
    expect(out).toBe("MAYDAY, Wandering Albatross");
    expect(out).not.toContain("antenna");
    expect(out).not.toContain("EPIRB");
  });

  test("misplaced channel-power decoy chip is filtered out of the transcript", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "decoy_dsc_ch72_25w", label: "DSC: Channel 72, High 25W" },
          { id: "mayday", label: "MAYDAY" },
          { id: "vessel", label: "Blue Duck" },
        ],
      },
    ]);
    const out = buildSpokenTransmission(t);
    expect(out).toBe("MAYDAY, Blue Duck");
    expect(out).not.toContain("Channel");
    expect(out).not.toContain("decoy");
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

  test("materialized dsc_nature → nature_<code> chip is filtered out", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "nature_fire", label: "DSC: Fire & Explosion" },
          { id: "mayday", label: "MAYDAY" },
        ],
      },
    ]);
    expect(buildSpokenTransmission(t)).toBe("MAYDAY");
  });

  test("empty parts array returns empty string", () => {
    expect(buildSpokenTransmission(template([]))).toBe("");
  });

  test("unknown future dsc_xyz ids are filtered by the prefix rule", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "dsc_future_thing", label: "DSC: future" },
          { id: "mayday", label: "MAYDAY" },
        ],
      },
    ]);
    expect(buildSpokenTransmission(t)).toBe("MAYDAY");
  });

  test("part with only procedural items is skipped (no leading '. ' artefact)", () => {
    const t = template([
      {
        id: "procedure",
        items: [
          { id: "epirb_on", label: "Turn on EPIRB" },
          { id: "dsc_channel70", label: "DSC" },
        ],
      },
      {
        id: "voice",
        items: [{ id: "mayday", label: "MAYDAY" }],
      },
    ]);
    expect(buildSpokenTransmission(t)).toBe("MAYDAY");
  });
});
