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
        key={wash}
        src={backgroundSrc[wash]}
        alt=""
        draggable={false}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1, scale: reduceMotion ? 1 : [1, 1.03, 1] }}
        transition={{
          opacity: { duration: 0.3, ease: "easeOut" },
          scale: { duration: 34, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute inset-0 size-full object-cover object-top select-none"
      />
    </div>
  );
}
