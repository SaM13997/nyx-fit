import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export type AppEnv = {
  DB: D1Database;
  IMAGES: R2Bucket;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

const trustedOrigins = (baseURL: string) => [
  "http://localhost:3000",
  "https://localhost:3000",
  baseURL,
];

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
    trustedOrigins: trustedOrigins(baseURL),
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
