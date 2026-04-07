interface Props {
  variant: "info" | "warning" | "tip";
  title: string;
  content: string;
}

export function CalloutSectionView({ variant, title, content }: Props) {
  return (
    <div className={`callout callout--${variant}`}>
      <div className="callout__title">{title}</div>
      <div className="callout__content">{content}</div>
    </div>
  );
}
