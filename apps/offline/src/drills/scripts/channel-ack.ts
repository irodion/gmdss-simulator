import { coastStationName } from "./coast-stations.ts";
import type { DscPanelState } from "./types.ts";

/**
 * Two-digit VHF channel label, so an ack reads "channel 06", not "channel 6".
 */
function channelLabel(channel: number): string {
  return String(channel).padStart(2, "0");
}

/**
 * The scripted reply a coast station sends after an Individual DSC call.
 *
 * Model A (see #96): the station ALWAYS accepts the channel the trainee
 * proposed — the acknowledgement echoes `panel.channel` verbatim and never
 * gates the voice turn. Whether that channel was the *right* one is a separate
 * graded fact (`gradeProcedure`), not something the ack reflects.
 *
 * Returns `null` when there is nothing to acknowledge: a non-Individual call,
 * or an Individual call still missing an addressee or a proposed channel.
 */
export function buildChannelAck(panel: DscPanelState): string | null {
  if (panel.callType !== "individual") return null;
  if (panel.addressee == null || panel.channel == null) return null;
  return `${coastStationName(panel.addressee)}: affirmative, channel ${channelLabel(panel.channel)}.`;
}
