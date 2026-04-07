import type { LessonContent, Section } from "@gmdss-simulator/utils";
import { TextSectionView } from "./sections/TextSection.tsx";
import { CalloutSectionView } from "./sections/CalloutSection.tsx";
import { DiagramSectionView } from "./sections/DiagramSection.tsx";
import { TableSectionView } from "./sections/TableSection.tsx";
import { ExerciseSectionView } from "./sections/ExerciseSection.tsx";
import { ToolEmbedSectionView } from "./sections/ToolEmbedSection.tsx";
import "../../styles/pages.css";

interface Props {
  content: LessonContent;
}

function renderSection(section: Section, index: number) {
  switch (section.type) {
    case "text":
      return <TextSectionView key={index} content={section.content} />;
    case "callout":
      return (
        <CalloutSectionView
          key={index}
          variant={section.variant}
          title={section.title}
          content={section.content}
        />
      );
    case "diagram":
      return (
        <DiagramSectionView
          key={index}
          src={section.src}
          alt={section.alt}
          caption={section.caption}
        />
      );
    case "table":
      return <TableSectionView key={index} headers={section.headers} rows={section.rows} />;
    case "exercise":
      return (
        <ExerciseSectionView
          key={index}
          prompt={section.prompt}
          options={section.options}
          answer={section.answer}
          explanation={section.explanation}
        />
      );
    case "tool-embed":
      return <ToolEmbedSectionView key={index} tool={section.tool} config={section.config} />;
    default:
      return null;
  }
}

export function LessonRenderer({ content }: Props) {
  return (
    <div className="lesson-content">
      {content.sections.map((section, i) => renderSection(section, i))}
    </div>
  );
}
