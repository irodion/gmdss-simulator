import type { ToolEmbedTool } from "@gmdss-simulator/utils";
import { TOOL_LABELS } from "../../../lib/tool-defs.ts";
import { ChannelExplorer } from "../tools/ChannelExplorer.tsx";
import { MmsiDecoder } from "../tools/MmsiDecoder.tsx";
import { DscBuilder } from "../tools/DscBuilder.tsx";
import { ScriptBuilder } from "../tools/ScriptBuilder.tsx";

interface Props {
  tool: ToolEmbedTool;
  config?: Record<string, unknown>;
}

export function ToolEmbedSectionView({ tool, config }: Props) {
  return (
    <div className="tool-embed">
      <div className="tool-embed__header">{TOOL_LABELS[tool]}</div>
      {tool === "channel-explorer" && (
        <ChannelExplorer config={config as { jurisdiction?: string }} />
      )}
      {tool === "mmsi-decoder" && <MmsiDecoder config={config as { mmsi?: string }} />}
      {tool === "dsc-builder" && <DscBuilder config={config as { category?: string }} />}
      {tool === "script-builder" && <ScriptBuilder config={config as { scriptType?: string }} />}
    </div>
  );
}
