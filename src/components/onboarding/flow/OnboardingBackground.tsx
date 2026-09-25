import { createContext } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { FlowStep } from "./config";

export type BackgroundDirection = "forward" | "back";

export const BackgroundDirectionContext =
  createContext<BackgroundDirection>("forward");

const backgroundSrc: Record<FlowStep, string> = {
  welcome: "/onboarding/1.png",
  experience: "/onboarding/4.png",
  save: "/onboarding/2.png",
  ready: "/onboarding/3.png",
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
          initial={
            offscreen === undefined
              ? { opacity: 0 }
              : { opacity: 0, x: offscreen, scale: 1.04 }
          }
          animate={
            offscreen === undefined
              ? { opacity: 1 }
              : { opacity: 1, x: 0, scale: 1 }
          }
          exit={
            offscreen === undefined
              ? { opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }
              : {
                  opacity: 0,
                  x: -offscreen * 0.3,
                  scale: 1.01,
                  transition: {
                    duration: 0.3,
                    ease: "easeIn",
                    opacity: { duration: 0.12, ease: "easeIn" },
                  },
                }
          }
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={backgroundSrc[step]}
            alt=""
            draggable={false}
            decoding="async"
            fetchPriority={step === "welcome" ? "high" : undefined}
            className="flow-drift absolute inset-0 size-full object-cover object-top select-none motion-reduce:animate-none"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-flow-bg/20 backdrop-blur-[6px]" />
    </div>
  );
}
