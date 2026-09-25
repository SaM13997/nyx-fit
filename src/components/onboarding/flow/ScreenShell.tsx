import { useContext, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { BackgroundDirectionContext } from "./OnboardingBackground";

function StepProgress({ step }: { step: 2 | 3 | 4 }) {
  const segment = step - 1;

  return (
    <div className="mt-3 flex gap-1.5">
      <span className="sr-only">Step {segment} of 3</span>
      {[1, 2, 3].map((value) => (
        <Progress
          key={value}
          aria-hidden="true"
          value={value <= segment ? 100 : 0}
          className="h-1.5 flex-1 bg-flow-bar-rest"
        />
      ))}
    </div>
  );
}

function FlowHeader({
  step,
  showProgress,
}: {
  step: 2 | 3 | 4;
  showProgress: boolean;
}) {
  return (
    <header className="px-6">
      <div className="flex h-8 items-center justify-center">
        <p className="font-heading text-[15px] leading-5 font-semibold tracking-[0.08em] text-flow-ink-soft uppercase">
          Nyx Fit
        </p>
      </div>
      {showProgress ? <StepProgress step={step} /> : null}
    </header>
  );
}

export function ScreenShell({
  step,
  showProgress = true,
  footer,
  children,
}: {
  step: 1 | 2 | 3 | 4;
  showProgress?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const direction = useContext(BackgroundDirectionContext);

  return (
    <div className="relative isolate flex h-full w-full flex-col overflow-hidden text-flow-ink">
      <div className="relative flex min-h-0 flex-1 flex-col pt-[max(1rem,env(safe-area-inset-top))]">
        {step === 1 ? null : (
          <FlowHeader step={step} showProgress={showProgress} />
        )}
        <motion.div
          data-slot="flow-content"
          initial={
            reduceMotion
              ? false
              : { opacity: 0, x: direction === "forward" ? 30 : -30 }
          }
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="scrollbar-hide mt-4 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
        >
          <div className="flex min-h-full w-full flex-col px-6 pb-4">
            {children}
          </div>
        </motion.div>
      </div>
      {footer ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="flow-band shrink-0 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {footer}
        </motion.div>
      ) : null}
    </div>
  );
}
