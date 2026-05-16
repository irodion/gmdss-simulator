export interface ChannelEntry {
  /** Channel number as a stable string id ("06", "16", "70", "87B"). 2-char numeric or 3-char "B"-suffix. */
  readonly channel: string;
  /** Short usage label shown as the multiple-choice option and in the cheatsheet. */
  readonly usage: string;
  /** Full sentence used in the usage→channel prompt. */
  readonly description: string;
}

/**
 * ROC-relevant VHF channels per ITU Appendix 18. Includes restricted/non-voice
 * channels (AIS 87B/88B, guard bands 75/76, on-board 15/17) tagged with
 * explicit restriction labels so trainees learn to recognise them — not just
 * memorise positive assignments.
 */
export const CHANNELS: readonly ChannelEntry[] = [
  {
    channel: "06",
    usage: "SAR — primary inter-ship and ship-to-aircraft",
    description: "primary for inter-ship and ship-to-aircraft search and rescue",
  },
  {
    channel: "09",
    usage: "Inter-ship — first choice",
    description: "preferred first-choice frequency for inter-ship communications",
  },
  {
    channel: "10",
    usage: "Port operations / SAR / anti-pollution",
    description: "coordinated SAR and anti-pollution operations",
  },
  {
    channel: "11",
    usage: "Port operations — ship movement",
    description: "port operations ship movement traffic",
  },
  {
    channel: "12",
    usage: "Port operations — pilots and VTS",
    description: "port operations and vessel traffic services (pilot coordination)",
  },
  {
    channel: "13",
    usage: "Bridge-to-bridge navigation safety",
    description: "world-wide navigation safety communication between vessel bridges",
  },
  {
    channel: "14",
    usage: "Port operations — locks and bridges",
    description: "port operations for locks, bridges, and harbour structures",
  },
  {
    channel: "15",
    usage: "On-board comms — lower (1W max)",
    description: "on-board communications only on the lower 1-watt frequency",
  },
  {
    channel: "16",
    usage: "Distress, safety, and calling",
    description: "the international voice distress, safety, and calling channel",
  },
  {
    channel: "17",
    usage: "On-board comms — upper (1W max)",
    description: "on-board communications only on the upper 1-watt frequency",
  },
  {
    channel: "24",
    usage: "Public correspondence — duplex pair 24",
    description: "public correspondence on the lower duplex pair",
  },
  {
    channel: "25",
    usage: "Public correspondence — duplex pair 25",
    description: "public correspondence on the upper duplex pair",
  },
  {
    channel: "70",
    usage: "DSC distress, safety, and calling — DSC only",
    description: "Digital Selective Calling for distress, safety, and calling (no voice)",
  },
  {
    channel: "72",
    usage: "Inter-ship — second choice",
    description: "second-choice frequency for inter-ship communications",
  },
  {
    channel: "73",
    usage: "Inter-ship / SAR coordination — third choice",
    description: "coordinated SAR in Europe and Canada; third-choice for inter-ship",
  },
  {
    channel: "75",
    usage: "Guard band below CH16 — do not transmit",
    description:
      "guard band immediately below the distress channel, restricted to navigation-related 1W comms",
  },
  {
    channel: "76",
    usage: "Guard band above CH16 — do not transmit",
    description:
      "guard band immediately above the distress channel, restricted to navigation-related 1W comms",
  },
  {
    channel: "79",
    usage: "Port operations — inter-ship alternate",
    description: "port operations and inter-ship use as a regional alternate",
  },
  {
    channel: "87B",
    usage: "AIS 1 — data only, no voice",
    description: "the lower AIS data channel, simplex, no voice transmission",
  },
  {
    channel: "88B",
    usage: "AIS 2 — data only, no voice",
    description: "the upper AIS data channel, simplex, no voice transmission",
  },
];

const CHANNEL_LOOKUP: ReadonlyMap<string, ChannelEntry> = new Map(
  CHANNELS.map((entry) => [entry.channel, entry]),
);

export function getChannelEntry(channel: string): ChannelEntry | undefined {
  return CHANNEL_LOOKUP.get(channel);
}
