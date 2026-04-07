import { describe, expect, it } from "vite-plus/test";
import { decodeMmsi } from "../src/mmsi-decoder.ts";

describe("decodeMmsi", () => {
  describe("ship stations", () => {
    it("decodes a German ship MMSI", () => {
      const result = decodeMmsi("211239680");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("ship");
      expect(result.mid).toBe("211");
      expect(result.country).toBe("Germany");
    });

    it("decodes a US ship MMSI", () => {
      const result = decodeMmsi("366123456");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("ship");
      expect(result.mid).toBe("366");
      expect(result.country).toBe("United States");
    });

    it("decodes a Panama ship MMSI", () => {
      const result = decodeMmsi("351234567");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("ship");
      expect(result.country).toBe("Panama");
    });

    it("handles unknown MID gracefully", () => {
      const result = decodeMmsi("299000000");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("ship");
      expect(result.mid).toBe("299");
      expect(result.country).toBeUndefined();
    });
  });

  describe("coast stations", () => {
    it("decodes a coast station MMSI (00 prefix)", () => {
      const result = decodeMmsi("002320001");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("coast");
      expect(result.mid).toBe("232");
      expect(result.country).toBe("United Kingdom");
    });
  });

  describe("group calls", () => {
    it("decodes a group call MMSI (0 prefix, not 00)", () => {
      const result = decodeMmsi("021112345");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("group");
      expect(result.mid).toBe("211");
      expect(result.country).toBe("Germany");
    });
  });

  describe("SAR aircraft", () => {
    it("decodes SAR aircraft MMSI (111 prefix)", () => {
      const result = decodeMmsi("111232000");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("sar_aircraft");
      expect(result.mid).toBe("232");
      expect(result.country).toBe("United Kingdom");
    });
  });

  describe("special devices", () => {
    it("decodes AIS-SART (970 prefix)", () => {
      const result = decodeMmsi("970123456");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("ais_sart");
      expect(result.description).toContain("AIS-SART");
    });

    it("decodes MOB device (972 prefix)", () => {
      const result = decodeMmsi("972123456");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("mob");
    });

    it("decodes EPIRB (974 prefix)", () => {
      const result = decodeMmsi("974123456");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("epirb");
    });
  });

  describe("invalid inputs", () => {
    it("rejects non-digit characters", () => {
      const result = decodeMmsi("21123ABC0");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects wrong length (too short)", () => {
      const result = decodeMmsi("12345678");
      expect(result.valid).toBe(false);
    });

    it("rejects wrong length (too long)", () => {
      const result = decodeMmsi("1234567890");
      expect(result.valid).toBe(false);
    });

    it("rejects empty string", () => {
      const result = decodeMmsi("");
      expect(result.valid).toBe(false);
    });

    it("rejects unknown prefix starting with 8 or 9 (non-special)", () => {
      const result = decodeMmsi("800000000");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unknown");
    });
  });

  describe("formatting tolerance", () => {
    it("handles spaces in input", () => {
      const result = decodeMmsi("211 239 680");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("ship");
    });

    it("handles dashes in input", () => {
      const result = decodeMmsi("211-239-680");
      expect(result.valid).toBe(true);
      expect(result.stationType).toBe("ship");
    });
  });
});
