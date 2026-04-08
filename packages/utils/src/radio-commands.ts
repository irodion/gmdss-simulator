import type { NatureOfDistress } from "./dsc-types.ts";
import type { RadioCommand } from "./radio-types.ts";

export const setChannel = (channel: number): RadioCommand => ({ type: "SET_CHANNEL", channel });
export const channelUp = (): RadioCommand => ({ type: "CHANNEL_UP" });
export const channelDown = (): RadioCommand => ({ type: "CHANNEL_DOWN" });
export const quick16or9 = (): RadioCommand => ({ type: "QUICK_16_9" });
export const toggleDualWatch = (): RadioCommand => ({ type: "TOGGLE_DUAL_WATCH" });
export const togglePower = (): RadioCommand => ({ type: "TOGGLE_POWER" });
export const setSquelch = (value: number): RadioCommand => ({ type: "SET_SQUELCH", value });
export const setVolume = (value: number): RadioCommand => ({ type: "SET_VOLUME", value });
export const pressPtt = (): RadioCommand => ({ type: "PRESS_PTT" });
export const releasePtt = (): RadioCommand => ({ type: "RELEASE_PTT" });
export const openFlipCover = (): RadioCommand => ({ type: "OPEN_FLIP_COVER" });
export const closeFlipCover = (): RadioCommand => ({ type: "CLOSE_FLIP_COVER" });
export const startDistressHold = (): RadioCommand => ({ type: "START_DISTRESS_HOLD" });
export const cancelDistressHold = (): RadioCommand => ({ type: "CANCEL_DISTRESS_HOLD" });
export const completeDistressHold = (): RadioCommand => ({ type: "COMPLETE_DISTRESS_HOLD" });
export const selectNature = (nature: NatureOfDistress): RadioCommand => ({
  type: "SELECT_NATURE",
  nature,
});
export const beginReceive = (): RadioCommand => ({ type: "BEGIN_RECEIVE" });
export const endReceive = (): RadioCommand => ({ type: "END_RECEIVE" });
export const setGpsLock = (locked: boolean): RadioCommand => ({ type: "SET_GPS_LOCK", locked });
