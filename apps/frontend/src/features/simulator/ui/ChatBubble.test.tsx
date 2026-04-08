import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";
import { ChatBubble } from "./ChatBubble.tsx";

describe("ChatBubble", () => {
  test("renders student bubble with correct class", () => {
    const { container } = render(<ChatBubble speaker="student" tag="YOU" text="RADIO CHECK" />);
    expect(screen.getByText("YOU")).not.toBeNull();
    expect(screen.getByText("RADIO CHECK")).not.toBeNull();
    expect(container.querySelector(".sim-bubble--student")).not.toBeNull();
  });

  test("renders station bubble with correct class", () => {
    const { container } = render(<ChatBubble speaker="station" tag="MRCC" text="RECEIVED" />);
    expect(screen.getByText("MRCC")).not.toBeNull();
    expect(container.querySelector(".sim-bubble--station")).not.toBeNull();
  });
});
