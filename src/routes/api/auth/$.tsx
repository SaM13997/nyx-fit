import { createFileRoute } from "@tanstack/react-router";

const handleAuthRequest = async (request: Request) => {
  const { env } = await import("cloudflare:workers");
  const { createAuth } = await import("@/lib/auth-server");

  return createAuth(env).handler(request);
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});
