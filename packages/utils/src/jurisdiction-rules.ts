import type { JurisdictionProfile } from "./jurisdiction-types.ts";
import { DSC_ONLY_CHANNEL, GUARD_CHANNELS } from "./radio-constants.ts";
import type { ScenarioCategory } from "./scenario-types.ts";

/**
 * Get the recommended calling channel for a scenario category.
 * All categories use the jurisdiction's calling channel (typically Ch.16).
 */
export function getCallingChannel(
  profile: JurisdictionProfile,
  _category: ScenarioCategory,
): number {
  return profile.calling_channel;
}

/**
 * Check whether a channel allows voice transmission
 * within a jurisdiction profile.
 */
export function isChannelValidForVoice(profile: JurisdictionProfile, channel: number): boolean {
  if (channel === DSC_ONLY_CHANNEL) return false;
  if (GUARD_CHANNELS.includes(channel)) return false;

  // Check channel_plan if the channel is defined
  const chKey = String(channel);
  const def = profile.channel_plan[chKey];
  if (def && def.type === "dsc_only") return false;

  return true;
}

/**
 * Find a working channel for a given purpose from the jurisdiction's channel plan.
 * Returns the channel number or null if not found.
 */
export function getWorkingChannel(profile: JurisdictionProfile, purpose: string): number | null {
  const lowerPurpose = purpose.toLowerCase();
  for (const [chKey, def] of Object.entries(profile.channel_plan)) {
    if (def.purpose.toLowerCase().includes(lowerPurpose)) {
      return Number(chKey);
    }
  }
  return null;
}
