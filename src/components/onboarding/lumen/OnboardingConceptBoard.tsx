import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ExperienceLevel } from "../config";
import { LumenExperienceScreen } from "./screens/LumenExperienceScreen";
import { LumenReadyScreen } from "./screens/LumenReadyScreen";
import { LumenSaveProfileScreen } from "./screens/LumenSaveProfileScreen";
import { LumenWelcomeScreen } from "./screens/LumenWelcomeScreen";
import { lmCaption, lmFocusRing } from "./classes";
import {
  lumenLevelLabel,
  lumenStepLabel,
  lumenStepNumber,
  lumenSteps,
  type LumenStep,
} from "./config";

const stageSizes = {
  phone: { width: 390, height: 844, label: "390 \u00d7 844" },
  compact: { width: 320, height: 568, label: "320 \u00d7 568" },
} as const;

type StageSize = keyof typeof stageSizes;

function assertNever(value: never): never {
  throw new Error(`Unhandled onboarding step: ${String(value)}`);
}

export function OnboardingConceptBoard({
  presentation = false,
  initialStep = "welcome",
  initialSize = "phone",
  initialLevel = null,
}: {
  presentation?: boolean;
  initialStep?: LumenStep;
  initialSize?: StageSize;
  initialLevel?: ExperienceLevel | null;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<LumenStep>(initialStep);
  const [level, setLevel] = useState<ExperienceLevel | null>(initialLevel);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<StageSize>(initialSize);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (saveTimer.current !== null) clearTimeout(saveTimer.current);
    },
    [],
  );

  const jumpTo = (next: LumenStep) => {
    if (saveTimer.current !== null) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setSaving(false);
    setStep(next);
  };

  const handleSave = () => {
    if (saving) return;
    setSaving(true);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      setSaving(false);
      setStep("ready");
    }, 700);
  };

  const renderScreen = () => {
    switch (step) {
      case "welcome":
        return <LumenWelcomeScreen onStart={() => jumpTo("experience")} />;
      case "experience":
        return (
          <LumenExperienceScreen
            value={level}
            onChange={setLevel}
            onContinue={() => jumpTo("save")}
            onBack={() => jumpTo("welcome")}
          />
        );
      case "save":
        return (
          <LumenSaveProfileScreen
            level={level}
            saving={saving}
            onBack={() => jumpTo("experience")}
            onContinue={handleSave}
          />
        );
      case "ready":
        return (
          <LumenReadyScreen
            level={level}
            onOpenDashboard={() => void navigate({ to: "/" })}
          />
        );
      default:
        return assertNever(step);
    }
  };

  if (presentation) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-lm-bg">
        <div
          data-testid="lumen-stage"
          style={{
            width: stageSizes[stage].width,
            height: stageSizes[stage].height,
          }}
          className="relative overflow-hidden bg-lm-bg"
        >
          <MotionConfig reducedMotion="user">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full w-full"
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
          </MotionConfig>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        {lumenSteps.map((item) => {
          const active = item === step;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => jumpTo(item)}
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] leading-4 font-semibold transition-colors duration-150 motion-reduce:transition-none",
                active
                  ? "border-lm-ink bg-lm-ink text-white"
                  : "border-lm-line bg-white text-lm-ink-soft hover:text-lm-ink",
                lmFocusRing,
              )}
            >
              <span
                className={cn(
                  "font-heading tabular-nums",
                  active ? "text-white/80" : "text-lm-ink-faint",
                )}
              >
                {String(lumenStepNumber[item]).padStart(2, "0")}
              </span>
              {lumenStepLabel[item]}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          {(Object.keys(stageSizes) as StageSize[]).map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={stage === size}
              onClick={() => setStage(size)}
              className={cn(
                "lm-shadow-card flex min-h-10 items-center rounded-full border px-3.5 font-heading text-[12px] leading-4 font-medium tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                stage === size
                  ? "border-lm-ink bg-white text-lm-ink"
                  : "border-lm-line bg-white/60 text-lm-ink-faint hover:text-lm-ink",
                lmFocusRing,
              )}
            >
              {stageSizes[size].label}
            </button>
          ))}
        </div>
        <p className={cn(lmCaption, "text-lm-ink-soft")}>
          Draft level:{" "}
          <span className="font-semibold text-lm-ink">
            {lumenLevelLabel(level)}
          </span>
        </p>
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="mx-auto w-max">
          <div
            data-testid="lumen-stage"
            style={{
              width: stageSizes[stage].width,
              height: stageSizes[stage].height,
            }}
            className="relative overflow-hidden rounded-[40px] border border-lm-line bg-lm-bg shadow-[0_40px_90px_-40px_rgba(23,23,25,0.45)] transition-[width,height] duration-300 motion-reduce:transition-none"
          >
            <MotionConfig reducedMotion="user">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="h-full w-full"
                >
                  {renderScreen()}
                </motion.div>
              </AnimatePresence>
            </MotionConfig>
          </div>
        </div>
      </div>

      <p className="mt-4 max-w-[620px] text-[13px] leading-5 font-medium text-lm-ink-soft">
        Interactive visual prototype of the warm light concept. The four screens
        run as one flow: selection carries into the profile and completion
        states, and every action is live. Google sign-in and profile saving are
        simulated inside this board only; the shipped onboarding flow,
        authentication, and profile data are unchanged.
      </p>
    </div>
  );
}
