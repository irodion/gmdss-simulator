import { isProcedureItem, type SequenceItem, type SequenceTemplate } from "./types.ts";

function isVoiceCallItem(id: string): boolean {
  // The dsc_ prefix guard is a forward-compat catch for future DSC IDs that
  // get added to rubric data before being registered in types.ts's
  // PROCEDURE_STEP_IDS. working_channel_switch is a MEDICO-specific procedural
  // action kept out of PROCEDURE_STEP_IDS so it stays in the content pool group
  // rather than the dashed-italic procedure group.
  if (isProcedureItem(id)) return false;
  if (id.startsWith("dsc_")) return false;
  if (id === "working_channel_switch") return false;
  return true;
}

function normalizePositionLabel(label: string): string {
  return label
    .replace(/°/g, " degrees ")
    .replace(/[′']/g, " minutes ")
    .replace(/\bN\b/g, " north")
    .replace(/\bS\b/g, " south")
    .replace(/\bE\b/g, " east")
    .replace(/\bW\b/g, " west")
    .replace(/\s+/g, " ")
    .trim();
}

function spokenLabel(item: SequenceItem): string {
  if (item.id === "position") return normalizePositionLabel(item.label);
  return item.label;
}

/**
 * Build the canonical voice-call radio transmission for a materialized
 * scenario. Procedural setup items (DSC steps, EPIRB, channel switches,
 * abandon-to-raft) are filtered out so only the spoken-radio portion remains.
 *
 * Adjacent duplicates (e.g. MAYDAY ×4, vessel ×3) are kept as comma-separated
 * repeats — the resulting comma pauses match real radio cadence.
 */
export function buildSpokenTransmission(template: SequenceTemplate): string {
  const phaseStrings: string[] = [];
  for (const part of template.parts) {
    const voiceLabels = part.items.filter((i) => isVoiceCallItem(i.id)).map(spokenLabel);
    if (voiceLabels.length === 0) continue;
    phaseStrings.push(voiceLabels.join(", "));
  }
  return phaseStrings.join(". ");
}
