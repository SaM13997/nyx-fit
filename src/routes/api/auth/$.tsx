import { createFileRoute } from "@tanstack/react-router";
import { reactStartHandler } from "@convex-dev/better-auth/react-start";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        console.log(`${process.env.SITE_URL} Site URL`, `;[API/AUTH] GET request to ${request.url}`);
        return reactStartHandler(request);
      },
      POST: ({ request }) => {
        console.log(`${process.env.SITE_URL} Site URL`, `;[API/AUTH] POST request to ${request.url}`);
        return reactStartHandler(request);
      },
    },
  },
});
