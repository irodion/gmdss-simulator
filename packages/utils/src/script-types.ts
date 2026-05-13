export interface MaydayParams {
  vesselName: string;
  callsign?: string;
  mmsi?: string;
  position: string;
  natureOfDistress: string;
  assistanceRequired: string;
  personsOnBoard: number;
  additionalInfo?: string;
}

export interface PanPanParams {
  vesselName: string;
  callsign?: string;
  mmsi?: string;
  position: string;
  natureOfUrgency: string;
  assistanceRequired?: string;
  personsOnBoard?: number;
  additionalInfo?: string;
}

export interface SecuriteParams {
  stationName: string;
  infoChannel?: number;
  natureOfSafety: string;
  details: string;
}

export interface MedicoParams {
  vesselName: string;
  callsign?: string;
  mmsi?: string;
  position: string;
  patientDetails: string;
  assistanceRequired: string;
  addressee?: string;
}

export type ScriptType = "mayday" | "pan-pan" | "securite" | "medico";
