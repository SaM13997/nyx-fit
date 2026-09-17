import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";

const FALLBACK_ERROR = "We couldn't sign you in right now. Please try again.";

function getAuthErrorMessage(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You're offline. Reconnect to the internet and try again.";
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

  return FALLBACK_ERROR;
}

type SocialSignInResult = Awaited<ReturnType<typeof authClient.signIn.social>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getSocialResultError(
  result: SocialSignInResult,
): Record<string, unknown> | null {
  if (!isRecord(result)) {
    return null;
  }
  const error: unknown = result.error;
  return isRecord(error) ? error : null;
}

function getSocialErrorDetail(error: Record<string, unknown>): string | null {
  const message: unknown = error.message;
  if (typeof message !== "string" || message.trim().length === 0) {
    return null;
  }
  return message;
}

function isProviderHandoff(result: SocialSignInResult): boolean {
  if (!isRecord(result)) {
    return false;
  }
  const data: unknown = result.data;
  if (!isRecord(data)) {
    return false;
  }
  if (data.redirect === true) {
    return true;
  }
  const url: unknown = data.url;
  if (typeof url === "string" && url.length > 0) {
    return true;
  }
  const token: unknown = data.token;
  if (typeof token === "string" && token.length > 0) {
    return true;
  }
  return isRecord(data.user);
}

export function useGoogleSignIn(callbackURL: string) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signIn = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMessage("You're offline. Reconnect to the internet and try again.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result: SocialSignInResult = await authClient.signIn.social({
        provider: "google",
        ...(callbackURL ? { callbackURL } : {}),
      });
      const resultError = getSocialResultError(result);
      if (resultError !== null) {
        setErrorMessage(getSocialErrorDetail(resultError) ?? FALLBACK_ERROR);
        setIsSubmitting(false);
        return;
      }
      if (!isProviderHandoff(result)) {
        setErrorMessage(FALLBACK_ERROR);
        setIsSubmitting(false);
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setIsSubmitting(false);
    }
  }, [callbackURL, isSubmitting]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return { errorMessage, isSubmitting, signIn, clearError };
}
