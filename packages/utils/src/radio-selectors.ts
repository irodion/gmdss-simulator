import { channelFrequency } from "./channel-table.ts";
import { DSC_ONLY_CHANNEL, GUARD_CHANNELS } from "./radio-constants.ts";
import type { RadioState } from "./radio-types.ts";

export interface DisplayLines {
  /** e.g. "CH 16  156.800" */
  readonly main: string;
  /** e.g. "DUAL WATCH: OFF" */
  readonly sub: string;
  /** e.g. "PWR 25W  SQL 04  GPS LOCK" */
  readonly footer: string;
}

/**
 * Derive the three LCD display lines from radio state.
 */
export function displayLines(state: RadioState): DisplayLines {
  const freq = channelFrequency(state.channel);
  const chStr = String(state.channel).padStart(2, "0");

  const main =
    state.channel === DSC_ONLY_CHANNEL ? `CH ${chStr}  DSC ONLY` : `CH ${chStr}  ${freq}`;
  const sub = state.dualWatch ? "DUAL WATCH: CH 16" : "DUAL WATCH: OFF";

  const pwr = state.power === "high" ? "25W" : "1W";
  const sql = String(state.squelch).padStart(2, "0");
  const gps = state.gpsLock ? "GPS LOCK" : "NO GPS";
  const footer = `PWR ${pwr}  SQL ${sql}  ${gps}`;

  return { main, sub, footer };
}

/**
 * Whether voice transmission is blocked on the current channel.
 */
export function isVoiceBlocked(state: RadioState): boolean {
  return state.channel === DSC_ONLY_CHANNEL || GUARD_CHANNELS.includes(state.channel);
}

/**
 * Whether the given channel is DSC-only (no voice).
 */
export function isDscOnly(channel: number): boolean {
  return channel === DSC_ONLY_CHANNEL;
}

export { channelFrequency } from "./channel-table.ts";
