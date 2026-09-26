import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { useEmailAuth, type EmailAuthValues } from "@/lib/use-email-auth";
import { EmailAuthReveal } from "../flow/EmailAuthReveal";
import { GoogleColorMark } from "../flow/GoogleColorMark";
import {
  ActionBar,
  BackButton,
  Heading,
  PrimaryButton,
  Rise,
  Text,
  TextButton,
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
  emailOpen,
  onEmailOpenChange,
}: {
  existing: boolean;
  googleBusy: boolean;
  googleError: string | null;
  onGoogleSignIn: () => void;
  saveState: SaveState | null;
  onBack: () => void;
  onRetry: () => void;
  onAbandon: () => void;
  emailOpen: boolean;
  onEmailOpenChange: (open: boolean) => void;
}) {
  const emailMode = existing ? "signin" : "signup";
  const email = useEmailAuth(emailMode);
  const saving = saveState?.status === "saving";
  const saveFailed = saveState?.status === "error";
  const message =
    saveState?.status === "error" ? saveState.message : googleError;
  const busy = googleBusy || email.isSubmitting;

  return (
    <>
      <Rise>
        <Heading>{existing ? "Welcome back." : "Keep your momentum."}</Heading>
      </Rise>
      <Rise>
        <Text className="mx-auto mt-3 max-w-[32ch]">
          {existing
            ? "Sign in to pick up where you left off."
            : "Save your profile so every set you log is waiting for you."}
        </Text>
      </Rise>
      <AnimatePresence initial={false}>
        {!saving && message !== null ? (
          <motion.div
            key="alert"
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-4 rounded-2xl border border-night-danger/40 bg-night-danger/10 px-4 py-3 text-sm leading-5 break-words text-night-ink">
              {message}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {saving ? (
        <ActionBar>
          <PrimaryButton disabled>
            <Spinner aria-hidden="true" className="size-5" />
            <span role="status">Saving your profile…</span>
          </PrimaryButton>
        </ActionBar>
      ) : saveFailed ? (
        <ActionBar className="flex-col items-stretch gap-1">
          <PrimaryButton onClick={onRetry}>Retry saving</PrimaryButton>
          <TextButton onClick={onAbandon} className="self-center">
            Continue without saving
          </TextButton>
        </ActionBar>
      ) : (
        <ActionBar className="flex-col items-stretch gap-2">
          <AnimatePresence initial={false}>
            {emailOpen ? null : (
              <motion.div
                key="google"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                className="-m-1 overflow-hidden p-1"
              >
                <div className="flex items-center gap-3">
                  {busy ? null : <BackButton onClick={onBack} />}
                  <PrimaryButton
                    onClick={onGoogleSignIn}
                    disabled={busy}
                    aria-busy={googleBusy ? true : undefined}
                  >
                    {googleBusy ? (
                      <>
                        <Spinner aria-hidden="true" className="size-5" />
                        <span role="status">Signing in with Google…</span>
                      </>
                    ) : (
                      <>
                        <GoogleColorMark />
                        Continue with Google
                      </>
                    )}
                  </PrimaryButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {googleBusy ? null : (
            <EmailAuthReveal
              mode={emailMode}
              tone="night"
              errorMessage={email.errorMessage}
              isSubmitting={email.isSubmitting}
              onSubmit={(values: EmailAuthValues) => void email.submit(values)}
              onCollapse={() => email.clearError()}
              onOpenChange={onEmailOpenChange}
              renderBack={(collapse) => (
                <BackButton
                  aria-label="Back to Google"
                  onClick={collapse}
                  disabled={email.isSubmitting}
                />
              )}
            />
          )}
          <LegalRow />
        </ActionBar>
      )}
    </>
  );
}

const legalLink =
  "inline-flex min-h-11 items-center rounded-lg px-0.5 underline underline-offset-2 hover:text-night-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-night-ink";

function LegalRow() {
  return (
    <p className="text-center text-xs leading-4 break-words text-night-ink-soft">
      By continuing, you agree to our{" "}
      <Link to="/terms" className={legalLink}>
        Terms
      </Link>{" "}
      and{" "}
      <Link to="/privacy" className={legalLink}>
        Privacy Policy
      </Link>
      .
    </p>
  );
}
