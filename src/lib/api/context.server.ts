import type { AppEnv } from "@/lib/auth-server";
import { isAllowedOrigin } from "@/lib/api/origins";

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

export const isWritableRequest = (
  env: Pick<AppEnv, "BETTER_AUTH_URL" | "TRUSTED_ORIGINS">,
  request: Request,
): boolean =>
  request.method.toUpperCase() === "POST" &&
  isAllowedOrigin(env, request.headers.get("origin"));

export const assertWritableRequest = (
  env: Pick<AppEnv, "BETTER_AUTH_URL" | "TRUSTED_ORIGINS">,
  request: Request,
): void => {
  // Throw an Error, not a Response: TanStack Start hands a thrown Response
  // back to the caller as a *successful* result, so a rejected write would
  // look like it returned `{}`.
  if (!isWritableRequest(env, request)) {
    throw new Error("Forbidden");
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
