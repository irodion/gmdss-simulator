export interface TextSection {
  type: "text";
  content: string;
}

export interface CalloutSection {
  type: "callout";
  variant: "info" | "warning" | "tip";
  title: string;
  content: string;
}

export interface DiagramSection {
  type: "diagram";
  src: string;
  alt: string;
  caption?: string;
}

export interface TableSection {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface ExerciseSection {
  type: "exercise";
  prompt: string;
  options: { key: string; text: string }[];
  answer: string;
  explanation: string;
}

export type ToolEmbedTool = "channel-explorer" | "mmsi-decoder" | "dsc-builder" | "script-builder";

export interface ToolEmbedSection {
  type: "tool-embed";
  tool: ToolEmbedTool;
  config?: Record<string, unknown>;
}

export type Section =
  | TextSection
  | CalloutSection
  | DiagramSection
  | TableSection
  | ExerciseSection
  | ToolEmbedSection;

export interface LessonContent {
  version: number;
  title: string;
  sections: Section[];
}
