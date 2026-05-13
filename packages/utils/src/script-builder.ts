import type { MaydayParams, MedicoParams, PanPanParams, SecuriteParams } from "./script-types.ts";

export function buildMaydayScript(params: MaydayParams): string {
  const lines: string[] = [
    "MAYDAY MAYDAY MAYDAY",
    `THIS IS`,
    `${params.vesselName.toUpperCase()} ${params.vesselName.toUpperCase()} ${params.vesselName.toUpperCase()}`,
  ];

  if (params.callsign) {
    lines.push(`Callsign ${params.callsign.toUpperCase()}`);
  }
  if (params.mmsi) {
    lines.push(`MMSI ${params.mmsi}`);
  }

  lines.push(
    "",
    "MAYDAY",
    "THIS IS",
    `${params.vesselName.toUpperCase()}`,
    `My position is ${params.position}`,
    `I am ${params.natureOfDistress}`,
    `I require ${params.assistanceRequired}`,
    `${params.personsOnBoard} persons on board`,
  );

  if (params.additionalInfo) {
    lines.push(params.additionalInfo);
  }

  lines.push("", "OVER");

  return lines.join("\n");
}

export function buildPanPanScript(params: PanPanParams): string {
  const lines: string[] = [
    "PAN PAN PAN PAN PAN PAN",
    "ALL STATIONS ALL STATIONS ALL STATIONS",
    "THIS IS",
    `${params.vesselName.toUpperCase()} ${params.vesselName.toUpperCase()} ${params.vesselName.toUpperCase()}`,
  ];

  if (params.callsign) {
    lines.push(`Callsign ${params.callsign.toUpperCase()}`);
  }
  if (params.mmsi) {
    lines.push(`MMSI ${params.mmsi}`);
  }

  lines.push("", `My position is ${params.position}`, `${params.natureOfUrgency}`);

  if (params.assistanceRequired) {
    lines.push(`I require ${params.assistanceRequired}`);
  }
  if (params.personsOnBoard !== undefined) {
    lines.push(`${params.personsOnBoard} persons on board`);
  }
  if (params.additionalInfo) {
    lines.push(params.additionalInfo);
  }

  lines.push("", "OVER");

  return lines.join("\n");
}

export function buildSecuriteScript(params: SecuriteParams): string {
  const lines: string[] = [
    "SECURITE SECURITE SECURITE",
    "ALL STATIONS ALL STATIONS ALL STATIONS",
    "THIS IS",
    `${params.stationName.toUpperCase()} ${params.stationName.toUpperCase()} ${params.stationName.toUpperCase()}`,
  ];

  if (params.infoChannel) {
    lines.push(`For safety information listen on Channel ${params.infoChannel}`);
  }

  lines.push("", `${params.natureOfSafety}`, `${params.details}`, "", "OUT");

  return lines.join("\n");
}

export function buildMedicoScript(params: MedicoParams): string {
  const lines: string[] = [
    "PAN PAN PAN PAN PAN PAN",
    "ALL STATIONS ALL STATIONS ALL STATIONS",
    "THIS IS",
    `${params.vesselName.toUpperCase()} ${params.vesselName.toUpperCase()} ${params.vesselName.toUpperCase()}`,
  ];

  if (params.callsign) {
    lines.push(`Callsign ${params.callsign.toUpperCase()}`);
  }
  if (params.mmsi) {
    lines.push(`MMSI ${params.mmsi}`);
  }

  lines.push(
    "",
    `My position is ${params.position}`,
    "I require medical advice",
    `${params.patientDetails}`,
    `${params.assistanceRequired}`,
    "",
    "OVER",
  );

  return lines.join("\n");
}
