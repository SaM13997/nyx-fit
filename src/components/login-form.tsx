
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

const EMAIL_MAX_LENGTH = 254;

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

  return "We couldn't sign you in right now. Please try again."
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigateAfterAuth = () => {
    const search = router.state.location.search as
      | { redirect?: unknown }
      | undefined;
    const redirect =
      typeof search?.redirect === "string" && search.redirect.length > 0
        ? search.redirect
        : undefined;

    if (redirect) {
      router.history.push(redirect);
    } else {
      router.navigate({ to: "/" });
    }
  };

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setErrorMessage("Enter your email address to continue.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage("Enter a valid email address, like name@example.com.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMessage("You're offline. Reconnect to the internet and try again.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await authClient.signIn.email({
        email: normalizedEmail,
        password: "",
      });
      navigateAfterAuth();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setErrorMessage("You're offline. Reconnect to the internet and try again.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await authClient.signIn.social({
        provider: "google",
      });
      navigateAfterAuth();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleEmailSignIn}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-400">
              Enter your email to sign in or create an account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (errorMessage) {
                    setErrorMessage(null);
                  }
                }}
                placeholder="name@example.com"
                required
                maxLength={EMAIL_MAX_LENGTH}
                autoCapitalize="none"
                autoCorrect="off"
                dir="auto"
                aria-invalid={errorMessage ? "true" : "false"}
                aria-describedby="login-email-hint login-error"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl h-12 px-4 focus:ring-green-500 focus:border-green-500 transition-all font-medium"
              />
              <div
                id="login-email-hint"
                className="flex items-center justify-between gap-3 text-xs text-zinc-500"
              >
                <span className="min-w-0 break-words">
                  Use the email linked to your account.
                </span>
                <span className="shrink-0">{email.length}/{EMAIL_MAX_LENGTH}</span>
              </div>
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
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold h-12 rounded-xl text-base transition-all active:scale-[0.98] shadow-lg shadow-purple-900/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Continue with Email"
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-500 font-medium tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold h-12 rounded-xl text-base transition-all active:scale-[0.98] gap-3"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            {isSubmitting ? "Please wait..." : "Google"}
          </Button>
        </div>
      </form>
      <div className="text-center text-xs text-gray-500 break-words">
        By clicking continue, you agree to our <a href="#" className="underline hover:text-white transition-colors">Terms</a> and <a href="#" className="underline hover:text-white transition-colors">Privacy Policy</a>.
      </div>
    </div>
  );
}
