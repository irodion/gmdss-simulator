export type DscCategory = "distress" | "urgency" | "safety" | "routine";

export type NatureOfDistress =
  | "fire"
  | "flooding"
  | "collision"
  | "grounding"
  | "capsizing"
  | "sinking"
  | "disabled"
  | "abandoning"
  | "piracy"
  | "mob"
  | "epirb"
  | "undesignated";

/**
 * The canonical ROC nature-of-distress codes shown in the trainer's DSC panel,
 * in radio-menu order. This is the single source of truth for what natures a
 * trainee can select when composing a DSC distress alert.
 *
 * It is the agreed 11-item ROC set (see CONTEXT.md): every {@link NatureOfDistress}
 * value except `epirb` — an EPIRB emission is an automatic alert source, not a
 * nature a Class-D VHF operator manually selects.
 */
export const ROC_NATURE_CODES: readonly NatureOfDistress[] = [
  "undesignated",
  "sinking",
  "collision",
  "fire",
  "disabled",
  "capsizing",
  "flooding",
  "grounding",
  "piracy",
  "abandoning",
  "mob",
];

export const natureOfDistressLabels: Record<NatureOfDistress, string> = {
  fire: "Fire / Explosion",
  flooding: "Flooding",
  collision: "Collision",
  grounding: "Grounding",
  capsizing: "Capsizing",
  sinking: "Sinking",
  disabled: "Disabled and adrift",
  abandoning: "Abandoning ship",
  piracy: "Piracy / Armed robbery",
  mob: "Man overboard",
  epirb: "EPIRB emission",
  undesignated: "Undesignated",
};

export interface DscDistressParams {
  mmsi: string;
  nature: NatureOfDistress;
  position?: { lat: string; lon: string };
  time?: string; // UTC HHmm
}

export interface DscAllShipsParams {
  mmsi: string;
  workingChannel: number;
  position?: { lat: string; lon: string };
}

export type DscUrgencyParams = DscAllShipsParams;
export type DscSafetyParams = DscAllShipsParams;

export interface DscRoutineParams {
  mmsi: string;
  targetMmsi: string;
  workingChannel: number;
}

export interface DscMessageField {
  label: string;
  value: string;
}

export interface DscMessage {
  category: DscCategory;
  fields: DscMessageField[];
  transmitChannel: number;
  switchToChannel?: number;
  summary: string;
}
