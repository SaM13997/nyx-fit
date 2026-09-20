import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateSW } from "workbox-build";
import {
  buildWorkboxConfig,
  SHELL_URL_PATTERN,
  SW_NOTIFICATIONS_SOURCE,
} from "./generateSwConfig";

describe("service worker generation config", () => {
  it("wires the notification click handler alongside the cleanup script", () => {
    const config = buildWorkboxConfig();
    expect(config.importScripts).toEqual([
      "/sw-cleanup.js",
      "/sw-notifications.js",
    ]);
  });

  it("focuses an existing window and only opens one when no window client exists", () => {
    expect(SW_NOTIFICATIONS_SOURCE).toContain(
      'self.addEventListener("notificationclick"',
    );
    expect(SW_NOTIFICATIONS_SOURCE).toContain("event.notification.close()");
    expect(SW_NOTIFICATIONS_SOURCE).toContain(
      'matchAll({ type: "window", includeUncontrolled: true })',
    );
    expect(SW_NOTIFICATIONS_SOURCE).toContain('openWindow(targetUrl || "/")');
    expect(SW_NOTIFICATIONS_SOURCE).toContain("client.focus()");
  });

  it("generates a service worker that imports the handler", async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), "nyx-sw-"));
    await writeFile(path.join(workDir, "favicon-96x96.png"), "png");
    const { warnings } = await generateSW({
      ...buildWorkboxConfig(),
      globDirectory: workDir,
      swDest: path.join(workDir, "sw.js"),
    });

    expect(warnings).toEqual([]);
    const generated = await readFile(path.join(workDir, "sw.js"), "utf8");
    expect(generated).toContain('"/sw-notifications.js"');
  });
});

describe("offline shell route", () => {
  it("matches only the bare origin root URL", () => {
    expect(SHELL_URL_PATTERN.test("https://nyx-fit.example.com/")).toBe(true);
    expect(SHELL_URL_PATTERN.test("https://nyx-fit.example.com")).toBe(true);
    expect(SHELL_URL_PATTERN.test("http://localhost:3000/")).toBe(true);
    expect(SHELL_URL_PATTERN.test("https://nyx-fit.example.com/workouts")).toBe(
      false,
    );
    expect(
      SHELL_URL_PATTERN.test("https://nyx-fit.example.com/api/auth/session"),
    ).toBe(false);
    expect(
      SHELL_URL_PATTERN.test("https://nyx-fit.example.com/?redirect=%2Fstats"),
    ).toBe(false);
  });

  it("caches the root document network-first so an offline cold start can serve the last shell", async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), "nyx-sw-"));
    await writeFile(path.join(workDir, "favicon-96x96.png"), "png");
    await generateSW({
      ...buildWorkboxConfig(),
      globDirectory: workDir,
      swDest: path.join(workDir, "sw.js"),
    });

    const generated = await readFile(path.join(workDir, "sw.js"), "utf8");
    expect(generated).toContain("nyx-shell");
    expect(generated).toContain("NetworkFirst");
  });
});
