export const TOOLS = [
  { id: "channel-explorer", icon: "📡", i18nKey: "channelExplorer" },
  { id: "mmsi-decoder", icon: "🔢", i18nKey: "mmsiDecoder" },
  { id: "dsc-builder", icon: "📨", i18nKey: "dscBuilder" },
  { id: "script-builder", icon: "📝", i18nKey: "scriptBuilder" },
] as const;

export type ToolId = (typeof TOOLS)[number]["id"];

export const TOOL_LABELS: Record<ToolId, string> = {
  "channel-explorer": "Channel Explorer",
  "mmsi-decoder": "MMSI Decoder",
  "dsc-builder": "DSC Builder",
  "script-builder": "Script Builder",
};
