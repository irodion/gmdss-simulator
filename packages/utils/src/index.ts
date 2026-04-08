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

// Radio Domain (Layer 1)
export type {
  PowerLevel,
  TxRxState,
  DscFormState,
  FlipCoverState,
  RadioState,
  RadioCommand,
  RadioEvent,
} from "./radio-types.ts";
export { INITIAL_RADIO_STATE, radioReducer } from "./radio-machine.ts";
export {
  setChannel,
  channelUp,
  channelDown,
  quick16or9,
  toggleDualWatch,
  togglePower,
  setSquelch,
  setVolume,
  pressPtt,
  releasePtt,
  openFlipCover,
  closeFlipCover,
  startDistressHold,
  cancelDistressHold,
  completeDistressHold,
  selectNature,
  beginReceive,
  endReceive,
  setGpsLock,
} from "./radio-commands.ts";
export type { DisplayLines } from "./radio-selectors.ts";
export { displayLines, isVoiceBlocked, isDscOnly, channelFrequency } from "./radio-selectors.ts";
export type { ChannelEntry } from "./channel-table.ts";
export {
  VALID_CHANNELS,
  MIN_CHANNEL,
  MAX_CHANNEL,
  getChannelEntry,
  isValidChannel,
  nextChannel,
  prevChannel,
} from "./channel-table.ts";

// Session Engine (Layer 2)
export type {
  ScenarioTier,
  ScenarioCategory,
  SessionPhase,
  TurnSpeaker,
  ScenarioVessel,
  ResponseCondition,
  ScriptedResponse,
  ScenarioDefinition,
  Turn,
  SessionState,
  SessionCommand,
} from "./scenario-types.ts";
export {
  INITIAL_SESSION_STATE,
  sessionReducer,
  getNextScriptedResponse,
} from "./scenario-machine.ts";
export type {
  ScoringDimensionId,
  ScoringDimension,
  ScoreBreakdown,
  FieldRule,
  ProwordRule,
  SequenceRules,
  ChannelRules,
  RubricDefinition,
} from "./rubric-types.ts";
export { scoreTranscript } from "./rubric-engine.ts";
export {
  getCallingChannel,
  isChannelValidForVoice,
  getWorkingChannel,
} from "./jurisdiction-rules.ts";
