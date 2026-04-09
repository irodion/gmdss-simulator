import { describe, expect, it } from "vite-plus/test";
import {
  setChannel,
  channelUp,
  channelDown,
  quick16or9,
  toggleDualWatch,
  togglePower,
  setSquelch,
  setVolume,
  pressPtt,
  releasePtt,
  openFlipCover,
  closeFlipCover,
  startDistressHold,
  cancelDistressHold,
  completeDistressHold,
  selectNature,
  beginReceive,
  endReceive,
  setGpsLock,
  openDscMenu,
  dscMenuUp,
  dscMenuDown,
  dscMenuSelect,
  dscMenuBack,
  dscDigit,
  dscBackspace,
  dscEnter,
  dscToggleHemisphere,
  clearChannelInput,
  setManualPosition,
} from "../src/radio-commands.ts";

describe("radio command creators", () => {
  it("setChannel", () => {
    expect(setChannel(16)).toEqual({ type: "SET_CHANNEL", channel: 16 });
  });

  it("channelUp", () => {
    expect(channelUp()).toEqual({ type: "CHANNEL_UP" });
  });

  it("channelDown", () => {
    expect(channelDown()).toEqual({ type: "CHANNEL_DOWN" });
  });

  it("quick16or9", () => {
    expect(quick16or9()).toEqual({ type: "QUICK_16_9" });
  });

  it("toggleDualWatch", () => {
    expect(toggleDualWatch()).toEqual({ type: "TOGGLE_DUAL_WATCH" });
  });

  it("togglePower", () => {
    expect(togglePower()).toEqual({ type: "TOGGLE_POWER" });
  });

  it("setSquelch", () => {
    expect(setSquelch(50)).toEqual({ type: "SET_SQUELCH", value: 50 });
  });

  it("setVolume", () => {
    expect(setVolume(80)).toEqual({ type: "SET_VOLUME", value: 80 });
  });

  it("pressPtt", () => {
    expect(pressPtt()).toEqual({ type: "PRESS_PTT" });
  });

  it("releasePtt", () => {
    expect(releasePtt()).toEqual({ type: "RELEASE_PTT" });
  });

  it("openFlipCover", () => {
    expect(openFlipCover()).toEqual({ type: "OPEN_FLIP_COVER" });
  });

  it("closeFlipCover", () => {
    expect(closeFlipCover()).toEqual({ type: "CLOSE_FLIP_COVER" });
  });

  it("startDistressHold", () => {
    expect(startDistressHold()).toEqual({ type: "START_DISTRESS_HOLD" });
  });

  it("cancelDistressHold", () => {
    expect(cancelDistressHold()).toEqual({ type: "CANCEL_DISTRESS_HOLD" });
  });

  it("completeDistressHold", () => {
    expect(completeDistressHold()).toEqual({ type: "COMPLETE_DISTRESS_HOLD" });
  });

  it("selectNature", () => {
    expect(selectNature("fire")).toEqual({ type: "SELECT_NATURE", nature: "fire" });
  });

  it("beginReceive", () => {
    expect(beginReceive()).toEqual({ type: "BEGIN_RECEIVE" });
  });

  it("endReceive", () => {
    expect(endReceive()).toEqual({ type: "END_RECEIVE" });
  });

  it("setGpsLock", () => {
    expect(setGpsLock(true)).toEqual({ type: "SET_GPS_LOCK", locked: true });
  });

  it("openDscMenu", () => {
    expect(openDscMenu()).toEqual({ type: "OPEN_DSC_MENU" });
  });

  it("dscMenuUp", () => {
    expect(dscMenuUp()).toEqual({ type: "DSC_MENU_UP" });
  });

  it("dscMenuDown", () => {
    expect(dscMenuDown()).toEqual({ type: "DSC_MENU_DOWN" });
  });

  it("dscMenuSelect", () => {
    expect(dscMenuSelect()).toEqual({ type: "DSC_MENU_SELECT" });
  });

  it("dscMenuBack", () => {
    expect(dscMenuBack()).toEqual({ type: "DSC_MENU_BACK" });
  });

  it("dscDigit", () => {
    expect(dscDigit(5)).toEqual({ type: "DSC_DIGIT", digit: 5 });
  });

  it("dscBackspace", () => {
    expect(dscBackspace()).toEqual({ type: "DSC_BACKSPACE" });
  });

  it("dscEnter", () => {
    expect(dscEnter()).toEqual({ type: "DSC_ENTER" });
  });

  it("dscToggleHemisphere", () => {
    expect(dscToggleHemisphere()).toEqual({ type: "DSC_TOGGLE_HEMISPHERE" });
  });

  it("clearChannelInput", () => {
    expect(clearChannelInput()).toEqual({ type: "CLEAR_CHANNEL_INPUT" });
  });

  it("setManualPosition", () => {
    expect(setManualPosition("51 N", "0 W", "1430")).toEqual({
      type: "SET_MANUAL_POSITION",
      lat: "51 N",
      lon: "0 W",
      timeUtc: "1430",
    });
  });
});
