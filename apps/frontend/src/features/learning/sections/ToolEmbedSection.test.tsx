import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import "../../../i18n/index.ts";

import { ToolEmbedSectionView } from "./ToolEmbedSection.tsx";

vi.mock("../tools/ChannelExplorer.tsx", () => ({
  ChannelExplorer: () => <div data-testid="channel-explorer">ChannelExplorer</div>,
}));
vi.mock("../tools/MmsiDecoder.tsx", () => ({
  MmsiDecoder: () => <div data-testid="mmsi-decoder">MmsiDecoder</div>,
}));
vi.mock("../tools/DscBuilder.tsx", () => ({
  DscBuilder: () => <div data-testid="dsc-builder">DscBuilder</div>,
}));
vi.mock("../tools/ScriptBuilder.tsx", () => ({
  ScriptBuilder: () => <div data-testid="script-builder">ScriptBuilder</div>,
}));

describe("ToolEmbedSectionView", () => {
  test("renders Channel Explorer embed", () => {
    render(<ToolEmbedSectionView tool="channel-explorer" />);
    expect(screen.getByTestId("channel-explorer")).toBeDefined();
    expect(screen.getByText("Channel Explorer")).toBeDefined();
  });

  test("renders MMSI Decoder embed", () => {
    render(<ToolEmbedSectionView tool="mmsi-decoder" />);
    expect(screen.getByTestId("mmsi-decoder")).toBeDefined();
  });

  test("renders DSC Builder embed", () => {
    render(<ToolEmbedSectionView tool="dsc-builder" />);
    expect(screen.getByTestId("dsc-builder")).toBeDefined();
  });

  test("renders Script Builder embed", () => {
    render(<ToolEmbedSectionView tool="script-builder" />);
    expect(screen.getByTestId("script-builder")).toBeDefined();
  });
});
