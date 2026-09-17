import { createFileRoute } from "@tanstack/react-router";

const IMAGES_PREFIX = "/api/images/";

export const Route = createFileRoute("/api/images/$")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ isWritableRequest, loadAppEnv, requireUserContext }, { uploadImage }] =
          await Promise.all([
            import("@/lib/api/context.server"),
            import("@/lib/api/images.server"),
          ]);
        const env = await loadAppEnv();
        if (!isWritableRequest(env, request)) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const context = await requireUserContext(request.headers, env).catch(() => null);
        if (context === null) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const outcome = await uploadImage({
          images: context.images,
          userId: context.userId,
          contentType: request.headers.get("content-type"),
          body: request.body,
        });
        if (outcome.status !== 200) {
          return Response.json(
            { error: outcome.message },
            { status: outcome.status, headers: { "cache-control": "no-store" } },
          );
        }
        return Response.json(
          { url: outcome.url },
          { status: 200, headers: { "cache-control": "no-store" } },
        );
      },
      GET: async ({ request }) => {
        const [{ requireUserContext }, { readImage }] = await Promise.all([
          import("@/lib/api/context.server"),
          import("@/lib/api/images.server"),
        ]);
        const context = await requireUserContext(request.headers).catch(() => null);
        if (context === null) {
          return new Response("Unauthorized", { status: 401 });
        }

        const outcome = await readImage({
          images: context.images,
          userId: context.userId,
          pathname: new URL(request.url).pathname,
          prefix: IMAGES_PREFIX,
        });
        if (outcome.status !== 200) {
          return new Response("Not Found", { status: 404, headers: { "cache-control": "no-store" } });
        }
        return new Response(outcome.body, {
          status: 200,
          headers: {
            "content-type": outcome.contentType,
            "cache-control": "private, no-store",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
