import { useState, type ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";
import { useGoogleSignIn } from "@/lib/use-google-sign-in";
import {
  writeOnboardingDraft,
  type ExperienceLevel,
} from "./config";
import { useOnboardingSession } from "./use-onboarding-session";
import { WelcomeStep } from "./steps/WelcomeStep";
import { ExperienceStep } from "./steps/ExperienceStep";
import { AuthStep } from "./steps/AuthStep";
import { DoneStep } from "./steps/DoneStep";

type Step = "welcome" | "experience" | "auth" | "done";

export function OnboardingFlow({ redirect }: { redirect?: string }) {
  const destination = redirect ?? "/";
  const google = useGoogleSignIn(
    redirect ? `/onboarding?redirect=${encodeURIComponent(redirect)}` : "/onboarding",
  );
  const [existing, setExisting] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const { waiting, saveState, saveProfile, finish } = useOnboardingSession(
    destination,
    (draft) => {
      if (draft !== null) {
        setLevel(draft.fitnessLevel);
        setStep(draft.step);
      }
    },
    () => setStep("done"),
  );

  const goToStep = (next: Step) => {
    google.clearError();
    setStep(next);
  };

  const screens: Record<Step, ReactNode> = {
    welcome: (
      <WelcomeStep
        onStart={() => {
          setExisting(false);
          goToStep("experience");
        }}
        onExisting={() => {
          setExisting(true);
          goToStep("auth");
        }}
      />
    ),
    experience: (
      <ExperienceStep
        value={level}
        onSelect={(next) => {
          setLevel(next);
          writeOnboardingDraft({ version: 2, step: "experience", fitnessLevel: next });
        }}
        onBack={() => goToStep("welcome")}
        onNext={(next) => {
          setLevel(next);
          writeOnboardingDraft({ version: 2, step: "auth", fitnessLevel: next });
          goToStep("auth");
        }}
      />
    ),
    auth: (
      <AuthStep
        existing={existing}
        googleBusy={google.isSubmitting}
        googleError={google.errorMessage}
        onGoogleSignIn={google.signIn}
        saveState={saveState}
        onBack={() => goToStep("experience")}
        onRetry={() => level !== null && saveProfile(level)}
        onAbandon={finish}
      />
    ),
    done: (
      <DoneStep
        buttonLabel={redirect && redirect !== "/" ? "Continue" : "Get fit"}
        onContinue={finish}
      />
    ),
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="theme-flow min-h-svh bg-flow-bg text-flow-ink">
        {waiting ? (
          <p
            role="status"
            className="flex min-h-svh items-center justify-center text-[16px] leading-6 text-flow-ink-soft"
          >
            Loading…
          </p>
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {screens[step]}
          </motion.div>
        )}
      </main>
    </MotionConfig>
  );
}
