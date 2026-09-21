import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";

const FALLBACK_ERROR = "We couldn't sign you in right now. Please try again.";
const OFFLINE_ERROR = "You're offline. Reconnect to the internet and try again.";

export type EmailAuthMode = "signup" | "signin";

export type EmailAuthValues = {
  email: string;
  password: string;
  name?: string;
};

type EmailAuthResult =
  | Awaited<ReturnType<typeof authClient.signUp.email>>
  | Awaited<ReturnType<typeof authClient.signIn.email>>;

function fallbackError(mode: EmailAuthMode): string {
  return mode === "signup"
    ? "We couldn't create your account right now. Please try again."
    : FALLBACK_ERROR;
}

function getAuthErrorMessage(error: unknown, mode: EmailAuthMode) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return OFFLINE_ERROR;
  }

  if (error instanceof Error) {
    if (error.message.includes("403")) {
      return "Sign-in is temporarily unavailable because the authentication provider is misconfigured.";
    }

    if (error.message.includes("429")) {
      return "Too many sign-in attempts. Please wait a moment and try again.";
    }

    if (error.message.trim()) {
      return error.message;
    }
  }

  return fallbackError(mode);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getResultError(
  result: EmailAuthResult,
): Record<string, unknown> | null {
  if (!isRecord(result)) {
    return null;
  }
  const error: unknown = result.error;
  return isRecord(error) ? error : null;
}

function getErrorDetail(error: Record<string, unknown>): string | null {
  const message: unknown = error.message;
  if (typeof message !== "string" || message.trim().length === 0) {
    return null;
  }
  return message;
}

function resolveName(values: EmailAuthValues): string {
  const name = values.name?.trim() ?? "";
  if (name.length > 0) {
    return name;
  }
  const separator = values.email.indexOf("@");
  return separator > 0 ? values.email.slice(0, separator) : values.email;
}

export function useEmailAuth(mode: EmailAuthMode) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (values: EmailAuthValues): Promise<boolean> => {
      if (isSubmitting) {
        return false;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setErrorMessage(OFFLINE_ERROR);
        return false;
      }

      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        const result: EmailAuthResult =
          mode === "signup"
            ? await authClient.signUp.email({
                email: values.email,
                password: values.password,
                name: resolveName(values),
              })
            : await authClient.signIn.email({
                email: values.email,
                password: values.password,
              });
        const resultError = getResultError(result);
        if (resultError !== null) {
          setErrorMessage(getErrorDetail(resultError) ?? fallbackError(mode));
          setIsSubmitting(false);
          return false;
        }
        return true;
      } catch (error) {
        setErrorMessage(getAuthErrorMessage(error, mode));
        setIsSubmitting(false);
        return false;
      }
    },
    [isSubmitting, mode],
  );

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return { errorMessage, isSubmitting, submit, clearError };
}
