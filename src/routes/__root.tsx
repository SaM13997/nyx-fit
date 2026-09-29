/// <reference types="vite/client" />
import * as React from "react";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { ActionDock } from "../components/dock/ActionDock";
import { QueryClient } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { fetchAuth } from "@/lib/api/auth.functions";
import { useApiUserCache } from "@/lib/api/hooks";
import { AppearanceProvider } from "@/lib/AppearanceContext";
import { ToastProvider } from "@/lib/toast";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { IOS_SPLASH_LINKS } from "@/lib/iosSplashLinks";
import appCss from "../styles.css?url";

const Agentation = import.meta.env.DEV
  ? React.lazy(async () => {
      const { Agentation } = await import("agentation");

      return { default: Agentation };
    })
  : null;

const Devtools = import.meta.env.DEV
  ? React.lazy(async () => {
      const [{ TanStackDevtools }, { TanStackRouterDevtoolsPanel }] =
        await Promise.all([
          import("@tanstack/react-devtools"),
          import("@tanstack/react-router-devtools"),
        ]);

      return {
        default: function DevtoolsComponent() {
          return (
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          );
        },
      };
    })
  : null;

type AuthContext = { userId: string | null };

let lastClientAuth: AuthContext | null = null;

async function loadAuth(): Promise<AuthContext> {
  try {
    const { userId } = await fetchAuth();
    if (typeof window !== "undefined") lastClientAuth = { userId };
    return { userId };
  } catch {
    return { userId: null };
  }
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        name: "theme-color",
        content: "#000000",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Nyx Fitness",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Titillium+Web:wght@400;600;700&display=swap",
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon/favicon-96x96.png",
        sizes: "96x96",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon/favicon.svg",
      },
      {
        rel: "shortcut icon",
        href: "/favicon/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        href: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      ...IOS_SPLASH_LINKS.map((splash) => ({
        rel: "apple-touch-startup-image" as const,
        href: splash.href,
        media: splash.media,
      })),
    ],
  }),
  beforeLoad: async () => {
    // On the client, navigations reuse the last resolved auth and refresh it
    // in the background, so route transitions start on tap instead of after
    // a network round trip.
    if (typeof window !== "undefined" && lastClientAuth) {
      void loadAuth();
      return lastClientAuth;
    }
    return loadAuth();
  },
  component: RootComponent,
});

function RootComponent() {
  useApiUserCache();

  return (
    <MotionConfig reducedMotion="user">
      <AppearanceProvider>
        <ToastProvider>
          <RootDocument>
            <ServiceWorkerRegistration />
            <OfflineBanner />
            <Outlet />
            <InstallPrompt />
          </RootDocument>
        </ToastProvider>
      </AppearanceProvider>
    </MotionConfig>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <title>Nyx Fitness</title>
      </head>
      <body className="bg-background">
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-x-clip">
          <div className="flex flex-1 flex-col">{children}</div>
          <ActionDock />
          {Devtools ? (
            <React.Suspense fallback={null}>
              <Devtools />
            </React.Suspense>
          ) : null}
          {Agentation ? (
            <React.Suspense fallback={null}>
              <Agentation />
            </React.Suspense>
          ) : null}
        </div>
        {/* Must be a direct child of <body>: the server also emits the
            client-entry script here, which React 19 only tolerates at body
            level (inside a <div> it is a hydration mismatch on every load). */}
        <Scripts />
      </body>
    </html>
  );
}
