import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import type { LessonContent } from "@gmdss-simulator/utils";
import "../../i18n/index.ts";

import { LessonRenderer } from "./LessonRenderer.tsx";

describe("LessonRenderer", () => {
  test("renders text sections", () => {
    const content: LessonContent = {
      version: 1,
      title: "Test Lesson",
      sections: [
        { type: "text", content: "VHF radios operate on frequencies between 156 and 174 MHz." },
      ],
    };
    render(<LessonRenderer content={content} />);
    expect(screen.getByText(/VHF radios operate/)).toBeDefined();
  });

  test("renders callout sections with title and content", () => {
    const content: LessonContent = {
      version: 1,
      title: "Test",
      sections: [
        {
          type: "callout",
          variant: "info",
          title: "Key Fact",
          content: "Channel 16 is the distress frequency.",
        },
      ],
    };
    render(<LessonRenderer content={content} />);
    expect(screen.getByText("Key Fact")).toBeDefined();
    expect(screen.getByText("Channel 16 is the distress frequency.")).toBeDefined();
  });

  test("renders table sections", () => {
    const content: LessonContent = {
      version: 1,
      title: "Test",
      sections: [
        {
          type: "table",
          headers: ["Channel", "Purpose"],
          rows: [
            ["16", "Distress and calling"],
            ["70", "DSC only"],
          ],
        },
      ],
    };
    render(<LessonRenderer content={content} />);
    expect(screen.getByText("Channel")).toBeDefined();
    expect(screen.getByText("Distress and calling")).toBeDefined();
    expect(screen.getByText("DSC only")).toBeDefined();
  });

  test("renders diagram sections with alt text", () => {
    const content: LessonContent = {
      version: 1,
      title: "Test",
      sections: [
        {
          type: "diagram",
          src: "/test.svg",
          alt: "VHF range diagram",
          caption: "Line of sight range",
        },
      ],
    };
    render(<LessonRenderer content={content} />);
    expect(screen.getByAltText("VHF range diagram")).toBeDefined();
    expect(screen.getByText("Line of sight range")).toBeDefined();
  });

  test("renders multiple section types together", () => {
    const content: LessonContent = {
      version: 1,
      title: "Mixed",
      sections: [
        { type: "text", content: "Introduction paragraph." },
        {
          type: "callout",
          variant: "warning",
          title: "Warning",
          content: "Do not transmit on Ch.70.",
        },
        { type: "text", content: "Closing paragraph." },
      ],
    };
    render(<LessonRenderer content={content} />);
    expect(screen.getByText("Introduction paragraph.")).toBeDefined();
    expect(screen.getByText("Warning")).toBeDefined();
    expect(screen.getByText("Closing paragraph.")).toBeDefined();
  });

  test("ignores unknown section types gracefully", () => {
    const content: LessonContent = {
      version: 1,
      title: "Test",
      sections: [
        { type: "text", content: "Valid section." },
        { type: "unknown-type" as any, content: "Should not crash" },
      ],
    };
    render(<LessonRenderer content={content} />);
    expect(screen.getByText("Valid section.")).toBeDefined();
  });
});
