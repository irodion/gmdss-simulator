interface Props {
  src: string;
  alt: string;
  caption?: string;
}

export function DiagramSectionView({ src, alt, caption }: Props) {
  return (
    <figure className="diagram">
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption className="diagram__caption">{caption}</figcaption>}
    </figure>
  );
}
