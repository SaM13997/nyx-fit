import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { useUpsertCurrentProfile } from "@/lib/api/hooks";
import { useGoogleSignIn } from "@/lib/use-google-sign-in";
import {
  clearLegacyStagedOnboarding,
  clearOnboardingDraft,
  copy,
  isDraftStorageAvailable,
  readOnboardingDraft,
  writeOnboardingDraft,
  type ExperienceLevel,
  type StepId,
} from "./config";
import { LumenExperienceScreen } from "./lumen/screens/LumenExperienceScreen";
import { LumenReadyScreen } from "./lumen/screens/LumenReadyScreen";
import {
  LumenSaveProfileScreen,
  type LumenSaveProfileState,
} from "./lumen/screens/LumenSaveProfileScreen";
import { LumenWelcomeScreen } from "./lumen/screens/LumenWelcomeScreen";
import { lumenCopy } from "./lumen/config";
import {
  isNotificationSupported,
  requestNotificationPermission,
} from "@/lib/notifications";

type EntryPath = "setup" | "existing";
type SaveStatus = "idle" | "saving" | "saved" | "error";

const READINESS_TIMEOUT_MS = 10000;
const SAVE_FALLBACK_ERROR =
  "We couldn't save your training experience. Check your connection and try again.";
const READINESS_TIMEOUT_ERROR =
  "Signing you in is taking longer than expected. Your answer is kept here.";
const DEGRADED_AUTH_DESCRIPTION =
  "Your answer can't be kept on this device, so it won't survive sign-in. Continue to sign in, then set your experience in profile settings.";

