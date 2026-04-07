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
