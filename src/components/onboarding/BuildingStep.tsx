import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { copy, derivePlan, headingClass, type QuizAnswers } from "./config";
import { PlanPreviewStep } from "./PreviewSteps";

type BuildingStepProps = {
  answers: QuizAnswers;
  onContinue: () => void;
};

export function BuildingStep({ answers, onContinue }: BuildingStepProps) {
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    timerRef.current = setTimeout(onContinue, reducedMotion ? 500 : 2800);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [onContinue, reducedMotion]);
  const lines =
    answers.goal === "coach"
      ? ["Roster ready.", "Templates lined up.", "Ready for your athletes."]
      : [
          "Goal locked in.",
          "Calibrated to last week.",
          `Split set for ${derivePlan(answers).days} days.`,
        ];

  return (
    <PlanPreviewStep answers={answers} revealDelay={reducedMotion ? 0.2 : 2.5}>
      <div role="status" aria-live="polite">
        <h1 tabIndex={-1} className={headingClass}>
          {copy.building.heading}
        </h1>
      </div>
      <div className="my-9 space-y-5">
        {lines.map((line, index) => (
          <motion.div
            key={line}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: reducedMotion ? 0 : index * 0.7,
              duration: 0.3,
            }}
            className="flex items-center gap-3 text-zinc-300"
          >
            <span className="flex size-6 items-center justify-center rounded-full border border-white/20 bg-white/5">
              <Check aria-hidden="true" className="size-3.5" />
            </span>
            {line}
          </motion.div>
        ))}
      </div>
    </PlanPreviewStep>
  );
}
