import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ExperienceLevel } from "../../config";
import { GoogleColorMark } from "../GoogleColorMark";
import { LumenShell } from "../LumenShell";
import { ProfileCardArt } from "../artwork";
import { lmBody, lmScreenTitle } from "../classes";
import { lumenCopy } from "../config";

export type LumenSaveProfileState =
  | { status: "signin"; message?: string }
  | { status: "signing-in" }
  | { status: "saving" }
  | { status: "error"; message: string };

function LumenLegalRow({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-center text-[12px] leading-4 font-medium break-words text-lm-ink-soft",
        className,
      )}
    >
      By continuing, you agree to our{" "}
      <Button asChild variant="link" size="xs" className="min-w-11 min-h-11 px-1 underline">
        <Link to="/terms">Terms</Link>
      </Button>{" "}
      and{" "}
      <Button asChild variant="link" size="xs" className="min-w-11 min-h-11 px-1 underline">
        <Link to="/privacy">Privacy Policy</Link>
      </Button>
      .
    </p>
  );
}

function LumenErrorAlert({ message }: { message: string }) {
  return (
    <Alert className="mt-6 border-lm-tomato">
      <AlertDescription className="text-lm-ink break-words">
        {message}
      </AlertDescription>
    </Alert>
  );
}

export function LumenSaveProfileScreen({
  level,
  state,
  onSignIn,
  heading = lumenCopy.save.heading,
  description = lumenCopy.save.description,
  showArt = true,
  showProgress = true,
  onRetry,
  onAbandon,
  onBack,
}: {
  level: ExperienceLevel | null;
  state: LumenSaveProfileState;
  onSignIn: () => void;
  heading?: string;
  description?: string;
  showArt?: boolean;
  showProgress?: boolean;
  onRetry?: () => void;
  onAbandon?: () => void;
  onBack?: () => void;
}) {
  const pending = state.status === "signing-in" || state.status === "saving";
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
    <LumenShell step={3} wash="save" showProgress={showProgress}>
      <h1
        tabIndex={-1}
        className={cn(lmScreenTitle, "text-lm-ink focus:outline-none")}
      >
        {heading}
      </h1>

      {showArt ? (
        <div className="relative mt-3 flex min-h-[316px] flex-1 items-center justify-center py-6">
          <ProfileCardArt level={level} />
        </div>
      ) : null}

      <p className={cn(lmBody, "mt-3 max-w-[330px]")}>{description}</p>

      {errorMessage ? <LumenErrorAlert message={errorMessage} /> : null}

      <div ref={actionRef} className="mt-auto shrink-0 pt-6">
        {state.status === "error" ? (
          <>
            <Button
              type="button"
              size="xl"
              onClick={onRetry}
              className="w-full enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100"
            >
              Retry saving
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={onAbandon}
              className="mt-1.5 min-h-11 w-full"
            >
              Continue without saving
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {state.status === "signin" && onBack ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xl"
                  aria-label="Go back"
                  onClick={onBack}
                  className="enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100"
                >
                  <ChevronLeft
                    aria-hidden="true"
                    className="size-6"
                    strokeWidth={2}
                  />
                </Button>
              ) : null}
              <div className="min-w-0 flex-1">
                <Button
                  type="button"
                  variant="card"
                  size="xl"
                  onClick={onSignIn}
                  disabled={pending}
                  aria-busy={pending ? true : undefined}
                  className="h-auto min-h-14 w-full px-4 py-2.5 text-center leading-tight whitespace-normal enabled:active:scale-[0.98] motion-reduce:enabled:active:scale-100"
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
                      {lumenCopy.save.action}
                    </>
                  )}
                </Button>
              </div>
            </div>
            <LumenLegalRow className="mt-2" />
          </>
        )}
      </div>
    </LumenShell>
  );
}
