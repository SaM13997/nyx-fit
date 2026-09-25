import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { EmailAuthValues } from "@/lib/use-email-auth";
import type { ExperienceLevel } from "../../config";
import { EmailAuthReveal } from "../EmailAuthReveal";
import { GoogleColorMark } from "../GoogleColorMark";
import { ScreenShell } from "../ScreenShell";
import { ProfileCardArt } from "../artwork";
import { body, ctaPill, focusRingLight, screenTitle } from "../classes";
import { flowCopy } from "../config";

export type SaveProfileState =
  | { status: "signin"; message?: string }
  | { status: "signing-in" }
  | { status: "saving" }
  | { status: "error"; message: string };

export type SaveEmailAuth = {
  mode: "signup" | "signin";
  errorMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (values: EmailAuthValues) => void;
  onCollapse: () => void;
};

function LegalRow({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-center text-[12px] leading-4 font-medium break-words text-white/75",
        className,
      )}
    >
      By continuing, you agree to our{" "}
      <Link
        to="/terms"
        className={cn(
          focusRingLight,
          "inline-flex min-h-11 min-w-11 items-center rounded-full px-1 underline",
        )}
      >
        Terms
      </Link>{" "}
      and{" "}
      <Link
        to="/privacy"
        className={cn(
          focusRingLight,
          "inline-flex min-h-11 min-w-11 items-center rounded-full px-1 underline",
        )}
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert className="mt-4 border-flow-tomato bg-flow-card">
      <AlertDescription className="text-flow-ink break-words">
        {message}
      </AlertDescription>
    </Alert>
  );
}

export function SaveProfileScreen({
  level,
  state,
  onSignIn,
  heading = flowCopy.save.heading,
  description = flowCopy.save.description,
  showArt = true,
  showProgress = true,
  emailAuth,
  onRetry,
  onAbandon,
  onBack,
}: {
  level: ExperienceLevel | null;
  state: SaveProfileState;
  onSignIn: () => void;
  heading?: string;
  description?: string;
  showArt?: boolean;
  showProgress?: boolean;
  emailAuth?: SaveEmailAuth;
  onRetry?: () => void;
  onAbandon?: () => void;
  onBack?: () => void;
}) {
  const pending = state.status === "signing-in" || state.status === "saving";
  const emailSubmitting = emailAuth?.isSubmitting ?? false;
  const errorMessage =
    state.status === "error"
      ? state.message
      : state.status === "signin"
        ? state.message
        : undefined;
  const actionRef = useRef<HTMLDivElement | null>(null);
  const announcedMessageRef = useRef<string | null>(null);
  const status = state.status;
  const statusMessage = status === "signin" ? state.message ?? null : null;

  useEffect(() => {
    if (status !== "signin") {
      announcedMessageRef.current = null;
      actionRef.current?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (statusMessage === null) {
      announcedMessageRef.current = null;
      return;
    }
    if (statusMessage === announcedMessageRef.current) return;
    announcedMessageRef.current = statusMessage;
    actionRef.current?.scrollIntoView({ block: "nearest" });
  }, [status, statusMessage]);

  return (
    <ScreenShell
      step={3}
      showProgress={showProgress}
      footer={
        <div ref={actionRef}>
          {errorMessage ? <ErrorAlert message={errorMessage} /> : null}
          {state.status === "error" ? (
            <>
              <Button
                type="button"
                variant="card"
                size="xl"
                onClick={onRetry}
                className={cn(
                  ctaPill,
                  "w-full enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100",
                )}
              >
                Retry saving
              </Button>
              <button
                type="button"
                onClick={onAbandon}
                className={cn(
                  focusRingLight,
                  "mt-1.5 flex w-full min-h-11 items-center justify-center rounded-full text-[14px] leading-5 font-semibold text-white/85 hover:text-white",
                )}
              >
                Continue without saving
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {state.status === "signin" &&
                !pending &&
                !emailSubmitting &&
                onBack ? (
                  <button
                    type="button"
                    aria-label="Go back"
                    onClick={onBack}
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-full bg-white/12 text-white",
                      "enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                    )}
                  >
                    <ChevronLeft
                      aria-hidden="true"
                      className="size-6"
                      strokeWidth={2}
                    />
                  </button>
                ) : null}
                <div className="min-w-0 flex-1">
                  <Button
                    type="button"
                    variant="card"
                    size="xl"
                    onClick={onSignIn}
                    disabled={pending || emailSubmitting}
                    aria-busy={pending ? true : undefined}
                    className={cn(
                      ctaPill,
                      "h-auto min-h-14 w-full px-4 py-2.5 text-center leading-tight whitespace-normal enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100",
                    )}
                  >
                    {state.status === "saving" ? (
                      <>
                        <Spinner aria-hidden="true" className="size-5" />
                        <span role="status">Saving your profile…</span>
                      </>
                    ) : state.status === "signing-in" ? (
                      <>
                        <Spinner aria-hidden="true" className="size-5" />
                        <span role="status">Signing in with Google...</span>
                      </>
                    ) : (
                      <>
                        <GoogleColorMark />
                        {flowCopy.save.action}
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <LegalRow className="mt-2" />
            </>
          )}
        </div>
      }
    >
      <h1
        tabIndex={-1}
        className={cn(screenTitle, "text-flow-ink focus:outline-none")}
      >
        {heading}
      </h1>

      <p className={cn(body, "mt-2.5 max-w-[330px]")}>{description}</p>

      {showArt ? (
        <div className="flex min-h-[264px] flex-1 items-center justify-center py-4 [@media(max-height:620px)]:hidden">
          <ProfileCardArt level={level} />
        </div>
      ) : null}

      {emailAuth && state.status === "signin" ? (
        <EmailAuthReveal
          mode={emailAuth.mode}
          onSubmit={emailAuth.onSubmit}
          errorMessage={emailAuth.errorMessage}
          isSubmitting={emailAuth.isSubmitting}
          onCollapse={emailAuth.onCollapse}
          className="mt-3"
        />
      ) : null}
    </ScreenShell>
  );
}
