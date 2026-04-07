export type MmsiStationType =
  | "ship"
  | "coast"
  | "group"
  | "sar_aircraft"
  | "ais_sart"
  | "mob"
  | "epirb";

export interface MmsiDecodeResult {
  valid: boolean;
  mmsi: string;
  stationType?: MmsiStationType;
  mid?: string;
  country?: string;
  description?: string;
  error?: string;
}
