import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { GoogleButton } from "@/components/onboarding/kit/GoogleButton";
import { InlineAlert } from "@/components/onboarding/kit/InlineAlert";
import { LegalRow } from "@/components/onboarding/kit/LegalRow";
import { obBody, obScreenTitle } from "@/components/onboarding/kit/classes";

const FALLBACK_ERROR = "We couldn't sign you in right now. Please try again.";

function getAuthErrorMessage(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You're offline. Reconnect to the internet and try again."
  }

  if (error instanceof Error) {
    if (error.message.includes("403")) {
      return "Sign-in is temporarily unavailable because the authentication provider is misconfigured."
    }

    if (error.message.includes("429")) {
      return "Too many sign-in attempts. Please wait a moment and try again."
    }

    if (error.message.trim()) {
      return error.message
    }
  }

  return FALLBACK_ERROR
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

type LoginFormProps = React.ComponentProps<"div"> & {
  heading?: string;
  description?: string;
  callbackURL?: string;
  variant?: "default" | "onboarding";
};

export function LoginForm({
  className,
  heading = "Welcome Back",
  description = "Sign in with Google to continue",
  callbackURL,
  variant = "default",
  ...props
}: LoginFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
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
  };

  if (variant === "onboarding") {
    return (
      <div className={cn("flex flex-col", className)} {...props}>
        <div className="flex flex-col gap-2">
          <h1
            id="login-heading"
            tabIndex={-1}
            className={cn(obScreenTitle, "text-ob-ink focus:outline-none")}
          >
            {heading}
          </h1>
          <p className={cn(obBody, "text-ob-ink-secondary")}>{description}</p>
        </div>
        {errorMessage ? (
          <InlineAlert className="mt-6">{errorMessage}</InlineAlert>
        ) : null}
        <GoogleButton
          onClick={handleGoogleSignIn}
          loading={isSubmitting}
          className="mt-6"
        />
        <LegalRow className="mt-2" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center">
        <h1
          id="login-heading"
          tabIndex={-1}
          className="text-2xl font-bold tracking-tight text-white focus:outline-none"
        >
          {heading}
        </h1>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      {errorMessage ? (
        <div
          id="login-error"
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 break-words"
        >
          {errorMessage}
        </div>
      ) : null}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-12 rounded-xl text-base transition-all active:scale-[0.98] shadow-lg shadow-purple-900/20 gap-3"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in with Google...
          </>
        ) : (
          <>
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            Continue with Google
          </>
        )}
      </Button>
      <div className="text-center text-xs text-gray-500 break-words">
        By clicking continue, you agree to our{" "}
        <Link
          to="/terms"
          className="inline-flex min-h-11 items-center underline decoration-white/30 underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          to="/privacy"
          className="inline-flex min-h-11 items-center underline decoration-white/30 underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
        >
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
