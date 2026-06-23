/**
 * Generate service worker for TanStack Start + Nitro.
 * vite-plugin-pwa skips SW generation when build.ssr === true (TanStack Start).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSW } from "workbox-build";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const workboxConfig = {
  globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,json}"],
  navigateFallback: "/index.html",
  navigateFallbackDenylist: [/^\/api/, /^\/convex/],
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "nyx-pages",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
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

async function generateForDirectory(relativeDir) {
  const globDirectory = path.join(root, relativeDir);
  if (!existsSync(globDirectory)) {
    console.log(`Skipping ${relativeDir} (not found)`);
    return;
  }

  const { count, size, warnings } = await generateSW({
    ...workboxConfig,
    globDirectory,
    swDest: path.join(globDirectory, "sw.js"),
  });

  console.log(
    `Generated ${relativeDir}/sw.js — ${count} files, ${size} bytes precached`
  );
  for (const warning of warnings) {
    console.warn(warning);
  }
}

await generateForDirectory(".output/public");
await generateForDirectory("dist/client");
