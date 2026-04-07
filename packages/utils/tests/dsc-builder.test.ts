import { describe, expect, it } from "vite-plus/test";
import {
  buildDistressDsc,
  buildUrgencyDsc,
  buildSafetyDsc,
  buildRoutineDsc,
  buildDscMessage,
} from "../src/dsc-builder.ts";

describe("DSC Builder", () => {
  describe("buildDistressDsc", () => {
    it("builds a distress alert with all fields", () => {
      const msg = buildDistressDsc({
        mmsi: "211239680",
        nature: "fire",
        position: { lat: "36°08'N", lon: "005°21'W" },
        time: "1435",
      });

      expect(msg.category).toBe("distress");
      expect(msg.transmitChannel).toBe(70);
      expect(msg.switchToChannel).toBe(16);
      expect(
        msg.fields.some((f) => f.label === "Nature of distress" && f.value === "Fire / Explosion"),
      ).toBe(true);
      expect(msg.fields.some((f) => f.label === "Position")).toBe(true);
      expect(msg.fields.some((f) => f.label === "Time (UTC)" && f.value === "14:35 UTC")).toBe(
        true,
      );
      expect(msg.summary).toContain("Distress");
      expect(msg.summary).toContain("Fire");
    });

    it("builds a distress alert without optional fields", () => {
      const msg = buildDistressDsc({
        mmsi: "211239680",
        nature: "undesignated",
      });

      expect(msg.category).toBe("distress");
      expect(msg.fields.some((f) => f.label === "Position")).toBe(false);
      expect(
        msg.fields.some((f) => f.label === "Nature of distress" && f.value === "Undesignated"),
      ).toBe(true);
    });

    it("formats MMSI with spaces", () => {
      const msg = buildDistressDsc({ mmsi: "211239680", nature: "fire" });
      const mmsiField = msg.fields.find((f) => f.label === "Self-ID (MMSI)");
      expect(mmsiField?.value).toBe("211 239 680");
    });
  });

  describe("buildUrgencyDsc", () => {
    it("builds an urgency call", () => {
      const msg = buildUrgencyDsc({
        mmsi: "366123456",
        workingChannel: 6,
        position: { lat: "48°22'N", lon: "004°30'W" },
      });

      expect(msg.category).toBe("urgency");
      expect(msg.transmitChannel).toBe(70);
      expect(msg.switchToChannel).toBe(6);
      expect(msg.fields.some((f) => f.label === "Category" && f.value === "Urgency")).toBe(true);
      expect(msg.summary).toContain("PAN PAN");
    });
  });

  describe("buildSafetyDsc", () => {
    it("builds a safety call", () => {
      const msg = buildSafetyDsc({
        mmsi: "232001234",
        workingChannel: 13,
      });

      expect(msg.category).toBe("safety");
      expect(msg.transmitChannel).toBe(70);
      expect(msg.switchToChannel).toBe(13);
      expect(msg.summary).toContain("SECURITE");
    });
  });

  describe("buildRoutineDsc", () => {
    it("builds a routine individual call", () => {
      const msg = buildRoutineDsc({
        mmsi: "211239680",
        targetMmsi: "232001234",
        workingChannel: 8,
      });

      expect(msg.category).toBe("routine");
      expect(msg.transmitChannel).toBe(70);
      expect(msg.switchToChannel).toBe(8);
      expect(
        msg.fields.some((f) => f.label === "Address (Target MMSI)" && f.value === "232 001 234"),
      ).toBe(true);
    });
  });

  describe("buildDscMessage (dispatch)", () => {
    it("dispatches to distress builder", () => {
      const msg = buildDscMessage("distress", { mmsi: "211239680", nature: "sinking" });
      expect(msg.category).toBe("distress");
    });

    it("dispatches to urgency builder", () => {
      const msg = buildDscMessage("urgency", { mmsi: "211239680", workingChannel: 6 });
      expect(msg.category).toBe("urgency");
    });

    it("dispatches to safety builder", () => {
      const msg = buildDscMessage("safety", { mmsi: "211239680", workingChannel: 13 });
      expect(msg.category).toBe("safety");
    });

    it("dispatches to routine builder", () => {
      const msg = buildDscMessage("routine", {
        mmsi: "211239680",
        targetMmsi: "232001234",
        workingChannel: 8,
      });
      expect(msg.category).toBe("routine");
    });
  });
});
