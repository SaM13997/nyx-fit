import { createServerFn } from "@tanstack/react-start";

export const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { env } = await import("cloudflare:workers");
  const { getRequestHeaders } = await import("@tanstack/react-start/server");
  const { getSession } = await import("@/lib/auth-server");

  const session = await getSession(env, getRequestHeaders());
  return { userId: session?.user.id ?? null };
});
