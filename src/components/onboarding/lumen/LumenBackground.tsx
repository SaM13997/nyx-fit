import { motion, useReducedMotion } from "framer-motion";

export type LumenWash = "welcome" | "experience" | "save" | "ready";

const backgroundSrc: Record<LumenWash, string> = {
  welcome: "/onboarding/1.png",
  experience: "/onboarding/4.png",
  save: "/onboarding/2.png",
  ready: "/onboarding/3.png",
};

export function LumenBackground({ wash }: { wash: LumenWash }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-lm-bg"
    >
      <motion.img
        src={backgroundSrc[wash]}
        alt=""
        draggable={false}
        decoding="async"
        fetchPriority={wash === "welcome" ? "high" : undefined}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="lm-drift absolute inset-0 size-full object-cover object-top select-none motion-reduce:animate-none"
      />
    </div>
  );
}
