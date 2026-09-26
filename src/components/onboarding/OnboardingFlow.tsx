import { useState, type ReactNode } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Variants,
} from "framer-motion";
import { useGoogleSignIn } from "@/lib/use-google-sign-in";
import {
  clearOnboardingDraft,
  writeOnboardingDraft,
  type ExperienceLevel,
} from "./config";
import {
  ArtTile,
  type ArtId,
  type Direction,
  type Tint,
} from "./flow/ArtTile";
import { useOnboardingSession } from "./use-onboarding-session";
import { WelcomeStep } from "./steps/WelcomeStep";
import { ExperienceStep } from "./steps/ExperienceStep";
import { AuthStep } from "./steps/AuthStep";
import { DoneStep } from "./steps/DoneStep";

type Step = "welcome" | "experience" | "auth" | "done";
type Scene = { art: ArtId; tint: Tint };

const stepIndex: Record<Step, number> = {
  welcome: 0,
  experience: 1,
  auth: 2,
  done: 3,
};
const levels: ExperienceLevel[] = ["beginner", "intermediary", "advanced"];
const DEFAULT_LEVEL: ExperienceLevel = "intermediary";

const levelScene: Record<ExperienceLevel, Scene> = {
  beginner: { art: 4, tint: "mint" },
  intermediary: { art: 3, tint: "sky" },
  advanced: { art: 1, tint: "pink" },
};

function sceneFor(step: Step, level: ExperienceLevel): Scene {
  switch (step) {
    case "welcome":
      return { art: 2, tint: "lavender" };
    case "experience":
      return levelScene[level];
    case "auth":
      return { art: 1, tint: "lavender" };
    case "done":
      return { art: 4, tint: "peach" };
    default:
      return step satisfies never;
  }
}

const body: Variants = {
  initial: {},
  enter: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  exit: (direction: Direction) => ({
    opacity: 0,
    x: direction * -28,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  }),
};

export function OnboardingFlow({ redirect }: { redirect?: string }) {
  const destination = redirect ?? "/";
  const google = useGoogleSignIn(
    redirect ? `/onboarding?redirect=${encodeURIComponent(redirect)}` : "/onboarding",
  );
  const [existing, setExisting] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const [direction, setDirection] = useState<Direction>(1);
  const [emailOpen, setEmailOpen] = useState(false);
  const { waiting, saveState, saveProfile, finish } = useOnboardingSession(
    destination,
    (draft) => {
      if (draft !== null) {
        setLevel(draft.fitnessLevel);
        setStep(draft.step);
      }
    },
    () => {
      setDirection(1);
      setStep("done");
    },
  );
  const activeLevel = level ?? DEFAULT_LEVEL;

  const goToStep = (next: Step) => {
    google.clearError();
    setDirection(stepIndex[next] >= stepIndex[step] ? 1 : -1);
    setEmailOpen(false);
    setStep(next);
  };

  const selectLevel = (next: ExperienceLevel) => {
    if (next === level) return;
    setDirection(levels.indexOf(next) >= levels.indexOf(activeLevel) ? 1 : -1);
    setLevel(next);
    writeOnboardingDraft({ version: 2, step: "experience", fitnessLevel: next });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
  };

  const screens: Record<Step, ReactNode> = {
    welcome: (
      <WelcomeStep
        onStart={() => {
          setExisting(false);
          goToStep("experience");
        }}
        onExisting={() => {
          clearOnboardingDraft();
          setExisting(true);
          goToStep("auth");
        }}
      />
    ),
    experience: (
      <ExperienceStep
        value={activeLevel}
        onSelect={selectLevel}
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
        onBack={() => goToStep(existing ? "welcome" : "experience")}
        onRetry={() => level !== null && saveProfile(level)}
        onAbandon={finish}
        emailOpen={emailOpen}
        onEmailOpenChange={setEmailOpen}
      />
    ),
    done: (
      <DoneStep
        buttonLabel={redirect && redirect !== "/" ? "Continue" : "Start training"}
        onContinue={finish}
      />
    ),
  };

  const scene = sceneFor(waiting ? "welcome" : step, activeLevel);

  return (
    <MotionConfig reducedMotion="user">
      <main className="theme-night min-h-svh bg-night-bg font-sans text-night-ink">
        <div className="mx-auto flex h-svh w-full max-w-[440px] flex-col pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <ArtTile
            art={scene.art}
            tint={scene.tint}
            direction={direction}
            size={step === "auth" && !waiting ? (emailOpen ? "mini" : "short") : "full"}
            progress={
              waiting || existing
                ? null
                : { step: stepIndex[step] + 1, total: 4 }
            }
            celebrate={step === "done"}
            onSwipe={
              step === "experience" && !waiting
                ? (swipe) => {
                    const next = levels[levels.indexOf(activeLevel) + swipe];
                    if (next !== undefined) selectLevel(next);
                  }
                : undefined
            }
          />
          {waiting ? (
            <p
              role="status"
              className="flex flex-1 items-center justify-center text-[16px] text-night-ink-soft"
            >
              Loading…
            </p>
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.section
                key={step}
                custom={direction}
                variants={body}
                initial="initial"
                animate="enter"
                exit="exit"
                className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {screens[step]}
              </motion.section>
            </AnimatePresence>
          )}
        </div>
      </main>
    </MotionConfig>
  );
}
