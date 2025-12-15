import { createFileRoute } from "@tanstack/react-router";
import { reactStartHandler } from "@convex-dev/better-auth/react-start";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        console.log(`[API/AUTH] GET request to ${request.url}`);
        return reactStartHandler(request);
      },
      POST: ({ request }) => {
        console.log(`[API/AUTH] POST request to ${request.url}`);
        return reactStartHandler(request);
      },
    },
  },
});
