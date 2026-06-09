import type { SequenceItem, SequenceTemplate } from "./types.ts";

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
 * scenario. A Scenario's template now carries only spoken-radio chips (the
 * DSC/equipment phase is owned by the panel, see ADR 0002), so every item is
 * spoken.
 *
 * Adjacent duplicates (e.g. MAYDAY ×4, vessel ×3) are kept as comma-separated
 * repeats — the resulting comma pauses match real radio cadence.
 */
export function buildSpokenTransmission(template: SequenceTemplate): string {
  const phaseStrings: string[] = [];
  for (const part of template.parts) {
    if (part.items.length === 0) continue;
    phaseStrings.push(part.items.map(spokenLabel).join(", "));
  }
  return phaseStrings.join(". ");
}
