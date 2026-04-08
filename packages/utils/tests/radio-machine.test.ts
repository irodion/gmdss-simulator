import { describe, expect, it, vi, beforeEach, afterEach } from "vite-plus/test";
import { radioReducer, INITIAL_RADIO_STATE } from "../src/radio-machine.ts";
import type { RadioState } from "../src/radio-types.ts";

describe("radioReducer", () => {
  describe("initial state", () => {
    it("starts on channel 16", () => {
      expect(INITIAL_RADIO_STATE.channel).toBe(16);
    });

    it("starts with high power", () => {
      expect(INITIAL_RADIO_STATE.power).toBe("high");
    });

    it("starts idle", () => {
      expect(INITIAL_RADIO_STATE.txRx).toBe("idle");
    });

    it("starts with flip cover closed", () => {
      expect(INITIAL_RADIO_STATE.flipCover).toBe("closed");
    });

    it("starts with GPS lock", () => {
      expect(INITIAL_RADIO_STATE.gpsLock).toBe(true);
    });
  });

  describe("SET_CHANNEL", () => {
    it("sets a valid channel", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_CHANNEL", channel: 6 });
      expect(state.channel).toBe(6);
    });

    it("ignores invalid channel numbers (gaps in ITU table)", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_CHANNEL", channel: 30 });
      expect(state.channel).toBe(16); // unchanged
    });

    it("allows channel 70 (DSC only)", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_CHANNEL", channel: 70 });
      expect(state.channel).toBe(70);
    });

    it("allows channel 1", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_CHANNEL", channel: 1 });
      expect(state.channel).toBe(1);
    });

    it("allows channel 88", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_CHANNEL", channel: 88 });
      expect(state.channel).toBe(88);
    });

    it("ignores channel 0", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_CHANNEL", channel: 0 });
      expect(state.channel).toBe(16);
    });

    it("ignores channel 89", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_CHANNEL", channel: 89 });
      expect(state.channel).toBe(16);
    });
  });

  describe("CHANNEL_UP", () => {
    it("moves to next valid channel", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "CHANNEL_UP" });
      expect(state.channel).toBe(17);
    });

    it("wraps from 88 to 1", () => {
      const at88: RadioState = { ...INITIAL_RADIO_STATE, channel: 88 };
      const state = radioReducer(at88, { type: "CHANNEL_UP" });
      expect(state.channel).toBe(1);
    });

    it("skips gap between 28 and 60", () => {
      const at28: RadioState = { ...INITIAL_RADIO_STATE, channel: 28 };
      const state = radioReducer(at28, { type: "CHANNEL_UP" });
      expect(state.channel).toBe(60);
    });
  });

  describe("CHANNEL_DOWN", () => {
    it("moves to previous valid channel", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "CHANNEL_DOWN" });
      expect(state.channel).toBe(15);
    });

    it("wraps from 1 to 88", () => {
      const at1: RadioState = { ...INITIAL_RADIO_STATE, channel: 1 };
      const state = radioReducer(at1, { type: "CHANNEL_DOWN" });
      expect(state.channel).toBe(88);
    });

    it("skips gap between 60 and 28", () => {
      const at60: RadioState = { ...INITIAL_RADIO_STATE, channel: 60 };
      const state = radioReducer(at60, { type: "CHANNEL_DOWN" });
      expect(state.channel).toBe(28);
    });
  });

  describe("QUICK_16_9", () => {
    it("switches from 16 to 9", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "QUICK_16_9" });
      expect(state.channel).toBe(9);
    });

    it("switches from 9 to 16", () => {
      const at9: RadioState = { ...INITIAL_RADIO_STATE, channel: 9 };
      const state = radioReducer(at9, { type: "QUICK_16_9" });
      expect(state.channel).toBe(16);
    });

    it("switches from any other channel to 16", () => {
      const at12: RadioState = { ...INITIAL_RADIO_STATE, channel: 12 };
      const state = radioReducer(at12, { type: "QUICK_16_9" });
      expect(state.channel).toBe(16);
    });
  });

  describe("TOGGLE_DUAL_WATCH", () => {
    it("enables dual watch", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "TOGGLE_DUAL_WATCH" });
      expect(state.dualWatch).toBe(true);
    });

    it("disables dual watch", () => {
      const on: RadioState = { ...INITIAL_RADIO_STATE, dualWatch: true };
      const state = radioReducer(on, { type: "TOGGLE_DUAL_WATCH" });
      expect(state.dualWatch).toBe(false);
    });
  });

  describe("TOGGLE_POWER", () => {
    it("switches from high to low", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "TOGGLE_POWER" });
      expect(state.power).toBe("low");
    });

    it("switches from low to high", () => {
      const low: RadioState = { ...INITIAL_RADIO_STATE, power: "low" };
      const state = radioReducer(low, { type: "TOGGLE_POWER" });
      expect(state.power).toBe("high");
    });
  });

  describe("SET_SQUELCH", () => {
    it("sets squelch value", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_SQUELCH", value: 50 });
      expect(state.squelch).toBe(50);
    });

    it("clamps to 0", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_SQUELCH", value: -5 });
      expect(state.squelch).toBe(0);
    });

    it("clamps to 100", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_SQUELCH", value: 150 });
      expect(state.squelch).toBe(100);
    });
  });

  describe("SET_VOLUME", () => {
    it("sets volume value", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_VOLUME", value: 80 });
      expect(state.volume).toBe(80);
    });

    it("clamps to 0", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_VOLUME", value: -10 });
      expect(state.volume).toBe(0);
    });

    it("clamps to 100", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_VOLUME", value: 200 });
      expect(state.volume).toBe(100);
    });
  });

  describe("PTT (push-to-talk)", () => {
    it("starts transmitting on PRESS_PTT", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "PRESS_PTT" });
      expect(state.txRx).toBe("transmitting");
    });

    it("stops transmitting on RELEASE_PTT", () => {
      const tx: RadioState = { ...INITIAL_RADIO_STATE, txRx: "transmitting" };
      const state = radioReducer(tx, { type: "RELEASE_PTT" });
      expect(state.txRx).toBe("idle");
    });

    it("blocks PTT on channel 70 (DSC only)", () => {
      const ch70: RadioState = { ...INITIAL_RADIO_STATE, channel: 70 };
      const state = radioReducer(ch70, { type: "PRESS_PTT" });
      expect(state.txRx).toBe("idle");
    });

    it("blocks PTT on guard channel 75", () => {
      const ch75: RadioState = { ...INITIAL_RADIO_STATE, channel: 75 };
      expect(radioReducer(ch75, { type: "PRESS_PTT" }).txRx).toBe("idle");
    });

    it("blocks PTT on guard channel 76", () => {
      const ch76: RadioState = { ...INITIAL_RADIO_STATE, channel: 76 };
      expect(radioReducer(ch76, { type: "PRESS_PTT" }).txRx).toBe("idle");
    });

    it("blocks PTT when already transmitting", () => {
      const tx: RadioState = { ...INITIAL_RADIO_STATE, txRx: "transmitting" };
      const state = radioReducer(tx, { type: "PRESS_PTT" });
      expect(state.txRx).toBe("transmitting"); // unchanged
    });

    it("blocks PTT when receiving", () => {
      const rx: RadioState = { ...INITIAL_RADIO_STATE, txRx: "receiving" };
      const state = radioReducer(rx, { type: "PRESS_PTT" });
      expect(state.txRx).toBe("receiving"); // unchanged
    });

    it("ignores RELEASE_PTT when not transmitting", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "RELEASE_PTT" });
      expect(state.txRx).toBe("idle");
    });
  });

  describe("BEGIN_RECEIVE / END_RECEIVE", () => {
    it("enters receiving state", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "BEGIN_RECEIVE" });
      expect(state.txRx).toBe("receiving");
    });

    it("returns to idle on END_RECEIVE", () => {
      const rx: RadioState = { ...INITIAL_RADIO_STATE, txRx: "receiving" };
      const state = radioReducer(rx, { type: "END_RECEIVE" });
      expect(state.txRx).toBe("idle");
    });

    it("does not override transmitting with receiving", () => {
      const tx: RadioState = { ...INITIAL_RADIO_STATE, txRx: "transmitting" };
      const state = radioReducer(tx, { type: "BEGIN_RECEIVE" });
      expect(state.txRx).toBe("transmitting");
    });

    it("ignores END_RECEIVE when not receiving", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "END_RECEIVE" });
      expect(state.txRx).toBe("idle");
    });
  });

  describe("flip cover", () => {
    it("opens flip cover", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "OPEN_FLIP_COVER" });
      expect(state.flipCover).toBe("open");
    });

    it("closes flip cover", () => {
      const open: RadioState = { ...INITIAL_RADIO_STATE, flipCover: "open" };
      const state = radioReducer(open, { type: "CLOSE_FLIP_COVER" });
      expect(state.flipCover).toBe("closed");
    });
  });

  describe("distress hold sequence", () => {
    let dateNowSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(1000);
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it("requires flip cover open to start distress hold", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "START_DISTRESS_HOLD" });
      expect(state.distressHoldStartMs).toBeNull(); // blocked
      expect(state.dscForm).toBe("closed");
    });

    it("starts distress hold with flip cover open", () => {
      const open: RadioState = { ...INITIAL_RADIO_STATE, flipCover: "open" };
      const state = radioReducer(open, { type: "START_DISTRESS_HOLD" });
      expect(state.distressHoldStartMs).toBe(1000);
      expect(state.dscForm).toBe("confirming");
    });

    it("blocks distress hold when already sending", () => {
      const sending: RadioState = {
        ...INITIAL_RADIO_STATE,
        flipCover: "open",
        dscForm: "sending",
      };
      const state = radioReducer(sending, { type: "START_DISTRESS_HOLD" });
      expect(state.dscForm).toBe("sending"); // unchanged
    });

    it("cancels distress hold", () => {
      const holding: RadioState = {
        ...INITIAL_RADIO_STATE,
        flipCover: "open",
        distressHoldStartMs: 500,
        dscForm: "confirming",
      };
      const state = radioReducer(holding, { type: "CANCEL_DISTRESS_HOLD" });
      expect(state.distressHoldStartMs).toBeNull();
      expect(state.dscForm).toBe("closed");
    });

    it("ignores cancel when not holding", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "CANCEL_DISTRESS_HOLD" });
      expect(state).toBe(INITIAL_RADIO_STATE); // reference equality — unchanged
    });

    it("completes distress hold: auto-switches to Ch.16 and sets repeat timer", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      dateNowSpy.mockReturnValue(5000);

      const confirming: RadioState = {
        ...INITIAL_RADIO_STATE,
        channel: 12,
        flipCover: "open",
        dscForm: "confirming",
        distressHoldStartMs: 0,
      };
      const state = radioReducer(confirming, { type: "COMPLETE_DISTRESS_HOLD" });

      expect(state.channel).toBe(16);
      expect(state.dscForm).toBe("sent");
      expect(state.txRx).toBe("idle");
      expect(state.distressHoldStartMs).toBeNull();
      expect(state.distressRepeatTimerMs).toBeGreaterThan(5000);

      vi.spyOn(Math, "random").mockRestore();
    });

    it("ignores COMPLETE_DISTRESS_HOLD when not confirming", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "COMPLETE_DISTRESS_HOLD" });
      expect(state.dscForm).toBe("closed"); // unchanged
    });
  });

  describe("SELECT_NATURE", () => {
    it("sets nature of distress", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, {
        type: "SELECT_NATURE",
        nature: "fire",
      });
      expect(state.selectedNature).toBe("fire");
      expect(state.dscForm).toBe("nature-select");
    });
  });

  describe("SET_GPS_LOCK", () => {
    it("enables GPS lock", () => {
      const noGps: RadioState = { ...INITIAL_RADIO_STATE, gpsLock: false };
      const state = radioReducer(noGps, { type: "SET_GPS_LOCK", locked: true });
      expect(state.gpsLock).toBe(true);
    });

    it("disables GPS lock", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_GPS_LOCK", locked: false });
      expect(state.gpsLock).toBe(false);
    });
  });

  describe("unknown command", () => {
    it("returns state unchanged for unknown command type", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "UNKNOWN" } as any);
      expect(state).toBe(INITIAL_RADIO_STATE);
    });
  });
});