export function OnboardingFlow({ redirect }: { redirect?: string }) {
  const router = useRouter();
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();
  const session = sessionData?.session;
  const { upsertCurrentProfile } = useUpsertCurrentProfile();
  const [step, setStep] = useState<StepId>("welcome");
  const [entryPath, setEntryPath] = useState<EntryPath | null>(null);
  const [fitnessLevel, setFitnessLevel] = useState<ExperienceLevel | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveLevel, setSaveLevel] = useState<ExperienceLevel | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [authSettled, setAuthSettled] = useState(false);
  const mountedRef = useRef(false);
  const postAuthHandledRef = useRef(false);
  const saveAttemptRef = useRef(false);
  const mutatingRef = useRef(false);
  const leavingRef = useRef(false);
  const readinessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLElement>(null);
  const firstScreenRef = useRef(true);
  const resumedRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const destination = redirect ?? "/";
  const authCallbackUrl = redirect
    ? `/onboarding?redirect=${encodeURIComponent(redirect)}`
    : "/onboarding";
  const doneAction =
    redirect && redirect !== "/" ? copy.done.continueAction : undefined;
  const {
    errorMessage: signInError,
    isSubmitting,
    signIn,
    clearError: clearSignInError,
  } = useGoogleSignIn(authCallbackUrl);

  const clearReadinessTimer = useCallback(() => {
    if (readinessTimerRef.current !== null) {
      clearTimeout(readinessTimerRef.current);
      readinessTimerRef.current = null;
    }
  }, []);

  const beginSaveFlow = useCallback(
    (level: ExperienceLevel) => {
      if (saveAttemptRef.current) return;
      saveAttemptRef.current = true;
      clearReadinessTimer();
      readinessTimerRef.current = setTimeout(() => {
        readinessTimerRef.current = null;
        if (!mountedRef.current || mutatingRef.current) return;
        setSaveError(READINESS_TIMEOUT_ERROR);
        setSaveStatus("error");
      }, READINESS_TIMEOUT_MS);
      setSaveLevel(level);
      setSaveError(null);
      setSaveStatus("saving");
    },
    [clearReadinessTimer],
  );

  useEffect(() => {
    mountedRef.current = true;
    setStorageAvailable(isDraftStorageAvailable());
    clearLegacyStagedOnboarding();
    const draft = readOnboardingDraft();
    if (draft !== null) {
      if (draft.step === "auth") {
        setEntryPath("setup");
        setFitnessLevel(draft.fitnessLevel);
        resumedRef.current = true;
        setStep("auth");
      } else if (draft.fitnessLevel !== null) {
        setFitnessLevel(draft.fitnessLevel);
      }
    }
    setInitialized(true);
    return () => {
      mountedRef.current = false;
      if (readinessTimerRef.current !== null) {
        clearTimeout(readinessTimerRef.current);
        readinessTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (saveLevel === null || saveStatus !== "saving") return;
    if (isSessionPending || !session) return;
    if (mutatingRef.current) return;
    mutatingRef.current = true;
    clearReadinessTimer();
    void (async () => {
      try {
        await upsertCurrentProfile({ updates: { fitnessLevel: saveLevel } });
        if (!mountedRef.current) return;
        clearOnboardingDraft();
        setSaveStatus("saved");
        setStep("done");
      } catch (error) {
        if (!mountedRef.current) return;
        setSaveError(
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : SAVE_FALLBACK_ERROR,
        );
        setSaveStatus("error");
      }
    })();
  }, [
    saveLevel,
    saveStatus,
    isSessionPending,
    session,
    upsertCurrentProfile,
    clearReadinessTimer,
  ]);

  useEffect(() => {
    if (!initialized || !session) return;
    if (postAuthHandledRef.current) return;
    postAuthHandledRef.current = true;
    const draft = readOnboardingDraft();
    if (
      draft !== null &&
      draft.step === "auth" &&
      draft.fitnessLevel !== null
    ) {
      setEntryPath("setup");
      setFitnessLevel(draft.fitnessLevel);
      beginSaveFlow(draft.fitnessLevel);
      setAuthSettled(true);
    } else {
      router.history.replace(destination);
    }
  }, [
    initialized,
    session,
    destination,
    router.history,
    beginSaveFlow,
  ]);

  useEffect(() => {
    if (!initialized || entryPath !== "setup") return;
    if (step === "experience") {
      writeOnboardingDraft({ version: 2, step: "experience", fitnessLevel });
    } else if (
      step === "auth" &&
      saveStatus === "idle" &&
      fitnessLevel !== null
    ) {
      writeOnboardingDraft({ version: 2, step: "auth", fitnessLevel });
    }
  }, [initialized, entryPath, step, fitnessLevel, saveStatus]);

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [remindersPending, setRemindersPending] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);

  const toggleReminders = useCallback(async () => {
    if (remindersPending) return;

    if (remindersEnabled) {
      setReminderError(null);
      setRemindersPending(true);
      try {
        await upsertCurrentProfile({ updates: { notificationsEnabled: false } });
        setRemindersEnabled(false);
      } catch {
        setReminderError(lumenCopy.ready.remindersErrorSave);
      } finally {
        setRemindersPending(false);
      }
      return;
    }

    if (!isNotificationSupported()) {
      setReminderError(lumenCopy.ready.remindersErrorUnsupported);
      return;
    }

    setRemindersPending(true);
    const permission = await requestNotificationPermission();
    setRemindersPending(false);

    if (permission === "granted") {
      setReminderError(null);
      setRemindersEnabled(true);
      try {
        await upsertCurrentProfile({ updates: { notificationsEnabled: true } });
      } catch {
        setReminderError(lumenCopy.ready.remindersErrorSave);
      }
      return;
    }

    if (permission === "denied") {
      setReminderError(lumenCopy.ready.remindersErrorDenied);
      return;
    }

    setReminderError(lumenCopy.ready.remindersErrorDismissed);
  }, [remindersPending, remindersEnabled, upsertCurrentProfile]);

  const goToStep = useCallback(
    (target: StepId) => {
      clearSignInError();
      setStep(target);
    },
    [clearSignInError],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta === null) return;
    const previous = meta.getAttribute("content");
    meta.setAttribute("content", "#FAF9F7");
    return () => {
      if (previous !== null) {
        meta.setAttribute("content", previous);
      }
    };
  }, []);

  const retrySave = useCallback(() => {
    if (saveLevel === null) return;
    saveAttemptRef.current = false;
    mutatingRef.current = false;
    beginSaveFlow(saveLevel);
  }, [saveLevel, beginSaveFlow]);

  const abandonSave = useCallback(() => {
    clearReadinessTimer();
    clearOnboardingDraft();
    router.history.replace(destination);
  }, [clearReadinessTimer, destination, router.history]);

  const authState: LumenSaveProfileState =
    entryPath !== "existing" && saveStatus === "error"
      ? { status: "error", message: saveError ?? SAVE_FALLBACK_ERROR }
      : entryPath !== "existing" && saveStatus === "saving"
        ? { status: "saving" }
        : isSubmitting
          ? { status: "signing-in" }
          : signInError !== null
            ? { status: "signin", message: signInError }
            : { status: "signin" };

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <LumenWelcomeScreen
            onStart={() => {
              clearOnboardingDraft();
              clearLegacyStagedOnboarding();
              setEntryPath("setup");
              goToStep("experience");
            }}
            onExistingAccount={() => {
              clearOnboardingDraft();
              clearLegacyStagedOnboarding();
              setEntryPath("existing");
              goToStep("auth");
            }}
          />
        );
      case "experience":
        return (
          <LumenExperienceScreen
            value={fitnessLevel}
            onChange={setFitnessLevel}
            onContinue={() => {
              if (fitnessLevel === null) return;
              goToStep("auth");
            }}
            onBack={() => goToStep("welcome")}
          />
        );
      case "auth":
        if (entryPath === "existing") {
          return (
            <LumenSaveProfileScreen
              level={null}
              state={authState}
              heading={copy.auth.existing.heading}
              description={copy.auth.existing.description}
              showArt={false}
              showProgress={false}
              onSignIn={signIn}
            />
          );
        }
        return (
          <LumenSaveProfileScreen
            level={fitnessLevel}
            state={authState}
            description={storageAvailable ? undefined : DEGRADED_AUTH_DESCRIPTION}
            onSignIn={signIn}
            onRetry={retrySave}
            onAbandon={abandonSave}
            onBack={
              authState.status === "signin"
                ? () => goToStep("experience")
                : undefined
            }
          />
        );
      case "done":
        return (
          <LumenReadyScreen
            level={fitnessLevel}
            action={doneAction}
            disabled={leaving}
            remindersEnabled={remindersEnabled}
            remindersPending={remindersPending}
            reminderError={reminderError}
            onToggleReminders={() => void toggleReminders()}
            onOpenDashboard={() => {
              if (leavingRef.current) return;
              leavingRef.current = true;
              setLeaving(true);
              clearOnboardingDraft();
              router.history.replace(destination);
            }}
          />
        );
      default:
        return step satisfies never;
    }
  };

  const showLoadingShell =
    !initialized ||
    (isSessionPending && !session) ||
    (!!session && !authSettled);

  useEffect(() => {
    if (!initialized || showLoadingShell) return;
    const isInitialWelcome =
      firstScreenRef.current && step === "welcome" && !resumedRef.current;
    firstScreenRef.current = false;
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
    if (isInitialWelcome) return;
    contentRef.current?.querySelector("h1")?.focus({ preventScroll: true });
  }, [initialized, showLoadingShell, step]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="theme-lumen fixed inset-0 z-50 flex justify-center overflow-hidden bg-lm-bg">
        <main ref={contentRef} className="relative h-full w-full max-w-[390px]">
          {showLoadingShell ? (
            <div className="flex h-full items-center justify-center">
              <p
                role="status"
                className="text-[16px] leading-6 text-lm-ink-soft"
              >
                Loading…
              </p>
            </div>
          ) : (
            <motion.div
              key={step}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
              className="h-full"
            >
              {renderStep()}
            </motion.div>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
