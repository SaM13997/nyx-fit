import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useUpsertCurrentProfile } from "@/lib/convex/hooks";
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
import { WashBackground, type OnboardingWash } from "./kit/WashBackground";
import { AuthError, AuthSaving } from "./screens/AuthStatus";
import { DoneScreen } from "./screens/DoneScreen";
import { ExperienceScreen } from "./screens/ExperienceScreen";
import { OnboardingHeader } from "./screens/OnboardingHeader";
import { WelcomeScreen } from "./screens/WelcomeScreen";

type EntryPath = "setup" | "existing";
type SaveStatus = "idle" | "saving" | "saved" | "error";

const SETUP_STEPS: StepId[] = ["welcome", "experience", "auth", "done"];
const READINESS_TIMEOUT_MS = 10000;
const SAVE_FALLBACK_ERROR =
  "We couldn't save your training experience. Check your connection and try again.";
const READINESS_TIMEOUT_ERROR =
  "Signing you in is taking longer than expected. Your answer is kept here.";
const DEGRADED_AUTH_DESCRIPTION =
  "Your answer can't be kept on this device, so it won't survive sign-in. Continue to sign in, then set your experience in profile settings.";

const washByStep: Record<StepId, OnboardingWash> = {
  welcome: "welcome",
  experience: "experience",
  auth: "auth",
  done: "done",
};

export function OnboardingFlow({ redirect }: { redirect?: string }) {
  const router = useRouter();
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();
  const session = sessionData?.session;
  const {
    isLoading: isConvexAuthLoading,
    isAuthenticated: isConvexAuthenticated,
  } = useConvexAuth();
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
  const stepNumber = SETUP_STEPS.indexOf(step) + 1;
  const showSetupProgress = entryPath !== "existing";
  const doneAction =
    !redirect || redirect === "/" ? copy.done.action : copy.done.continueAction;
  const authCallbackUrl = redirect
    ? `/onboarding?redirect=${encodeURIComponent(redirect)}`
    : "/onboarding";
  const destination = redirect ?? "/";

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
      setEntryPath("setup");
      setFitnessLevel(draft.fitnessLevel);
      resumedRef.current = true;
      if (draft.step === "auth" && draft.fitnessLevel !== null) {
        setStep("auth");
      } else {
        setStep("experience");
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
    if (isConvexAuthLoading || !isConvexAuthenticated) return;
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
    isConvexAuthLoading,
    isConvexAuthenticated,
    upsertCurrentProfile,
    clearReadinessTimer,
  ]);

  useEffect(() => {
    if (!initialized || isSessionPending || !session) return;
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
    isSessionPending,
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

  const goToStep = useCallback((target: StepId) => {
    setStep(target);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta === null) return;
    const previous = meta.getAttribute("content");
    meta.setAttribute("content", "#FAF9FB");
    return () => {
      if (previous !== null) meta.setAttribute("content", previous);
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

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <WelcomeScreen
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
          <ExperienceScreen
            value={fitnessLevel}
            onChange={setFitnessLevel}
            onContinue={() => {
              if (fitnessLevel === null) return;
              goToStep("auth");
            }}
          />
        );
      case "auth":
        if (entryPath !== "existing" && saveStatus === "error") {
          return (
            <AuthError
              message={saveError ?? SAVE_FALLBACK_ERROR}
              onRetry={retrySave}
              onAbandon={abandonSave}
            />
          );
        }
        if (entryPath !== "existing" && saveStatus !== "idle") {
          return <AuthSaving />;
        }
        return (
          <LoginForm
            heading={
              entryPath === "existing"
                ? copy.auth.existing.heading
                : copy.auth.setup.heading
            }
            description={
              entryPath === "existing"
                ? copy.auth.existing.description
                : storageAvailable
                  ? copy.auth.setup.description
                  : DEGRADED_AUTH_DESCRIPTION
            }
            callbackURL={authCallbackUrl}
            variant="onboarding"
          />
        );
      case "done":
        return (
          <DoneScreen
            action={doneAction}
            disabled={leaving}
            onContinue={() => {
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
    !initialized || isSessionPending || (!!session && !authSettled);
  const screenKey =
    step === "auth" && entryPath === "setup" && saveStatus !== "idle"
      ? `auth-${saveStatus}`
      : step;

  useEffect(() => {
    if (!initialized || showLoadingShell) return;
    const isInitialWelcome =
      firstScreenRef.current && step === "welcome" && !resumedRef.current;
    firstScreenRef.current = false;
    window.scrollTo(0, 0);
    if (isInitialWelcome) return;
    contentRef.current?.querySelector("h1")?.focus({ preventScroll: true });
  }, [initialized, showLoadingShell, screenKey, step]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="theme-onboarding relative isolate flex min-h-svh flex-col overflow-x-clip bg-ob-canvas">
        <WashBackground wash={washByStep[step]} />
        <div className="mx-auto flex w-full max-w-[390px] flex-1 flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {step !== "welcome" ? (
            <OnboardingHeader
              stepNumber={stepNumber}
              totalSteps={SETUP_STEPS.length}
              showRail={showSetupProgress}
            />
          ) : null}
          <main
            ref={contentRef}
            className={cn(
              "flex w-full flex-1 flex-col",
              step !== "welcome" && "mt-6",
            )}
          >
            {showLoadingShell ? (
              <p
                role="status"
                className="w-full py-20 text-center text-ob-ink-secondary"
              >
                Loading…
              </p>
            ) : (
              <motion.div
                key={screenKey}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className="flex w-full flex-1 flex-col"
              >
                {renderStep()}
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}
