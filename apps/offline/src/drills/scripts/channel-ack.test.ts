import { describe, expect, test } from "vite-plus/test";
import { buildChannelAck } from "./channel-ack.ts";
import type { DscPanelState } from "./types.ts";

const INDIVIDUAL: DscPanelState = {
  epirb: false,
  spareAntenna: false,
  abandon: false,
  power: "high",
  channel: 26,
  dscActivated: true,
  callType: "individual",
  nature: null,
  priority: "routine",
  addressee: "haifa_radio",
};

describe("buildChannelAck", () => {
  test("a coast station always accepts the proposed channel (Model A)", () => {
    expect(buildChannelAck(INDIVIDUAL)).toBe("Haifa Radio: affirmative, channel 26.");
  });

  test("the proposed channel is echoed verbatim even when it is the wrong one", () => {
    // The ack reflects what was proposed, not what was expected — grading is separate.
    expect(buildChannelAck({ ...INDIVIDUAL, channel: 6 })).toBe(
      "Haifa Radio: affirmative, channel 06.",
    );
  });

  test("resolves the station name from the addressee id", () => {
    expect(buildChannelAck({ ...INDIVIDUAL, addressee: "rcc_haifa", channel: 16 })).toBe(
      "RCC Haifa: affirmative, channel 16.",
    );
  });

  test("an unknown addressee id falls back to the raw id rather than hiding it", () => {
    expect(buildChannelAck({ ...INDIVIDUAL, addressee: "mystery_station" })).toBe(
      "mystery_station: affirmative, channel 26.",
    );
  });

  test("returns null for non-Individual calls", () => {
    expect(buildChannelAck({ ...INDIVIDUAL, callType: "distress" })).toBeNull();
    expect(buildChannelAck({ ...INDIVIDUAL, callType: "all_ships" })).toBeNull();
  });

  test("returns null when the addressee or channel is missing", () => {
    expect(buildChannelAck({ ...INDIVIDUAL, addressee: null })).toBeNull();
    expect(buildChannelAck({ ...INDIVIDUAL, channel: null })).toBeNull();
  });
});
