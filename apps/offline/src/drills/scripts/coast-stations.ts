/**
 * The coast stations a trainee can address in an Individual DSC call. A single
 * shared roster doubles as the addressee picker and the distractor set, the way
 * `CHANNEL_OPTIONS` does for channels (see DscPanel). A Scenario's
 * `dsc.addressee` references one of these by `id`.
 *
 * MMSIs follow the maritime coast-station format (00 + MID + four digits) and
 * are illustrative — realistic in shape, not an authoritative directory.
 */
export interface CoastStation {
  readonly id: string;
  readonly name: string;
  /** Maritime Mobile Service Identity, grouped for readability (e.g. "004 280 001"). */
  readonly mmsi: string;
}

export const COAST_STATIONS: readonly CoastStation[] = [
  { id: "haifa_radio", name: "Haifa Radio", mmsi: "004 280 001" },
  { id: "rcc_haifa", name: "RCC Haifa", mmsi: "004 280 099" },
  { id: "ashdod_port", name: "Ashdod Port Control", mmsi: "004 280 020" },
  { id: "limassol_radio", name: "Limassol Radio", mmsi: "002 091 000" },
  { id: "cyprus_radio", name: "Cyprus Radio", mmsi: "002 090 000" },
];

const STATIONS_BY_ID: ReadonlyMap<string, CoastStation> = new Map(
  COAST_STATIONS.map((s) => [s.id, s]),
);

/**
 * Display name for an addressee id, falling back to the raw id for content that
 * references a station not in the roster (surfaced rather than hidden).
 */
export function coastStationName(id: string | null): string {
  if (id == null) return "none";
  return STATIONS_BY_ID.get(id)?.name ?? id;
}
