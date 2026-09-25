import { createContext } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarbellCue, FaceSvg } from "./artwork";
import type { FlowStep } from "./config";

export type BackgroundDirection = "forward" | "back";

export const BackgroundDirectionContext =
  createContext<BackgroundDirection>("forward");

const sceneFields: Record<FlowStep, string> = {
  welcome: "flow-field-blush",
  experience: "flow-field-cyan",
  save: "flow-field-mint",
  ready: "flow-field-mint",
};

const SLIDE_DISTANCE = 44;

function slideX(direction: BackgroundDirection) {
  return direction === "forward" ? SLIDE_DISTANCE : -SLIDE_DISTANCE;
}

export function OnboardingBackground({
  step,
  direction,
}: {
  step: FlowStep;
  direction: BackgroundDirection;
}) {
  const reduceMotion = useReducedMotion();
  const offscreen = reduceMotion ? undefined : slideX(direction);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-flow-bg"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={step}
          initial={offscreen === undefined ? { opacity: 0 } : { opacity: 0, x: offscreen }}
          animate={offscreen === undefined ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={
            offscreen === undefined
              ? { opacity: 0, transition: { duration: 0.14, ease: "easeIn" } }
              : { opacity: 0, x: 0, transition: { duration: 0.14, ease: "easeIn" } }
          }
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div className={`flow-field-top ${sceneFields[step]}`} />
          {step === "welcome" ? (
            <div className="absolute inset-x-0 top-[10%] flex justify-center">
              <div className="relative w-[min(64vw,260px)] rounded-full bg-[#f4b2dc] text-flow-ink">
                <FaceSvg mood="effort" className="w-full" />
                <BarbellCue className="absolute -top-[6%] -right-[4%] w-[32%] -rotate-[12deg]" />
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
