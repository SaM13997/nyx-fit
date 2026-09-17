/**
 * Single service-worker generator for the Cloudflare Workers build.
 * vite-plugin-pwa skips SW generation for SSR builds (TanStack Start), so this
 * post-build step owns dist/client/sw.js.
 *
 * Scope: static assets and fonts. Authenticated HTML, API routes and server
 * functions stay network-only, so there is no navigation fallback or page cache.
 */
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSW } from "workbox-build";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const globDirectory = path.join(root, "dist/client");

const workboxConfig = {
  globPatterns: ["**/*.{ico,png,svg,webp,woff2,json}"],
  // Splash images are consumed by the native iOS shell and onboarding art is first-run
  // UI served from the edge; neither is needed for precaching.
  globIgnores: ["favicon/splash/**", "onboarding/**"],
  cleanupOutdatedCaches: true,
  // Activate the new worker immediately so the legacy page cache is purged without
  // waiting for every open client to close. No navigation cache exists to interrupt.
  skipWaiting: true,
  clientsClaim: true,
  sourcemap: false,
  importScripts: ["/sw-cleanup.js"],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-stylesheets",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
};

const legacyCleanupSource = `self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("nyx-pages"));
});
`;

if (!existsSync(globDirectory)) {
  throw new Error(`Missing build output directory: ${globDirectory}`);
}

await writeFile(path.join(globDirectory, "sw-cleanup.js"), legacyCleanupSource);

const { count, size, warnings } = await generateSW({
  ...workboxConfig,
  globDirectory,
  swDest: path.join(globDirectory, "sw.js"),
});

console.log(
  `Generated dist/client/sw.js — ${count} files, ${size} bytes precached`
);
for (const warning of warnings) {
  console.warn(warning);
}
