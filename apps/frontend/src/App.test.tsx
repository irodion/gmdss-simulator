import { render, screen } from "@testing-library/react";
import { expect, test } from "vite-plus/test";
import { App } from "./App.tsx";

test("app renders without crashing", () => {
  render(<App />);
  expect(screen.getByText("GMDSS Simulator")).toBeDefined();
});
