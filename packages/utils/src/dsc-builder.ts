import type {
  DscAllShipsParams,
  DscCategory,
  DscDistressParams,
  DscMessage,
  DscMessageField,
  DscRoutineParams,
  DscSafetyParams,
  DscUrgencyParams,
} from "./dsc-types.ts";
import { natureOfDistressLabels } from "./dsc-types.ts";

export function buildDistressDsc(params: DscDistressParams): DscMessage {
  const fields: DscMessageField[] = [
    { label: "Format specifier", value: "Distress" },
    { label: "Self-ID (MMSI)", value: formatMmsi(params.mmsi) },
    { label: "Nature of distress", value: natureOfDistressLabels[params.nature] },
  ];

  if (params.position) {
    fields.push({ label: "Position", value: `${params.position.lat} ${params.position.lon}` });
  }

  if (params.time) {
    fields.push({ label: "Time (UTC)", value: formatTime(params.time) });
  }

  fields.push({ label: "Telecommand", value: "J3E Telephony (Ch.16)" });
  fields.push({ label: "EOS", value: "End of sequence" });

  return {
    category: "distress",
    fields,
    transmitChannel: 70,
    switchToChannel: 16,
    summary: `DSC Distress alert: ${natureOfDistressLabels[params.nature]}. Transmitted on Ch.70, auto-switch to Ch.16 for voice MAYDAY.`,
  };
}

function buildAllShipsDsc(
  category: "urgency" | "safety",
  voiceProcedure: string,
  params: DscAllShipsParams,
): DscMessage {
  const fields: DscMessageField[] = [
    { label: "Format specifier", value: "All ships" },
    { label: "Category", value: category.charAt(0).toUpperCase() + category.slice(1) },
    { label: "Self-ID (MMSI)", value: formatMmsi(params.mmsi) },
    { label: "Telecommand", value: `J3E Telephony (Ch.${params.workingChannel})` },
  ];

  if (params.position) {
    fields.push({ label: "Position", value: `${params.position.lat} ${params.position.lon}` });
  }

  fields.push({ label: "Working channel", value: `Ch.${params.workingChannel}` });
  fields.push({ label: "EOS", value: "End of sequence" });

  return {
    category,
    fields,
    transmitChannel: 70,
    switchToChannel: params.workingChannel,
    summary: `DSC ${category.charAt(0).toUpperCase() + category.slice(1)} call to all ships. Transmitted on Ch.70, switch to Ch.${params.workingChannel} for voice ${voiceProcedure}.`,
  };
}

export function buildUrgencyDsc(params: DscUrgencyParams): DscMessage {
  return buildAllShipsDsc("urgency", "PAN PAN", params);
}

export function buildSafetyDsc(params: DscSafetyParams): DscMessage {
  return buildAllShipsDsc("safety", "SECURITE", params);
}

export function buildRoutineDsc(params: DscRoutineParams): DscMessage {
  const fields: DscMessageField[] = [
    { label: "Format specifier", value: "Individual" },
    { label: "Category", value: "Routine" },
    { label: "Address (Target MMSI)", value: formatMmsi(params.targetMmsi) },
    { label: "Self-ID (MMSI)", value: formatMmsi(params.mmsi) },
    { label: "Telecommand", value: `J3E Telephony (Ch.${params.workingChannel})` },
    { label: "Working channel", value: `Ch.${params.workingChannel}` },
    { label: "EOS", value: "End of sequence" },
  ];

  return {
    category: "routine",
    fields,
    transmitChannel: 70,
    switchToChannel: params.workingChannel,
    summary: `DSC Routine call to ${formatMmsi(params.targetMmsi)}. Transmitted on Ch.70, switch to Ch.${params.workingChannel}.`,
  };
}

export function buildDscMessage(
  category: DscCategory,
  params: DscDistressParams | DscUrgencyParams | DscRoutineParams,
): DscMessage {
  switch (category) {
    case "distress":
      return buildDistressDsc(params as DscDistressParams);
    case "urgency":
      return buildUrgencyDsc(params as DscUrgencyParams);
    case "safety":
      return buildSafetyDsc(params as DscSafetyParams);
    case "routine":
      return buildRoutineDsc(params as DscRoutineParams);
  }
}

export function formatMmsi(mmsi: string): string {
  return mmsi.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
}

function formatTime(time: string): string {
  if (time.length === 4) {
    return `${time.substring(0, 2)}:${time.substring(2)} UTC`;
  }
  return time;
}
