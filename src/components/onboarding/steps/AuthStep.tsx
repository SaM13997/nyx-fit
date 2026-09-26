import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { useEmailAuth, type EmailAuthValues } from "@/lib/use-email-auth";
import { EmailAuthReveal } from "../flow/EmailAuthReveal";
import { GoogleColorMark } from "../flow/GoogleColorMark";
import {
  Card,
  Heading,
  HStack,
  Image,
  PrimaryButton,
  StepIndicator,
  Text,
  TextButton,
  VStack,
} from "../ui";
import type { SaveState } from "../use-onboarding-session";

export function AuthStep({
  existing,
  googleBusy,
  googleError,
  onGoogleSignIn,
  saveState,
  onBack,
  onRetry,
  onAbandon,
}: {
  existing: boolean;
  googleBusy: boolean;
  googleError: string | null;
  onGoogleSignIn: () => void;
  saveState: SaveState | null;
  onBack: () => void;
  onRetry: () => void;
  onAbandon: () => void;
}) {
  const emailMode = existing ? "signin" : "signup";
  const email = useEmailAuth(emailMode);
  const saving = saveState?.status === "saving";
  const saveFailed = saveState?.status === "error";
  const message =
    saveState?.status === "error" ? saveState.message : googleError;

  return (
    <VStack className="min-h-svh px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <Card>
        <StepIndicator step={3} total={4} />
        <Image src="/onboarding/3.png" alt="" className="mt-2" />
      </Card>
      <Heading className="mt-2">
        {existing ? "Welcome back." : "Keep your momentum."}
      </Heading>
      <Text>
        {existing
          ? "Sign in to pick up where you left off."
          : "Save your training experience and keep your workouts in one place."}
      </Text>
      {!saving && message !== null ? (
        <div
          role="alert"
          className="mt-1 rounded-2xl border border-flow-tomato/40 bg-flow-tomato/10 px-4 py-3 text-sm leading-5 break-words text-flow-ink"
        >
          {message}
        </div>
      ) : null}
      {saving ? (
        <PrimaryButton disabled className="mt-auto">
          <Spinner aria-hidden="true" className="size-5" />
          <span role="status">Saving your profile…</span>
        </PrimaryButton>
      ) : saveFailed ? (
        <VStack className="mt-auto gap-1">
          <PrimaryButton onClick={onRetry}>Retry saving</PrimaryButton>
          <TextButton onClick={onAbandon} className="self-center">
            Continue without saving
          </TextButton>
        </VStack>
      ) : (
        <VStack className="mt-auto gap-1.5">
          <HStack>
            {googleBusy || email.isSubmitting ? null : (
              <TextButton onClick={onBack}>
                <ChevronLeft
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={2}
                />
                Back
              </TextButton>
            )}
            <PrimaryButton
              onClick={onGoogleSignIn}
              disabled={googleBusy || email.isSubmitting}
              aria-busy={googleBusy ? true : undefined}
            >
              {googleBusy ? (
                <>
                  <Spinner aria-hidden="true" className="size-5" />
                  <span role="status">Signing in with Google...</span>
                </>
              ) : (
                <>
                  <GoogleColorMark />
                  Continue with Google
                </>
              )}
            </PrimaryButton>
          </HStack>
          {googleBusy ? null : (
            <EmailAuthReveal
              mode={emailMode}
              errorMessage={email.errorMessage}
              isSubmitting={email.isSubmitting}
              onSubmit={(values: EmailAuthValues) => void email.submit(values)}
              onCollapse={() => email.clearError()}
            />
          )}
          <LegalRow className="mt-1" />
        </VStack>
      )}
    </VStack>
  );
}

function LegalRow({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-center text-xs leading-4 break-words text-flow-ink-soft",
        className,
      )}
    >
      By continuing, you agree to our{" "}
      <Link
        to="/terms"
        className="inline-flex min-h-11 min-w-11 items-center rounded-lg underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flow-ink"
      >
        Terms
      </Link>{" "}
      and{" "}
      <Link
        to="/privacy"
        className="inline-flex min-h-11 min-w-11 items-center rounded-lg underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flow-ink"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
