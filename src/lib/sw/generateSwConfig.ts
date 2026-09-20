import type { RuntimeCaching } from "workbox-build";

export const SW_CLEANUP_SOURCE = `self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("nyx-pages"));
});
`;

export const SW_NOTIFICATIONS_SOURCE = `self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = typeof data.url === "string" ? data.url : null;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const client = clientList[0];

        if (!client) {
          if (self.clients.openWindow) {
            return self.clients.openWindow(targetUrl || "/");
          }
          return undefined;
        }

        const focus = client.focus();
        if (targetUrl && "navigate" in client) {
          return client.navigate(targetUrl).catch(() => focus);
        }
        return focus;
      })
  );
});
`;

type WorkboxConfig = {
  globPatterns: string[];
  globIgnores: string[];
  cleanupOutdatedCaches: boolean;
  skipWaiting: boolean;
  clientsClaim: boolean;
  sourcemap: boolean;
  importScripts: string[];
  // RuntimeCaching[] (not unknown[]) so handler: "CacheFirst" is contextually
  // typed as a workbox StrategyName; still assignable to unknown[] consumers.
  runtimeCaching: RuntimeCaching[];
};

export function buildWorkboxConfig(): WorkboxConfig {
  return {
    globPatterns: ["**/*.{ico,png,svg,webp,woff2,json}"],
    globIgnores: ["favicon/splash/**", "onboarding/**"],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
    sourcemap: false,
    importScripts: ["/sw-cleanup.js", "/sw-notifications.js"],
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
}
