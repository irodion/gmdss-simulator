/**
 * Single source of truth for "every valid atomId for a given mode".
 *
 * Used by the adaptive selection algorithm to enumerate candidates and by the
 * queue preview to compute fresh-bucket size. Procedures returns `[]` here
 * because procedure adaptive selection acts on whole scenarios, not atoms;
 * see `scripts/adaptive-scenarios.ts`.
 */

import { ABBREVIATIONS } from "./abbreviations.ts";
import { CHANNELS } from "./channels.ts";
import {
  NUMBER_FORMATS,
  PHONETIC_ALPHABET,
  type AbbreviationDirection,
  type ChannelDirection,
} from "./drill-types.ts";
import {
  abbreviationAtomId,
  channelAtomId,
  listenAtomId,
  numberAtomId,
  phoneticAtomId,
  type LearningMode,
} from "./learning-events.ts";

const PHONETIC_KEYS: readonly string[] = Object.keys(PHONETIC_ALPHABET);

const ABBREVIATION_DIRECTIONS: readonly AbbreviationDirection[] = [
  "abbr-to-expansion",
  "expansion-to-abbr",
];

const CHANNEL_DIRECTIONS: readonly ChannelDirection[] = ["channel-to-usage", "usage-to-channel"];

const PHONETIC_UNIVERSE: readonly string[] = Object.freeze(PHONETIC_KEYS.map(phoneticAtomId));
const LISTEN_UNIVERSE: readonly string[] = Object.freeze(PHONETIC_KEYS.map(listenAtomId));
const NUMBER_UNIVERSE: readonly string[] = Object.freeze(NUMBER_FORMATS.map(numberAtomId));
const ABBREVIATION_UNIVERSE: readonly string[] = Object.freeze(
  ABBREVIATIONS.flatMap((entry) =>
    ABBREVIATION_DIRECTIONS.map((dir) => abbreviationAtomId(entry.abbr, dir)),
  ),
);
const CHANNEL_UNIVERSE: readonly string[] = Object.freeze(
  CHANNELS.flatMap((entry) => CHANNEL_DIRECTIONS.map((dir) => channelAtomId(entry.channel, dir))),
);

export function atomUniverse(mode: LearningMode): readonly string[] {
  switch (mode) {
    case "phonetic":
      return PHONETIC_UNIVERSE;
    case "reverse":
      return LISTEN_UNIVERSE;
    case "number-pronunciation":
      return NUMBER_UNIVERSE;
    case "abbreviation":
      return ABBREVIATION_UNIVERSE;
    case "channel":
      return CHANNEL_UNIVERSE;
    case "procedures":
      return [];
  }
}
