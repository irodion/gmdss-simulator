/**
 * ITU Maritime VHF Channel Table
 * Maps channel numbers (1–88) to ship transmit frequencies (MHz).
 * Simplex channels use the same frequency for TX and RX.
 * Duplex channels have separate ship TX and coast TX frequencies;
 * we store the ship TX frequency here (what the radio displays).
 */

export interface ChannelEntry {
  /** Ship transmit frequency in MHz, e.g. "156.050" */
  readonly shipTx: string;
  /** Whether the channel is simplex (true) or duplex */
  readonly simplex: boolean;
}

// prettier-ignore
const TABLE: Readonly<Record<number, ChannelEntry>> = {
  1:  { shipTx: "156.050", simplex: false },
  2:  { shipTx: "156.100", simplex: false },
  3:  { shipTx: "156.150", simplex: false },
  4:  { shipTx: "156.200", simplex: false },
  5:  { shipTx: "156.250", simplex: false },
  6:  { shipTx: "156.300", simplex: true  },
  7:  { shipTx: "156.350", simplex: false },
  8:  { shipTx: "156.400", simplex: true  },
  9:  { shipTx: "156.450", simplex: true  },
  10: { shipTx: "156.500", simplex: true  },
  11: { shipTx: "156.550", simplex: true  },
  12: { shipTx: "156.600", simplex: true  },
  13: { shipTx: "156.650", simplex: true  },
  14: { shipTx: "156.700", simplex: true  },
  15: { shipTx: "156.750", simplex: true  },
  16: { shipTx: "156.800", simplex: true  },
  17: { shipTx: "156.850", simplex: true  },
  18: { shipTx: "156.900", simplex: false },
  19: { shipTx: "156.950", simplex: false },
  20: { shipTx: "157.000", simplex: false },
  21: { shipTx: "157.050", simplex: false },
  22: { shipTx: "157.100", simplex: false },
  23: { shipTx: "157.150", simplex: false },
  24: { shipTx: "157.200", simplex: false },
  25: { shipTx: "157.250", simplex: false },
  26: { shipTx: "157.300", simplex: false },
  27: { shipTx: "157.350", simplex: false },
  28: { shipTx: "157.400", simplex: false },
  60: { shipTx: "156.025", simplex: false },
  61: { shipTx: "156.075", simplex: false },
  62: { shipTx: "156.125", simplex: false },
  63: { shipTx: "156.175", simplex: false },
  64: { shipTx: "156.225", simplex: false },
  65: { shipTx: "156.275", simplex: false },
  66: { shipTx: "156.325", simplex: false },
  67: { shipTx: "156.375", simplex: true  },
  68: { shipTx: "156.425", simplex: true  },
  69: { shipTx: "156.475", simplex: true  },
  70: { shipTx: "156.525", simplex: true  }, // DSC only — no voice
  71: { shipTx: "156.575", simplex: true  },
  72: { shipTx: "156.625", simplex: true  },
  73: { shipTx: "156.675", simplex: true  },
  74: { shipTx: "156.725", simplex: true  },
  75: { shipTx: "156.775", simplex: true  }, // Guard band
  76: { shipTx: "156.825", simplex: true  }, // Guard band
  77: { shipTx: "156.875", simplex: true  },
  78: { shipTx: "156.925", simplex: false },
  79: { shipTx: "156.975", simplex: false },
  80: { shipTx: "157.025", simplex: false },
  81: { shipTx: "157.075", simplex: false },
  82: { shipTx: "157.125", simplex: false },
  83: { shipTx: "157.175", simplex: false },
  84: { shipTx: "157.225", simplex: false },
  85: { shipTx: "157.275", simplex: false },
  86: { shipTx: "157.325", simplex: false },
  87: { shipTx: "157.375", simplex: false },
  88: { shipTx: "157.425", simplex: false },
};

/** Valid channel numbers in the ITU maritime VHF band. */
export const VALID_CHANNELS: readonly number[] = Object.keys(TABLE)
  .map(Number)
  .sort((a, b) => a - b);

/** O(1) channel→index lookup for nextChannel/prevChannel. */
const CHANNEL_INDEX = new Map<number, number>(VALID_CHANNELS.map((ch, i) => [ch, i]));

/** Minimum valid channel number. */
export const MIN_CHANNEL = 1;

/** Maximum valid channel number. */
export const MAX_CHANNEL = 88;

/**
 * Look up the ship transmit frequency for a VHF channel.
 * Returns undefined for channels not in the ITU table (e.g. 29–59).
 */
export function getChannelEntry(channel: number): ChannelEntry | undefined {
  return TABLE[channel];
}

/**
 * Get the display frequency string for a channel, or "---" if invalid.
 */
export function channelFrequency(channel: number): string {
  const entry = TABLE[channel];
  return entry ? entry.shipTx : "---";
}

/**
 * Check whether a channel number exists in the ITU table.
 */
export function isValidChannel(channel: number): boolean {
  return channel in TABLE;
}

/**
 * Get the next valid channel after the given one, wrapping around.
 */
export function nextChannel(current: number): number {
  const idx = CHANNEL_INDEX.get(current);
  if (idx === undefined) return VALID_CHANNELS[0]!;
  return VALID_CHANNELS[(idx + 1) % VALID_CHANNELS.length]!;
}

/**
 * Get the previous valid channel before the given one, wrapping around.
 */
export function prevChannel(current: number): number {
  const idx = CHANNEL_INDEX.get(current);
  if (idx === undefined) return VALID_CHANNELS[VALID_CHANNELS.length - 1]!;
  return VALID_CHANNELS[(idx - 1 + VALID_CHANNELS.length) % VALID_CHANNELS.length]!;
}
