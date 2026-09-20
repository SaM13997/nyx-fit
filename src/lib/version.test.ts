import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "./version";

describe("app version", () => {
  it("matches the package.json version", () => {
    const raw = readFileSync(
      new URL("../../package.json", import.meta.url),
      "utf8",
    );
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("package.json is not an object.");
    }
    const version = (parsed as Record<string, unknown>).version;
    expect(version).toBe(APP_VERSION);
  });
});
