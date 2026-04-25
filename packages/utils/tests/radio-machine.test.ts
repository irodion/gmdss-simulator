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

    it("starts with no DSC distress alert recorded", () => {
      expect(INITIAL_RADIO_STATE.distressAlertSentAt).toBeNull();
      expect(INITIAL_RADIO_STATE.distressAlertNature).toBeNull();
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
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_SQUELCH", value: 7 });
      expect(state.squelch).toBe(7);
    });

    it("clamps to 0", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_SQUELCH", value: -5 });
      expect(state.squelch).toBe(0);
    });

    it("clamps to 9", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "SET_SQUELCH", value: 15 });
      expect(state.squelch).toBe(9);
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
      expect(state.dscMenu.screen).toBe("closed");
    });

    it("starts distress hold with flip cover open", () => {
      const open: RadioState = { ...INITIAL_RADIO_STATE, flipCover: "open" };
      const state = radioReducer(open, { type: "START_DISTRESS_HOLD" });
      expect(state.distressHoldStartMs).toBe(1000);
      expect(state.dscMenu.screen).toBe("confirming");
    });

    it("blocks distress hold when already sending", () => {
      const sending: RadioState = {
        ...INITIAL_RADIO_STATE,
        flipCover: "open",
        dscMenu: { screen: "sending" },
      };
      const state = radioReducer(sending, { type: "START_DISTRESS_HOLD" });
      expect(state.dscMenu.screen).toBe("sending"); // unchanged
    });

    it("cancels distress hold", () => {
      const holding: RadioState = {
        ...INITIAL_RADIO_STATE,
        flipCover: "open",
        distressHoldStartMs: 500,
        dscMenu: { screen: "confirming" },
      };
      const state = radioReducer(holding, { type: "CANCEL_DISTRESS_HOLD" });
      expect(state.distressHoldStartMs).toBeNull();
      expect(state.dscMenu.screen).toBe("closed");
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
        selectedNature: "fire",
        dscMenu: { screen: "confirming" },
        distressHoldStartMs: 0,
      };
      const state = radioReducer(confirming, { type: "COMPLETE_DISTRESS_HOLD" });

      expect(state.channel).toBe(16);
      expect(state.dscMenu.screen).toBe("sent");
      expect(state.txRx).toBe("idle");
      expect(state.distressHoldStartMs).toBeNull();
      expect(state.distressRepeatTimerMs).toBeGreaterThan(5000);
      expect(state.distressAlertSentAt).toBe(5000);
      expect(state.distressAlertNature).toBe("fire");

      vi.spyOn(Math, "random").mockRestore();
    });

    it("captures null nature when COMPLETE_DISTRESS_HOLD fires without selection", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      dateNowSpy.mockReturnValue(7000);

      const confirming: RadioState = {
        ...INITIAL_RADIO_STATE,
        flipCover: "open",
        dscMenu: { screen: "confirming" },
        distressHoldStartMs: 0,
      };
      const state = radioReducer(confirming, { type: "COMPLETE_DISTRESS_HOLD" });

      expect(state.distressAlertSentAt).toBe(7000);
      expect(state.distressAlertNature).toBeNull();

      vi.spyOn(Math, "random").mockRestore();
    });

    it("ignores COMPLETE_DISTRESS_HOLD when not confirming", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "COMPLETE_DISTRESS_HOLD" });
      expect(state.dscMenu.screen).toBe("closed"); // unchanged
    });
  });

  describe("SELECT_NATURE", () => {
    it("sets nature of distress", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, {
        type: "SELECT_NATURE",
        nature: "fire",
      });
      expect(state.selectedNature).toBe("fire");
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

  describe("DSC menu", () => {
    it("opens menu from closed state", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "OPEN_DSC_MENU" });
      expect(state.dscMenu).toEqual({ screen: "top-menu", cursor: 0 });
    });

    it("ignores OPEN_DSC_MENU when already open", () => {
      const open: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "top-menu", cursor: 0 },
      };
      const state = radioReducer(open, { type: "OPEN_DSC_MENU" });
      expect(state.dscMenu).toEqual({ screen: "top-menu", cursor: 0 });
    });

    it("navigates up/down in top menu", () => {
      const open: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "top-menu", cursor: 0 },
      };
      const down = radioReducer(open, { type: "DSC_MENU_DOWN" });
      expect(down.dscMenu).toEqual({ screen: "top-menu", cursor: 1 });

      const up = radioReducer(open, { type: "DSC_MENU_UP" });
      expect(up.dscMenu).toEqual({ screen: "top-menu", cursor: 3 }); // wraps
    });

    it("selects Individual Call from top menu", () => {
      const open: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "top-menu", cursor: 0 },
      };
      const state = radioReducer(open, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu).toEqual({ screen: "individual-mmsi", buffer: "" });
    });

    it("selects All Ships from top menu", () => {
      const open: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "top-menu", cursor: 1 },
      };
      const state = radioReducer(open, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu).toEqual({ screen: "allships-category", cursor: 0 });
    });

    it("selects Distress Setup from top menu", () => {
      const open: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "top-menu", cursor: 2 },
      };
      const state = radioReducer(open, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu).toEqual({ screen: "distress-setup", cursor: 0 });
    });

    it("enters MMSI digits", () => {
      const entry: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-mmsi", buffer: "21123" },
      };
      const state = radioReducer(entry, { type: "DSC_DIGIT", digit: 9 });
      expect(state.dscMenu).toEqual({ screen: "individual-mmsi", buffer: "211239" });
    });

    it("limits MMSI to 9 digits", () => {
      const full: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-mmsi", buffer: "211239680" },
      };
      const state = radioReducer(full, { type: "DSC_DIGIT", digit: 1 });
      expect(state).toBe(full); // unchanged
    });

    it("backspace removes last MMSI digit", () => {
      const entry: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-mmsi", buffer: "211" },
      };
      const state = radioReducer(entry, { type: "DSC_BACKSPACE" });
      expect(state.dscMenu).toEqual({ screen: "individual-mmsi", buffer: "21" });
    });

    it("confirms 9-digit MMSI and moves to channel entry", () => {
      const ready: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-mmsi", buffer: "211239680" },
      };
      const state = radioReducer(ready, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu).toEqual({
        screen: "individual-channel",
        mmsi: "211239680",
        buffer: "",
      });
    });

    it("rejects incomplete MMSI on select", () => {
      const incomplete: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-mmsi", buffer: "2112" },
      };
      const state = radioReducer(incomplete, { type: "DSC_MENU_SELECT" });
      expect(state).toBe(incomplete); // unchanged
    });

    it("enters channel digits and confirms valid channel", () => {
      const chEntry: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-channel", mmsi: "211239680", buffer: "" },
      };
      let state = radioReducer(chEntry, { type: "DSC_DIGIT", digit: 0 });
      state = radioReducer(state, { type: "DSC_DIGIT", digit: 6 });
      expect(state.dscMenu).toEqual({
        screen: "individual-channel",
        mmsi: "211239680",
        buffer: "06",
      });

      state = radioReducer(state, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu).toEqual({
        screen: "individual-confirm",
        mmsi: "211239680",
        channel: 6,
      });
    });

    it("rejects invalid channel on select", () => {
      const badCh: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-channel", mmsi: "211239680", buffer: "30" },
      };
      const state = radioReducer(badCh, { type: "DSC_MENU_SELECT" });
      expect(state).toBe(badCh); // channel 30 is invalid
    });

    it("sends individual call from confirm screen", () => {
      const confirm: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-confirm", mmsi: "211239680", channel: 6 },
      };
      const state = radioReducer(confirm, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu).toEqual({ screen: "sent", callType: "individual" });
      expect(state.channel).toBe(6);
    });

    it("navigates back from sub-screens to top menu", () => {
      const mmsiEntry: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-mmsi", buffer: "211" },
      };
      const state = radioReducer(mmsiEntry, { type: "DSC_MENU_BACK" });
      expect(state.dscMenu).toEqual({ screen: "top-menu", cursor: 0 });
    });

    it("closes menu from top menu via BACK", () => {
      const open: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "top-menu", cursor: 0 },
      };
      const state = radioReducer(open, { type: "DSC_MENU_BACK" });
      expect(state.dscMenu).toEqual({ screen: "closed" });
    });

    it("closes menu from sent screen via BACK", () => {
      const sent: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "sent", callType: "individual" },
      };
      const state = radioReducer(sent, { type: "DSC_MENU_BACK" });
      expect(state.dscMenu).toEqual({ screen: "closed" });
    });

    it("selects nature in distress setup and closes menu", () => {
      const setup: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "distress-setup", cursor: 1 }, // "fire"
      };
      const state = radioReducer(setup, { type: "DSC_MENU_SELECT" });
      expect(state.selectedNature).toBe("fire");
      expect(state.dscMenu).toEqual({ screen: "closed" });
    });

    it("all ships urgency flow", () => {
      const cat: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "allships-category", cursor: 0 },
      };
      let state = radioReducer(cat, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu).toEqual({
        screen: "allships-channel",
        category: "urgency",
        buffer: "",
      });

      state = radioReducer(state, { type: "DSC_DIGIT", digit: 1 });
      state = radioReducer(state, { type: "DSC_DIGIT", digit: 6 });
      state = radioReducer(state, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu).toEqual({
        screen: "allships-confirm",
        category: "urgency",
        channel: 16,
      });

      state = radioReducer(state, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu).toEqual({ screen: "sent", callType: "allships" });
      expect(state.channel).toBe(16);
    });

    it("DSC_ENTER works like DSC_MENU_SELECT on digit screens", () => {
      const ready: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-mmsi", buffer: "211239680" },
      };
      const state = radioReducer(ready, { type: "DSC_ENTER" });
      expect(state.dscMenu.screen).toBe("individual-channel");
    });

    it("blocks PTT when DSC menu is open", () => {
      const menuOpen: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "top-menu", cursor: 0 },
      };
      const state = radioReducer(menuOpen, { type: "PRESS_PTT" });
      expect(state.txRx).toBe("idle");
    });

    it("shows POSITION INPUT in top menu when GPS unlocked", () => {
      const noGps: RadioState = {
        ...INITIAL_RADIO_STATE,
        gpsLock: false,
        dscMenu: { screen: "top-menu", cursor: 3 },
      };
      // cursor 3 with no GPS = POSITION INPUT (inserted before CALL LOG)
      const state = radioReducer(noGps, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu.screen).toBe("position-lat");
    });

    it("position entry full flow", () => {
      const noGps: RadioState = {
        ...INITIAL_RADIO_STATE,
        gpsLock: false,
        dscMenu: { screen: "position-lat", buffer: "", hemisphere: "N" },
      };

      // Enter latitude: 5130.500 N
      let state = noGps;
      for (const d of [5, 1, 3, 0, 5]) {
        state = radioReducer(state, { type: "DSC_DIGIT", digit: d });
      }
      expect(state.dscMenu).toEqual({
        screen: "position-lat",
        buffer: "51305",
        hemisphere: "N",
      });

      // Confirm lat
      state = radioReducer(state, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu.screen).toBe("position-lon");

      // Enter longitude: 00007.500 W
      for (const d of [0, 0, 0, 0, 7, 5]) {
        state = radioReducer(state, { type: "DSC_DIGIT", digit: d });
      }
      // Toggle hemisphere to W
      state = radioReducer(state, { type: "DSC_TOGGLE_HEMISPHERE" });

      // Confirm lon
      state = radioReducer(state, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu.screen).toBe("position-time");

      // Enter time: 1430
      for (const d of [1, 4, 3, 0]) {
        state = radioReducer(state, { type: "DSC_DIGIT", digit: d });
      }

      // Confirm time
      state = radioReducer(state, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu.screen).toBe("position-confirm");

      // Confirm position
      state = radioReducer(state, { type: "DSC_MENU_SELECT" });
      expect(state.dscMenu.screen).toBe("closed");
      expect(state.manualPosition).not.toBeNull();
      expect(state.manualPosition?.timeUtc).toBe("1430");
    });

    it("toggles hemisphere on position-lat", () => {
      const lat: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "position-lat", buffer: "5130", hemisphere: "N" },
      };
      const state = radioReducer(lat, { type: "DSC_TOGGLE_HEMISPHERE" });
      expect(state.dscMenu).toEqual({
        screen: "position-lat",
        buffer: "5130",
        hemisphere: "S",
      });
    });

    it("SET_MANUAL_POSITION sets position directly", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, {
        type: "SET_MANUAL_POSITION",
        lat: "5130.5 N",
        lon: "00007.5 W",
        timeUtc: "1430",
      });
      expect(state.manualPosition).toEqual({
        lat: "5130.5 N",
        lon: "00007.5 W",
        timeUtc: "1430",
      });
    });
  });

  describe("DSC menu back navigation", () => {
    it("goes back from individual-channel to individual-mmsi", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-channel", mmsi: "211239680", buffer: "06" },
      };
      const next = radioReducer(state, { type: "DSC_MENU_BACK" });
      expect(next.dscMenu).toEqual({ screen: "individual-mmsi", buffer: "211239680" });
    });

    it("goes back from individual-confirm to individual-channel", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "individual-confirm", mmsi: "211239680", channel: 6 },
      };
      const next = radioReducer(state, { type: "DSC_MENU_BACK" });
      expect(next.dscMenu).toEqual({
        screen: "individual-channel",
        mmsi: "211239680",
        buffer: "6",
      });
    });

    it("goes back from allships-channel to allships-category", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "allships-channel", category: "urgency", buffer: "16" },
      };
      const next = radioReducer(state, { type: "DSC_MENU_BACK" });
      expect(next.dscMenu).toEqual({ screen: "allships-category", cursor: 0 });
    });

    it("goes back from allships-confirm to allships-channel", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "allships-confirm", category: "safety", channel: 16 },
      };
      const next = radioReducer(state, { type: "DSC_MENU_BACK" });
      expect(next.dscMenu).toEqual({
        screen: "allships-channel",
        category: "safety",
        buffer: "16",
      });
    });

    it("goes back from position-lon to position-lat", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: {
          screen: "position-lon",
          lat: "5130",
          latHemi: "N",
          buffer: "000",
          hemisphere: "W",
        },
      };
      const next = radioReducer(state, { type: "DSC_MENU_BACK" });
      expect(next.dscMenu).toEqual({ screen: "position-lat", buffer: "5130", hemisphere: "N" });
    });

    it("goes back from position-time to position-lon", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: {
          screen: "position-time",
          lat: "5130",
          latHemi: "N",
          lon: "00007",
          lonHemi: "W",
          buffer: "14",
        },
      };
      const next = radioReducer(state, { type: "DSC_MENU_BACK" });
      expect(next.dscMenu.screen).toBe("position-lon");
    });

    it("goes back from position-confirm to position-time", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: {
          screen: "position-confirm",
          lat: "5130",
          latHemi: "N",
          lon: "00007",
          lonHemi: "W",
          timeUtc: "1430",
        },
      };
      const next = radioReducer(state, { type: "DSC_MENU_BACK" });
      expect(next.dscMenu.screen).toBe("position-time");
    });

    it("closes from call-log", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "call-log" },
      };
      const next = radioReducer(state, { type: "DSC_MENU_BACK" });
      expect(next.dscMenu.screen).toBe("closed");
    });
  });

  describe("DSC hemisphere toggle", () => {
    it("toggles position-lon hemisphere E to W", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: {
          screen: "position-lon",
          lat: "5130",
          latHemi: "N",
          buffer: "000",
          hemisphere: "E",
        },
      };
      const next = radioReducer(state, { type: "DSC_TOGGLE_HEMISPHERE" });
      expect(next.dscMenu).toEqual({ ...state.dscMenu, hemisphere: "W" });
    });

    it("ignores toggle on non-position screens", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "top-menu", cursor: 0 },
      };
      const next = radioReducer(state, { type: "DSC_TOGGLE_HEMISPHERE" });
      expect(next).toBe(state);
    });
  });

  describe("DSC menu select - call-log", () => {
    it("opens call-log from top menu", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "top-menu", cursor: 3 },
      };
      const next = radioReducer(state, { type: "DSC_MENU_SELECT" });
      expect(next.dscMenu.screen).toBe("call-log");
    });
  });

  describe("DSC allships safety flow", () => {
    it("selects safety category", () => {
      const state: RadioState = {
        ...INITIAL_RADIO_STATE,
        dscMenu: { screen: "allships-category", cursor: 1 },
      };
      const next = radioReducer(state, { type: "DSC_MENU_SELECT" });
      expect(next.dscMenu).toEqual({
        screen: "allships-channel",
        category: "safety",
        buffer: "",
      });
    });
  });

  describe("direct channel entry", () => {
    it("accumulates digits in channelInput", () => {
      let state = radioReducer(INITIAL_RADIO_STATE, { type: "DSC_DIGIT", digit: 1 });
      expect(state.channelInput).toBe("1");
      state = radioReducer(state, { type: "DSC_DIGIT", digit: 6 });
      expect(state.channelInput).toBe("16");
    });

    it("limits to 2 digits", () => {
      const state: RadioState = { ...INITIAL_RADIO_STATE, channelInput: "16" };
      const next = radioReducer(state, { type: "DSC_DIGIT", digit: 0 });
      expect(next).toBe(state);
    });

    it("switches channel on DSC_ENTER with valid input", () => {
      const state: RadioState = { ...INITIAL_RADIO_STATE, channelInput: "9" };
      const next = radioReducer(state, { type: "DSC_ENTER" });
      expect(next.channel).toBe(9);
      expect(next.channelInput).toBe("");
    });

    it("clears input on DSC_ENTER with invalid channel", () => {
      const state: RadioState = { ...INITIAL_RADIO_STATE, channelInput: "30" };
      const next = radioReducer(state, { type: "DSC_ENTER" });
      expect(next.channel).toBe(16); // unchanged
      expect(next.channelInput).toBe("");
    });

    it("backspace removes last digit", () => {
      const state: RadioState = { ...INITIAL_RADIO_STATE, channelInput: "16" };
      const next = radioReducer(state, { type: "DSC_BACKSPACE" });
      expect(next.channelInput).toBe("1");
    });

    it("CLEAR_CHANNEL_INPUT clears buffer", () => {
      const state: RadioState = { ...INITIAL_RADIO_STATE, channelInput: "7" };
      const next = radioReducer(state, { type: "CLEAR_CHANNEL_INPUT" });
      expect(next.channelInput).toBe("");
    });
  });

  describe("unknown command", () => {
    it("returns state unchanged for unknown command type", () => {
      const state = radioReducer(INITIAL_RADIO_STATE, { type: "UNKNOWN" } as any);
      expect(state).toBe(INITIAL_RADIO_STATE);
    });
  });
});
