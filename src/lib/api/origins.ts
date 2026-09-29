import type { AppEnv } from "@/lib/auth-server";

const normalizeOrigin = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined || value === "") return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

// Origins allowed to sign in and write: the canonical app URL plus any extra
// comma-separated TRUSTED_ORIGINS (set in .dev.vars for localhost only, so
// production never trusts a local origin).
export const allowedOrigins = (
  env: Pick<AppEnv, "BETTER_AUTH_URL" | "TRUSTED_ORIGINS">,
): string[] => {
  const origins = [env.BETTER_AUTH_URL, ...(env.TRUSTED_ORIGINS ?? "").split(",")]
    .map((value) => normalizeOrigin(value.trim()))
    .filter((origin): origin is string => origin !== null);
  return Array.from(new Set(origins));
};

export const isAllowedOrigin = (
  env: Pick<AppEnv, "BETTER_AUTH_URL" | "TRUSTED_ORIGINS">,
  value: string | null,
): boolean => {
  const origin = normalizeOrigin(value);
  return origin !== null && allowedOrigins(env).includes(origin);
};
