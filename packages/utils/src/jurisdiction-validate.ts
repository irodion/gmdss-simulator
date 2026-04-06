import type { JurisdictionProfile } from "./jurisdiction-types.ts";

export function validateJurisdiction(profile: JurisdictionProfile): string[] {
  const errors: string[] = [];

  if (!profile.id) {
    errors.push("id is required");
  }

  if (!profile.label) {
    errors.push("label is required");
  }

  if (!profile.channel_plan || Object.keys(profile.channel_plan).length === 0) {
    errors.push("channel_plan must have at least one channel");
  }

  if (profile.calling_channel == null) {
    errors.push("calling_channel is required");
  } else if (!profile.channel_plan[String(profile.calling_channel)]) {
    errors.push(`calling_channel ${profile.calling_channel} is not in channel_plan`);
  }

  if (profile.dsc_channel == null) {
    errors.push("dsc_channel is required");
  } else if (!profile.channel_plan[String(profile.dsc_channel)]) {
    errors.push(`dsc_channel ${profile.dsc_channel} is not in channel_plan`);
  }

  for (const [ch, def] of Object.entries(profile.channel_plan)) {
    if (!def.purpose) {
      errors.push(`channel ${ch}: purpose is required`);
    }
    if (def.type !== "voice" && def.type !== "dsc_only") {
      errors.push(`channel ${ch}: type must be "voice" or "dsc_only"`);
    }
  }

  return errors;
}
