import { expect, test } from "vite-plus/test";
import { greet } from "../src/index.ts";

test("greet returns utils package greeting", () => {
  expect(greet()).toBe("Hello from @gmdss-simulator/utils!");
});
