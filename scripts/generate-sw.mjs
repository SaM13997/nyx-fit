/**
 * Single service-worker generator for the Cloudflare Workers build.
 * vite-plugin-pwa skips SW generation for SSR builds (TanStack Start), so this
 * post-build step owns dist/client/sw.js.
 *
 * Scope: static assets, fonts, and the notificationclick handler (shared
 * source in src/lib/sw/generateSwConfig.ts). Authenticated HTML, API routes
 * and server functions stay network-only.
 */
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSW } from "workbox-build";
import {
  buildWorkboxConfig,
  SW_CLEANUP_SOURCE,
  SW_NOTIFICATIONS_SOURCE,
} from "../src/lib/sw/generateSwConfig.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const globDirectory = path.join(root, "dist/client");

if (!existsSync(globDirectory)) {
  throw new Error(`Missing build output directory: ${globDirectory}`);
}

await writeFile(path.join(globDirectory, "sw-cleanup.js"), SW_CLEANUP_SOURCE);
await writeFile(
  path.join(globDirectory, "sw-notifications.js"),
  SW_NOTIFICATIONS_SOURCE,
);

const { count, size, warnings } = await generateSW({
  ...buildWorkboxConfig(),
  globDirectory,
  swDest: path.join(globDirectory, "sw.js"),
});

console.log(
  `Generated dist/client/sw.js — ${count} files, ${size} bytes precached`
);
for (const warning of warnings) {
  console.warn(warning);
}
