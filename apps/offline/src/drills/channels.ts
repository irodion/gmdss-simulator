export interface ChannelEntry {
  /** Channel number as a stable string id ("06", "16", "70"). Always 2 chars for sorting. */
  readonly channel: string;
  /** Short usage label shown as the multiple-choice option and in the cheatsheet. */
  readonly usage: string;
  /** Full sentence used in the usage→channel prompt. */
  readonly description: string;
}

/**
 * Core ROC-relevant VHF channels. WRC-19 additions (AIS, ASM, VDES) are
 * intentionally omitted from v1 — they are not on a standard ROC exam and
 * including them muddies multiple-choice distractors.
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
    channel: "13",
    usage: "Bridge-to-bridge navigation safety",
    description: "world-wide navigation safety communication between vessel bridges",
  },
  {
    channel: "16",
    usage: "Distress, safety, and calling",
    description: "the international voice distress, safety, and calling channel",
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
];

const CHANNEL_LOOKUP: ReadonlyMap<string, ChannelEntry> = new Map(
  CHANNELS.map((entry) => [entry.channel, entry]),
);

export function getChannelEntry(channel: string): ChannelEntry | undefined {
  return CHANNEL_LOOKUP.get(channel);
}
