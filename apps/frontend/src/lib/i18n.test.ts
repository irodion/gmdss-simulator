import { describe, expect, test } from "vite-plus/test";
import i18n from "../i18n/index.ts";

describe("i18n", () => {
  test("initializes with English", () => {
    expect(i18n.language).toBe("en");
  });

  test("translates app name from common namespace", () => {
    expect(i18n.t("appName")).toBe("GMDSS Simulator");
  });

  test("translates navigation items", () => {
    expect(i18n.t("nav.learn")).toBe("Learn");
    expect(i18n.t("nav.simulator")).toBe("Simulator");
  });

  test("loads auth namespace", () => {
    expect(i18n.t("signIn", { ns: "auth" })).toBe("Sign in");
    expect(i18n.t("signUp", { ns: "auth" })).toBe("Create account");
  });

  test("loads learning namespace", () => {
    expect(i18n.t("modules", { ns: "learning" })).toBe("Modules");
    expect(i18n.t("locked", { ns: "learning" })).toBe("Locked");
  });

  test("loads progress namespace", () => {
    expect(i18n.t("title", { ns: "progress" })).toBe("Progress");
  });

  test("supports interpolation", () => {
    expect(i18n.t("score", { ns: "learning", score: 85 })).toBe("Score: 85%");
  });
});
