import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

import { allowedOrigins } from "@/lib/api/origins";

export type AppEnv = {
  DB: D1Database;
  IMAGES: R2Bucket;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  // Comma-separated extra origins, e.g. http://localhost:3000 in .dev.vars.
  TRUSTED_ORIGINS?: string;
};

const parseBaseURL = (value: string): string => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("BETTER_AUTH_URL must be an absolute URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL must use http or https");
  }
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "") {
    throw new Error(
      "BETTER_AUTH_URL must be an origin without path, query, or fragment"
    );
  }
  return url.origin;
};

export const createAuth = (env: AppEnv) => {
  const rawBaseURL = env.BETTER_AUTH_URL;
  const secret = env.BETTER_AUTH_SECRET;

  if (!rawBaseURL) {
    throw new Error("Missing BETTER_AUTH_URL");
  }
  if (!secret) {
    throw new Error("Missing BETTER_AUTH_SECRET");
  }

  const baseURL = parseBaseURL(rawBaseURL);

  const googleClientId = env.GOOGLE_CLIENT_ID;
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET;
  if (googleClientId && !googleClientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET");
  }
  if (!googleClientId && googleClientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID");
  }
  if (!googleClientId && !googleClientSecret) {
    console.warn(
      "Google sign-in is disabled: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET" +
        " are not set in the runtime environment (.dev.vars locally," +
        " `wrangler secret put` in deployment). Social sign-in will fail" +
        ' with "Provider not found" until both are set.',
    );
  }

  return betterAuth({
    baseURL,
    secret,
    database: {
      db: new Kysely({ dialect: new D1Dialect({ database: env.DB }) }),
      type: "sqlite",
      transaction: false,
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
        : undefined,
    // Signed, short-lived session snapshot in a cookie: most requests skip the
    // session + user D1 lookups (2 reads per API call otherwise). Sign-out
    // clears the cookie in the signing-out browser, but a session revoked
    // elsewhere (another device, deleted user) stays valid here for up to
    // maxAge, i.e. 5 minutes. Data access is still scoped by the cached user
    // id, so that window is the accepted revocation delay.
    session: {
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    trustedOrigins: allowedOrigins(env),
    plugins: [],
  });
};

export const getSession = async (env: AppEnv, headers: Headers) => {
  const auth = createAuth(env);
  return auth.api.getSession({ headers });
};

export const requireSession = async (env: AppEnv, headers: Headers) => {
  const session = await getSession(env, headers);
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
};
