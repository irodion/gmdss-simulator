interface Props {
  content: string;
}

export function TextSectionView({ content }: Props) {
  return (
    <div className="lesson-section">
      <p>{content}</p>
    </div>
  );
}
