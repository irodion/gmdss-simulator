import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vite-plus/test";
import "../../../i18n/index.ts";

// Mock the tool components
vi.mock("./ChannelExplorer.tsx", () => ({
  ChannelExplorer: () => <div>ChannelExplorerMock</div>,
}));
vi.mock("./MmsiDecoder.tsx", () => ({
  MmsiDecoder: () => <div>MmsiDecoderMock</div>,
}));
vi.mock("./DscBuilder.tsx", () => ({
  DscBuilder: () => <div>DscBuilderMock</div>,
}));
vi.mock("./ScriptBuilder.tsx", () => ({
  ScriptBuilder: () => <div>ScriptBuilderMock</div>,
}));

import { ChannelExplorerPage } from "./ChannelExplorerPage.tsx";
import { MmsiDecoderPage } from "./MmsiDecoderPage.tsx";
import { DscBuilderPage } from "./DscBuilderPage.tsx";
import { ScriptBuilderPage } from "./ScriptBuilderPage.tsx";

describe("Tool page wrappers", () => {
  test("ChannelExplorerPage renders title and component", () => {
    render(<ChannelExplorerPage />);
    expect(screen.getByText("Channel Explorer")).toBeDefined();
    expect(screen.getByText("ChannelExplorerMock")).toBeDefined();
  });

  test("MmsiDecoderPage renders title and component", () => {
    render(<MmsiDecoderPage />);
    expect(screen.getByText("MMSI Decoder")).toBeDefined();
    expect(screen.getByText("MmsiDecoderMock")).toBeDefined();
  });

  test("DscBuilderPage renders title and component", () => {
    render(<DscBuilderPage />);
    expect(screen.getByText("DSC Builder")).toBeDefined();
    expect(screen.getByText("DscBuilderMock")).toBeDefined();
  });

  test("ScriptBuilderPage renders title and component", () => {
    render(<ScriptBuilderPage />);
    expect(screen.getByText("Script Builder")).toBeDefined();
    expect(screen.getByText("ScriptBuilderMock")).toBeDefined();
  });
});
