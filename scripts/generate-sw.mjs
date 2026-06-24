import { generateSW } from "workbox-build";
import path from "node:path";

/**
 * Generate a Workbox service worker into the client build output so Nitro
 * includes it in `.output/public` (TanStack Start skips vite-plugin-pwa SW).
 */
export async function generateServiceWorker(publicDir) {
  const { count, size, warnings } = await generateSW({
    swDest: path.join(publicDir, "sw.js"),
    globDirectory: publicDir,
    globPatterns: [
      "**/*.{js,css,html,ico,png,svg,webp,woff2,json}",
      "!sw.js",
      "!sw.js.map",
      "!workbox-*.js",
      "!workbox-*.js.map",
    ],
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "nyx-pages",
          networkTimeoutSeconds: 3,
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
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
    ],
  });

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`[generate-sw] ${warning}`);
    }
  }

  console.log(
    `[generate-sw] Wrote sw.js with ${count} precache entries (${size} bytes)`,
  );
}
