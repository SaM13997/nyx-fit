import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "@tanstack/react-router";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useIsPresent,
} from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Clock3, Dumbbell } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth-client";
import { useUpsertCurrentProfile } from "@/lib/convex/hooks";
import { cn } from "@/lib/utils";
import { BuildingStep } from "./BuildingStep";
import { LoggerPeekStep, PlanPreviewStep } from "./PreviewSteps";
import { QuestionStep } from "./QuestionStep";
import { ScheduleStep } from "./ScheduleStep";
import {
  actionClass,
  buildSequence,
  clearStaged,
  copy,
  defaultDays,
  deriveFitnessLevel,
  focusClass,
  goalOptions,
  headingClass,
  levelOptions,
  linkClass,
  readStagedOnboarding,
  writeStaged,
  type QuizAnswers,
  type StagedOnboarding,
  type StepId,
} from "./config";

const stepVariants = {
  enter: (direction: number) => ({ x: 20 * direction, opacity: 0 }),
  visible: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: -20 * direction, opacity: 0 }),
};

function StepFrame({
  children,
  direction,
  shouldFocus,
}: {
  children: ReactNode;
  direction: number;
  shouldFocus: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const present = useIsPresent();
  useEffect(() => {
    if (shouldFocus) ref.current?.querySelector("h1")?.focus();
  }, [shouldFocus]);
  return (
    <motion.div
      ref={ref}
      inert={!present}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="w-full py-8 sm:py-12"
    >
      {children}
    </motion.div>
  );
}

export function OnboardingFlow({ redirect }: { redirect?: string }) {
  const router = useRouter();
  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();
  const session = sessionData?.session;
  const { upsertCurrentProfile } = useUpsertCurrentProfile();
  const [index, setIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(1);
  const [direction, setDirection] = useState(1);
  const [focusStepId, setFocusStepId] = useState<StepId | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers>({
    goal: null,
    lastWeekSessions: null,
    daysPerWeek: null,
    equipment: ["dumbbells", "bodyweight"],
  });
  const flowStartedRef = useRef(false);
  const cancelledRef = useRef(false);
  const leavingRef = useRef(false);
  const sequence = buildSequence(answers.goal);
  const step = sequence[index];
  const reached = Math.min(maxIndex, sequence.length - 1);
  const authCallbackUrl = redirect
    ? `/onboarding?redirect=${encodeURIComponent(redirect)}`
    : "/onboarding";

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const commitStaged = useCallback(
    async (staged: StagedOnboarding) => {
      if (staged.goal === "coach" || staged.fitnessLevel === null) return;
      try {
        await upsertCurrentProfile({
          updates: { fitnessLevel: staged.fitnessLevel },
        });
      } catch {
        if (cancelledRef.current) return;
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (cancelledRef.current) return;
        try {
          await upsertCurrentProfile({
            updates: { fitnessLevel: staged.fitnessLevel },
          });
        } catch {
          return;
        }
      }
    },
    [upsertCurrentProfile],
  );

  useEffect(() => {
    if (isSessionPending || !session || flowStartedRef.current) return;
    flowStartedRef.current = true;
    const staged = readStagedOnboarding();
    if (staged?.fitnessLevel) {
      void commitStaged(staged)
        .finally(clearStaged)
        .then(() => {
          if (!cancelledRef.current) router.history.push(redirect ?? "/");
        });
    } else {
      clearStaged();
      router.history.push(redirect ?? "/");
    }
  }, [isSessionPending, session, redirect, router.history, commitStaged]);

  const goTo = useCallback(
    (target: StepId, goal = answers.goal) => {
      const nextIndex = buildSequence(goal).indexOf(target);
      if (nextIndex < 0) return;
      flowStartedRef.current = true;
      setDirection(nextIndex < index ? -1 : 1);
      setFocusStepId(target);
      setIndex(nextIndex);
      setMaxIndex((previous) => Math.max(previous, nextIndex));
    },
    [answers.goal, index],
  );

  const showPreview = useCallback(() => goTo("plan-preview"), [goTo]);
  const showAuth = useCallback(() => goTo("auth"), [goTo]);
  const stageAnswers = (nextAnswers: QuizAnswers) => {
    if (!nextAnswers.goal) return;
    writeStaged({
      fitnessLevel: deriveFitnessLevel(nextAnswers),
      goal: nextAnswers.goal,
    });
    goTo("building", nextAnswers.goal);
  };
  const handleEmailAuthenticated = () => {
    flowStartedRef.current = true;
    const staged = readStagedOnboarding();
    if (staged) void commitStaged(staged);
    clearStaged();
    goTo("done");
  };

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <div>
            <div
              aria-hidden="true"
              className="relative mx-auto mb-10 flex h-56 max-w-80 items-center justify-center sm:h-64"
            >
              <div className="absolute size-52 rounded-full border border-white/10 sm:size-60" />
              <div className="absolute size-40 rounded-full border border-white/5 sm:size-48" />
              <div className="relative w-64 -rotate-6 rounded-2xl border border-white/15 bg-linear-to-br from-zinc-800 to-zinc-950 p-5 shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Every rep counts
                  </span>
                  <Dumbbell className="size-5 text-zinc-300" />
                </div>
                <div className="mt-5 flex items-end gap-1.5">
                  {[24, 36, 30, 48, 42, 60, 72].map((height, bar) => (
                    <div
                      key={bar}
                      style={{ height }}
                      className={cn(
                        "flex-1 rounded-t-sm bg-white/15",
                        bar === 6 && "bg-white/80",
                      )}
                    />
                  ))}
                </div>
                <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-xs text-zinc-400">
                  <span>Your effort.</span>
                  <span>Your progress.</span>
                </div>
              </div>
              <div className="absolute -right-1 bottom-3 flex rotate-3 items-center gap-3 rounded-xl border border-white/15 bg-zinc-900 p-3 shadow-xl">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/10">
                  <Check className="size-5" />
                </span>
                <span className="text-sm font-semibold">One set closer.</span>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              <Clock3 aria-hidden="true" className="size-3.5" />
              {copy.welcome.meta}
            </div>
            <h1
              tabIndex={-1}
              className={cn(headingClass, "max-w-80 text-5xl sm:text-6xl")}
            >
              {copy.welcome.heading}
            </h1>
            <p className="mt-5 max-w-sm text-lg leading-relaxed text-zinc-400">
              {copy.welcome.description}
            </p>
            <button
              type="button"
              onClick={() => {
                clearStaged();
                goTo("goal");
              }}
              className={actionClass}
            >
              {copy.welcome.action}
              <ArrowRight aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                clearStaged();
                showAuth();
              }}
              className={cn(linkClass, "mx-auto mt-2")}
            >
              {copy.welcome.skip}
            </button>
          </div>
        );
      case "goal":
        return (
          <QuestionStep
            name="goal"
            {...copy.goal}
            options={goalOptions}
            value={answers.goal}
            onChange={(goal) => {
              const next = { ...answers, goal };
              setAnswers(next);
              if (goal === "coach") stageAnswers(next);
            }}
            onContinue={() => {
              if (answers.goal === "coach") stageAnswers(answers);
              else goTo("level");
            }}
          />
        );
      case "level":
        return (
          <QuestionStep
            name="level"
            {...copy.level}
            options={levelOptions}
            value={answers.lastWeekSessions}
            onChange={(lastWeekSessions) =>
              setAnswers({
                ...answers,
                lastWeekSessions,
                daysPerWeek: defaultDays(lastWeekSessions),
              })
            }
            onContinue={() => goTo("schedule")}
          />
        );
      case "schedule":
        return (
          <ScheduleStep
            answers={answers}
            onChange={setAnswers}
            onContinue={() => stageAnswers(answers)}
          />
        );
      case "building":
        return <BuildingStep answers={answers} onContinue={showPreview} />;
      case "plan-preview":
        return (
          <PlanPreviewStep
            answers={answers}
            onContinue={() => goTo("logger-peek")}
          />
        );
      case "logger-peek":
        return <LoggerPeekStep onContinue={showAuth} />;
      case "auth":
        return (
          <div>
            <LoginForm
              heading={copy.auth.heading}
              description={copy.auth.description}
              callbackURL={authCallbackUrl}
              onAuthenticated={handleEmailAuthenticated}
              className="[&_h1]:text-4xl [&_h1]:sm:text-5xl [&_h1]:leading-tight [&_input]:focus:border-purple-500 [&_input]:focus:ring-purple-500 [&_button[type=submit]]:hover:bg-purple-700 [&_button]:focus-visible:ring-purple-500 [&_.text-gray-500]:text-zinc-400 [&_.text-zinc-500]:text-zinc-400 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-purple-500 motion-reduce:[&_*]:transition-none motion-reduce:[&_*]:animate-none"
            />
            <button
              type="button"
              onClick={() => {
                clearStaged();
                goTo("done");
              }}
              className={cn(linkClass, "mx-auto mt-6")}
            >
              {copy.auth.skip}
            </button>
          </div>
        );
      case "done":
        return (
          <div className="text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-10 flex size-28 items-center justify-center rounded-full border border-white/15 bg-white/5 shadow-2xl"
            >
              <Check className="size-12" strokeWidth={1.5} />
            </div>
            <h1 tabIndex={-1} className={headingClass}>
              {copy.done.heading}
            </h1>
            <p className="mt-4 text-lg text-zinc-400">
              {copy.done.description}
            </p>
            <button
              type="button"
              disabled={leaving}
              onClick={() => {
                if (leavingRef.current) return;
                leavingRef.current = true;
                setLeaving(true);
                clearStaged();
                router.history.push(redirect ?? "/");
              }}
              className={actionClass}
            >
              {copy.done.action}
              <ArrowRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        );
      default:
        return step satisfies never;
    }
  };

  const canGoBack =
    step === "goal" ||
    step === "level" ||
    step === "schedule" ||
    step === "plan-preview" ||
    step === "logger-peek";

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate flex min-h-svh flex-col overflow-x-clip bg-black px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-zinc-900 to-transparent" />
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-purple-900/20 blur-3xl" />
          <div className="absolute -left-20 top-60 size-64 rounded-full bg-blue-900/10 blur-3xl" />
        </div>
        <header className="mx-auto w-full max-w-md">
          <div className="mb-6 flex min-h-11 items-center justify-between">
            <span className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.22em]">
              <Dumbbell aria-hidden="true" className="size-5" />
              Nyx Fit
            </span>
            <span className="text-xs uppercase tracking-[0.16em] text-zinc-400">
              Built around you
            </span>
          </div>
          <div
            key={answers.goal}
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin={1}
            aria-valuemax={sequence.length}
            aria-valuenow={reached + 1}
            className="flex gap-1.5"
          >
            {sequence.map((id, segmentIdx) => (
              <div
                key={id}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  segmentIdx <= reached ? "bg-white" : "bg-white/10",
                )}
              />
            ))}
          </div>
          <div className="mt-3 flex min-h-11 items-center justify-between">
            {canGoBack ? (
              <button
                type="button"
                onClick={() =>
                  goTo(
                    step === "plan-preview"
                      ? answers.goal === "coach"
                        ? "goal"
                        : "schedule"
                      : sequence[index - 1],
                  )
                }
                className={cn(
                  "-ml-2 flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-zinc-400 hover:text-white",
                  focusClass,
                )}
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                Back
              </button>
            ) : (
              <span />
            )}
            <span className="text-xs tabular-nums text-zinc-400">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(sequence.length).padStart(2, "0")}
            </span>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 items-center">
          {isSessionPending || (session && focusStepId === null) ? (
            <p role="status" className="w-full py-20 text-center text-zinc-400">
              Loading…
            </p>
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <StepFrame
                key={step}
                direction={direction}
                shouldFocus={focusStepId === step}
              >
                {renderStep()}
              </StepFrame>
            </AnimatePresence>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}
