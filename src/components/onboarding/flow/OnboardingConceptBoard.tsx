import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ExperienceLevel } from "../config";
import {
  BackgroundDirectionContext,
  OnboardingBackground,
  type BackgroundDirection,
} from "./OnboardingBackground";
import { ExperienceScreen } from "./screens/ExperienceScreen";
import { ReadyScreen } from "./screens/ReadyScreen";
import { SaveProfileScreen } from "./screens/SaveProfileScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { caption, focusRing } from "./classes";
import {
  levelLabel,
  stepLabels,
  stepNumbers,
  steps,
  type FlowStep,
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
  initialStep?: FlowStep;
  initialSize?: StageSize;
  initialLevel?: ExperienceLevel | null;
}) {
  const navigate = useNavigate();
  const [nav, setNav] = useState<{
    step: FlowStep;
    direction: BackgroundDirection;
  }>({ step: initialStep, direction: "forward" });
  const step = nav.step;
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

  const jumpTo = (next: FlowStep) => {
    if (saveTimer.current !== null) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setSaving(false);
    setNav((prev) => ({
      step: next,
      direction:
        steps.indexOf(next) >= steps.indexOf(prev.step)
          ? "forward"
          : "back",
    }));
  };

  const handleSave = () => {
    if (saving) return;
    setSaving(true);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      setSaving(false);
      jumpTo("ready");
    }, 700);
  };

  const renderScreen = () => {
    switch (step) {
      case "welcome":
        return (
          <WelcomeScreen
            onStart={() => jumpTo("experience")}
            onExistingAccount={() => void navigate({ to: "/login" })}
          />
        );
      case "experience":
        return (
          <ExperienceScreen
            value={level}
            onChange={setLevel}
            onContinue={() => jumpTo("save")}
            onBack={() => jumpTo("welcome")}
          />
        );
      case "save":
        return (
          <SaveProfileScreen
            level={level}
            state={saving ? { status: "saving" } : { status: "signin" }}
            onSignIn={handleSave}
            onBack={() => jumpTo("experience")}
          />
        );
      case "ready":
        return (
          <ReadyScreen
            level={level}
            remindersEnabled={false}
            remindersPending={false}
            reminderError={null}
            onToggleReminders={() => {}}
            onOpenDashboard={() => void navigate({ to: "/" })}
          />
        );
      default:
        return assertNever(step);
    }
  };

  if (presentation) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-flow-bg">
        <div
          data-testid="flow-stage"
          style={{
            width: stageSizes[stage].width,
            height: stageSizes[stage].height,
          }}
          className="relative overflow-hidden bg-flow-bg"
        >
          <OnboardingBackground step={step} direction={nav.direction} />
          <MotionConfig reducedMotion="user">
            <BackgroundDirectionContext.Provider value={nav.direction}>
              <div className="relative h-full w-full">{renderScreen()}</div>
            </BackgroundDirectionContext.Provider>
          </MotionConfig>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((item) => {
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
                  ? "border-flow-ink bg-flow-ink text-white"
                  : "border-flow-line bg-white text-flow-ink-soft hover:text-flow-ink",
                focusRing,
              )}
            >
              <span
                className={cn(
                  "font-heading tabular-nums",
                  active ? "text-white/80" : "text-flow-ink-faint",
                )}
              >
                {String(stepNumbers[item]).padStart(2, "0")}
              </span>
              {stepLabels[item]}
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
                "flow-shadow-card flex min-h-10 items-center rounded-full border px-3.5 font-heading text-[12px] leading-4 font-medium tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                stage === size
                  ? "border-flow-ink bg-white text-flow-ink"
                  : "border-flow-line bg-white/60 text-flow-ink-faint hover:text-flow-ink",
                focusRing,
              )}
            >
              {stageSizes[size].label}
            </button>
          ))}
        </div>
        <p className={cn(caption, "text-flow-ink-soft")}>
          Draft level:{" "}
          <span className="font-semibold text-flow-ink">
            {levelLabel(level)}
          </span>
        </p>
      </div>

      <div className="mt-5 overflow-x-auto pb-2">
        <div className="mx-auto w-max">
          <div
            data-testid="flow-stage"
            style={{
              width: stageSizes[stage].width,
              height: stageSizes[stage].height,
            }}
            className="relative overflow-hidden rounded-[40px] border border-flow-line bg-flow-bg shadow-[0_40px_90px_-40px_rgba(23,23,25,0.45)] transition-[width,height] duration-300 motion-reduce:transition-none"
          >
            <OnboardingBackground step={step} direction={nav.direction} />
            <MotionConfig reducedMotion="user">
              <BackgroundDirectionContext.Provider value={nav.direction}>
                <div className="relative h-full w-full">{renderScreen()}</div>
              </BackgroundDirectionContext.Provider>
            </MotionConfig>
          </div>
        </div>
      </div>

      <p className="mt-4 max-w-[620px] text-[13px] leading-5 font-medium text-flow-ink-soft">
        Interactive visual prototype of the warm light concept. The four screens
        run as one flow: selection carries into the profile and completion
        states, and every action is live. Google sign-in and profile saving are
        simulated inside this board only; the shipped onboarding flow now runs
        the same screens.
      </p>
    </div>
  );
}
