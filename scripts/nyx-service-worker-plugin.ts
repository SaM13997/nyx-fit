import { existsSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { generateSW } from "workbox-build";

const workboxOptions = {
  globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,json}"],
  navigateFallbackDenylist: [/^\/api/, /^\/convex/],
  runtimeCaching: [
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.mode === "navigate",
      handler: "NetworkFirst" as const,
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
      handler: "CacheFirst" as const,
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
      handler: "CacheFirst" as const,
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

/** Generate SW in dist/client before Nitro copies static assets. */
export function nyxServiceWorkerPlugin(): Plugin {
  return {
    name: "nyx-service-worker",
    apply: "build",
    enforce: "post",
    applyToEnvironment(environment) {
      return environment.name === "client";
    },
    async closeBundle() {
      const globDirectory = path.resolve("dist/client");
      if (!existsSync(globDirectory)) return;

      const { count, size } = await generateSW({
        ...workboxOptions,
        globDirectory,
        swDest: path.join(globDirectory, "sw.js"),
      });

      console.log(
        `[nyx-service-worker] dist/client/sw.js — ${count} files, ${size} bytes precached`
      );
    },
  };
}
