import type { AppEnv } from "@/lib/auth-server";

export type SessionUser = {
  name: string | null;
  email: string | null;
  image: string | null;
};

export type UserContext = {
  db: AppEnv["DB"];
  images: AppEnv["IMAGES"];
  userId: string;
  user: SessionUser;
};

export const loadAppEnv = async (): Promise<AppEnv> => {
  const { env } = await import("cloudflare:workers");
  if (!env.DB || !env.IMAGES) {
    throw new Error("Missing Cloudflare bindings");
  }
  return env;
};

const normalizeOrigin = (value: string | null): string | null => {
  if (value === null) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

export const isWritableRequest = (
  env: Pick<AppEnv, "BETTER_AUTH_URL">,
  request: Request,
): boolean => {
  if (request.method.toUpperCase() !== "POST") return false;
  const origin = normalizeOrigin(request.headers.get("origin"));
  const expected = normalizeOrigin(env.BETTER_AUTH_URL);
  return origin !== null && expected !== null && origin === expected;
};

const forbidden = (): Response =>
  new Response("Forbidden", { status: 403, headers: { "content-type": "text/plain" } });

export const assertWritableRequest = (
  env: Pick<AppEnv, "BETTER_AUTH_URL">,
  request: Request,
): void => {
  if (!isWritableRequest(env, request)) {
    throw forbidden();
  }
};

export const requireUserContext = async (
  headers: Headers,
  env?: AppEnv,
): Promise<UserContext> => {
  const [resolvedEnv, { requireSession }] = await Promise.all([
    env === undefined ? loadAppEnv() : Promise.resolve(env),
    import("@/lib/auth-server"),
  ]);
  const session = await requireSession(resolvedEnv, headers);
  return {
    db: resolvedEnv.DB,
    images: resolvedEnv.IMAGES,
    userId: session.user.id,
    user: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
  };
};

export const withUserContext = async <T>(
  run: (context: UserContext) => Promise<T>,
): Promise<T> => {
  const { getRequestHeaders } = await import("@tanstack/react-start/server");
  return run(await requireUserContext(getRequestHeaders()));
};

export const withUserMutationContext = async <T>(
  run: (context: UserContext) => Promise<T>,
): Promise<T> => {
  const [{ getRequest, getRequestHeaders }, env] = await Promise.all([
    import("@tanstack/react-start/server"),
    loadAppEnv(),
  ]);
  assertWritableRequest(env, getRequest());
  return run(await requireUserContext(getRequestHeaders(), env));
};
