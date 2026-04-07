export function greet() {
  return "Hello from @gmdss-simulator/utils!";
}

export type { ChannelDefinition, JurisdictionProfile } from "./jurisdiction-types.ts";
export { validateJurisdiction } from "./jurisdiction-validate.ts";
export type {
  LessonContent,
  Section,
  TextSection,
  CalloutSection,
  DiagramSection,
  TableSection,
  ExerciseSection,
  ToolEmbedSection,
  ToolEmbedTool,
} from "./lesson-content-types.ts";
export type { MmsiStationType, MmsiDecodeResult } from "./mmsi-types.ts";
export { decodeMmsi } from "./mmsi-decoder.ts";
export { midTable } from "./mid-table.ts";
export type {
  DscCategory,
  NatureOfDistress,
  DscAllShipsParams,
  DscDistressParams,
  DscUrgencyParams,
  DscSafetyParams,
  DscRoutineParams,
  DscMessage,
  DscMessageField,
} from "./dsc-types.ts";
export { natureOfDistressLabels } from "./dsc-types.ts";
export {
  buildDistressDsc,
  buildUrgencyDsc,
  buildSafetyDsc,
  buildRoutineDsc,
  buildDscMessage,
  formatMmsi,
} from "./dsc-builder.ts";
export type {
  MaydayParams,
  PanPanParams,
  SecuriteParams,
  MedicoParams,
  ScriptType,
} from "./script-types.ts";
export {
  buildMaydayScript,
  buildPanPanScript,
  buildSecuriteScript,
  buildMedicoScript,
} from "./script-builder.ts";
