import { describe, expect, it } from "vite-plus/test";
import {
  buildMaydayScript,
  buildPanPanScript,
  buildSecuriteScript,
  buildMedicoScript,
} from "../src/script-builder.ts";

describe("Script Builder", () => {
  describe("buildMaydayScript", () => {
    it("generates a complete MAYDAY script", () => {
      const script = buildMaydayScript({
        vesselName: "Blue Duck",
        callsign: "5BCD2",
        mmsi: "211239680",
        position: "36°08'N 005°21'W",
        natureOfDistress: "on fire and require immediate assistance",
        assistanceRequired: "firefighting assistance and evacuation",
        personsOnBoard: 12,
      });

      expect(script).toContain("MAYDAY MAYDAY MAYDAY");
      expect(script).toContain("THIS IS");
      expect(script).toContain("BLUE DUCK BLUE DUCK BLUE DUCK");
      expect(script).toContain("Callsign 5BCD2");
      expect(script).toContain("MMSI 211239680");
      expect(script).toContain("My position is 36°08'N 005°21'W");
      expect(script).toContain("I am on fire");
      expect(script).toContain("I require firefighting");
      expect(script).toContain("12 persons on board");
      expect(script).toContain("OVER");
    });

    it("repeats vessel name three times", () => {
      const script = buildMaydayScript({
        vesselName: "Nordic Star",
        position: "50°00'N 001°00'W",
        natureOfDistress: "sinking",
        assistanceRequired: "immediate assistance",
        personsOnBoard: 5,
      });

      expect(script).toContain("NORDIC STAR NORDIC STAR NORDIC STAR");
    });

    it("omits callsign and MMSI when not provided", () => {
      const script = buildMaydayScript({
        vesselName: "Test Vessel",
        position: "50°00'N 001°00'W",
        natureOfDistress: "taking on water",
        assistanceRequired: "pumps and tow",
        personsOnBoard: 3,
      });

      expect(script).not.toContain("Callsign");
      expect(script).not.toContain("MMSI");
    });

    it("includes additional info when provided", () => {
      const script = buildMaydayScript({
        vesselName: "Test Vessel",
        position: "50°00'N 001°00'W",
        natureOfDistress: "fire in engine room",
        assistanceRequired: "immediate assistance",
        personsOnBoard: 4,
        additionalInfo: "Vessel is a white 30m motor yacht",
      });

      expect(script).toContain("white 30m motor yacht");
    });
  });

  describe("buildPanPanScript", () => {
    it("generates a PAN PAN script with three repetitions", () => {
      const script = buildPanPanScript({
        vesselName: "Sea Breeze",
        callsign: "ABCD",
        position: "51°30'N 002°00'W",
        natureOfUrgency: "Engine failure, drifting towards shipping lane",
        assistanceRequired: "tow to nearest port",
        personsOnBoard: 6,
      });

      expect(script).toContain("PAN PAN PAN PAN PAN PAN");
      expect(script).toContain("ALL STATIONS ALL STATIONS ALL STATIONS");
      expect(script).toContain("SEA BREEZE SEA BREEZE SEA BREEZE");
      expect(script).toContain("Engine failure");
      expect(script).toContain("OVER");
    });

    it("works without optional fields", () => {
      const script = buildPanPanScript({
        vesselName: "Test",
        position: "50°N 001°W",
        natureOfUrgency: "Steering failure",
      });

      expect(script).not.toContain("I require");
      expect(script).not.toContain("persons on board");
    });

    it("includes additional info when provided", () => {
      const script = buildPanPanScript({
        vesselName: "Test",
        position: "50°N 001°W",
        natureOfUrgency: "Engine failure",
        additionalInfo: "White sailing yacht 12m",
      });

      expect(script).toContain("White sailing yacht 12m");
    });
  });

  describe("buildSecuriteScript", () => {
    it("generates a SECURITE script", () => {
      const script = buildSecuriteScript({
        stationName: "Solent Coastguard",
        infoChannel: 67,
        natureOfSafety: "Navigational warning",
        details: "Unlit buoy reported adrift in position 50°42'N 001°18'W",
      });

      expect(script).toContain("SECURITE SECURITE SECURITE");
      expect(script).toContain("ALL STATIONS");
      expect(script).toContain("SOLENT COASTGUARD SOLENT COASTGUARD SOLENT COASTGUARD");
      expect(script).toContain("Channel 67");
      expect(script).toContain("Unlit buoy");
      expect(script).toContain("OUT");
      // SECURITE messages end with OUT, not OVER
      expect(script).not.toContain("OVER");
    });

    it("works without info channel", () => {
      const script = buildSecuriteScript({
        stationName: "Coast Radio",
        natureOfSafety: "Weather warning",
        details: "Gale force 8 expected within 12 hours",
      });

      expect(script).not.toContain("Channel");
    });
  });

  describe("buildMedicoScript", () => {
    it("generates a MEDICO script", () => {
      const script = buildMedicoScript({
        vesselName: "Pacific Trader",
        callsign: "ZXCV",
        mmsi: "503123456",
        position: "35°00'S 150°00'E",
        patientDetails: "Male crew member, age 45, chest pain and difficulty breathing",
        assistanceRequired: "medical advice and possible evacuation",
      });

      // MEDICO uses PAN PAN prefix
      expect(script).toContain("PAN PAN PAN PAN PAN PAN");
      expect(script).toContain("PACIFIC TRADER PACIFIC TRADER PACIFIC TRADER");
      expect(script).toContain("I require medical advice");
      expect(script).toContain("chest pain");
      expect(script).toContain("OVER");
    });

    it("defaults addressee to ALL STATIONS when not provided", () => {
      const script = buildMedicoScript({
        vesselName: "Test",
        position: "50°N 1°W",
        patientDetails: "Patient",
        assistanceRequired: "advice",
      });

      expect(script).toContain("ALL STATIONS ALL STATIONS ALL STATIONS");
    });

    it("uses a custom addressee when provided and uppercases it", () => {
      const script = buildMedicoScript({
        vesselName: "Grey Whale",
        position: "31°45'N 034°20'E",
        patientDetails: "Cardiac patient",
        assistanceRequired: "advice",
        addressee: "RCC Haifa",
      });

      expect(script).toContain("RCC HAIFA RCC HAIFA RCC HAIFA");
      expect(script).not.toContain("ALL STATIONS");
    });

    it("falls back to ALL STATIONS when addressee is whitespace", () => {
      const script = buildMedicoScript({
        vesselName: "Test",
        position: "50°N 1°W",
        patientDetails: "Patient",
        assistanceRequired: "advice",
        addressee: "   ",
      });

      expect(script).toContain("ALL STATIONS ALL STATIONS ALL STATIONS");
    });
  });

  describe("formatting", () => {
    it("uppercases vessel names", () => {
      const script = buildMaydayScript({
        vesselName: "little boat",
        position: "50°N 1°W",
        natureOfDistress: "sinking",
        assistanceRequired: "rescue",
        personsOnBoard: 2,
      });

      expect(script).toContain("LITTLE BOAT");
      expect(script).not.toContain("little boat");
    });

    it("uppercases callsigns", () => {
      const script = buildMaydayScript({
        vesselName: "Test",
        callsign: "abcd",
        position: "50°N 1°W",
        natureOfDistress: "fire",
        assistanceRequired: "help",
        personsOnBoard: 1,
      });

      expect(script).toContain("Callsign ABCD");
    });
  });
});
