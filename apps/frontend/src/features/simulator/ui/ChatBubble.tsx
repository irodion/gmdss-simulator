interface ChatBubbleProps {
  speaker: "student" | "station";
  tag: string;
  text: string;
}

export function ChatBubble({ speaker, tag, text }: ChatBubbleProps) {
  const className =
    speaker === "student" ? "sim-bubble sim-bubble--student" : "sim-bubble sim-bubble--station";
  return (
    <div className={className}>
      <span className="sim-bubble__tag">{tag}</span>
      <div className="sim-bubble__text">{text}</div>
    </div>
  );
}
