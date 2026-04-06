import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vite-plus/test";

import { App } from "./App.tsx";

describe("App", () => {
  test("renders without crashing", () => {
    render(<App />);
    expect(screen.getByText("GMDSS Simulator")).toBeDefined();
  });
});
