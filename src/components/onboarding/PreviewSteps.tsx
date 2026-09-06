import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useIsPresent, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  actionClass,
  copy,
  derivePlan,
  focusClass,
  headingClass,
  linkClass,
  type QuizAnswers,
} from "./config";

export function PlanPreviewStep({
  answers,
  onContinue,
  children,
  revealDelay,
}: {
  answers: QuizAnswers;
  onContinue?: () => void;
  children?: ReactNode;
  revealDelay?: number;
}) {
  const plan = derivePlan(answers);
  const reducedMotion = useReducedMotion();
  return (
    <div>
      {children ?? (
        <>
          <h1 tabIndex={-1} className={headingClass}>
            {copy.preview.heading}
          </h1>
          <p className="mt-4 text-zinc-400">{copy.preview.description}</p>
        </>
      )}
      <div
        className="relative mt-8"
        aria-hidden={revealDelay !== undefined ? true : undefined}
      >
        <motion.div
          initial={{ opacity: revealDelay === undefined ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: revealDelay ?? 0, duration: 0.3 }}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur"
        >
          <div className="border-b border-white/10 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                {answers.goal === "coach" ? "Coach mode" : "Training preview"}
              </span>
              <Dumbbell aria-hidden="true" className="size-5 text-zinc-400" />
            </div>
            <p className="text-xl font-semibold text-orange-300">
              {plan.levelLabel} · {plan.days} days
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {answers.goal === "coach"
                ? "A look at your coaching setup."
                : "A sample split to get you started."}
            </p>
          </div>
          <ol className="divide-y divide-white/10 px-5">
            {plan.sessions.map((session, index) => {
              const [title, detail] = session.split(" — ");
              return (
                <motion.li
                  key={session}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reducedMotion ? 0 : index * 0.07,
                    duration: 0.3,
                  }}
                  className="flex items-center gap-4 py-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-xs tabular-nums text-zinc-400">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-zinc-400">{detail}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </motion.div>
        {revealDelay !== undefined && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: revealDelay, duration: 0.3 }}
            className="absolute inset-0 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <div className="mb-10 h-4 w-24 rounded-full bg-white/10" />
            {plan.sessions.map((session) => (
              <div key={session} className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-white/10" />
                  <div className="h-2 w-1/2 rounded-full bg-white/5" />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
      {onContinue && (
        <button type="button" onClick={onContinue} className={actionClass}>
          {copy.preview.action}
          <ArrowRight aria-hidden="true" className="size-5" />
        </button>
      )}
    </div>
  );
}

export function LoggerPeekStep({ onContinue }: { onContinue: () => void }) {
  const [completed, setCompleted] = useState(false);
  const present = useIsPresent();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (completed && present) timerRef.current = setTimeout(onContinue, 1200);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [completed, onContinue, present]);

  return (
    <div>
      <h1 tabIndex={-1} className={headingClass}>
        {copy.logger.heading}
      </h1>
      <p className="mt-4 text-zinc-400">One tap. One set closer.</p>
      <div className="mt-9 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">{copy.logger.title}</h2>
          <span className="text-xs uppercase tracking-widest text-zinc-400">
            Try it
          </span>
        </div>
        <p className="font-semibold">{copy.logger.exercise}</p>
        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-400">
              Set 01
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              8 <span className="text-sm font-normal text-zinc-400">reps</span>
            </p>
          </div>
          <button
            type="button"
            aria-label={
              completed ? "Preview set complete" : "Complete preview set"
            }
            aria-pressed={completed}
            onClick={() => setCompleted(true)}
            className={cn(
              "flex size-14 items-center justify-center rounded-full border-2 border-zinc-500 transition-colors duration-150 motion-reduce:transition-none",
              focusClass,
              completed && "border-purple-500 bg-purple-600",
            )}
          >
            {completed ? (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.12 }}
              >
                <Check aria-hidden="true" className="size-6" />
              </motion.span>
            ) : (
              <span className="text-sm font-semibold">Log</span>
            )}
          </button>
        </div>
        <p role="status" className="mt-4 text-sm text-zinc-400">
          {completed
            ? "Set logged. That's all it takes."
            : "Tap the circle to finish your first set."}
        </p>
      </div>
      <button type="button" onClick={onContinue} className={actionClass}>
        {copy.logger.action}
        <ArrowRight aria-hidden="true" className="size-5" />
      </button>
      <button
        type="button"
        onClick={onContinue}
        className={cn(linkClass, "mx-auto mt-2")}
      >
        {copy.logger.skip}
      </button>
    </div>
  );
}
