/** DSC-only channel — voice transmission is blocked (ITU). */
export const DSC_ONLY_CHANNEL = 70;

/** Guard band channels — restricted use. */
export const GUARD_CHANNELS: readonly number[] = [75, 76];

/** Squelch range — discrete levels matching real VHF radios. */
export const SQUELCH_MIN = 0;
export const SQUELCH_MAX = 9;

/** Convert squelch level (0–9) to audio engine percentage (0–100). */
export function squelchToPercent(level: number): number {
  return level * (100 / SQUELCH_MAX);
}
