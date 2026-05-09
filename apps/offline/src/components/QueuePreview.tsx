interface QueuePreviewProps {
  readonly weak: number;
  readonly review: number;
  readonly fresh: number;
}

export function QueuePreview({ weak, review, fresh }: QueuePreviewProps) {
  return (
    <p className="queue-preview" aria-live="polite">
      Today: <strong>{weak}</strong> weak · <strong>{review}</strong> review ·{" "}
      <strong>{fresh}</strong> new
    </p>
  );
}
