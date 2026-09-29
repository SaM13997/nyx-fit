import type { Transition } from "framer-motion";

// Shared springs so every surface moves with the same physics.
// `duration`/`bounce` springs stay predictable when content size changes.
export const springs = {
  // Presses, toggles, indicators: fast, no overshoot.
  snappy: { type: "spring", duration: 0.3, bounce: 0 },
  // Layout and height changes: settles softly without wobble.
  smooth: { type: "spring", duration: 0.45, bounce: 0 },
  // Sheets and playful reveals: a touch of life.
  sheet: { type: "spring", duration: 0.5, bounce: 0.12 },
  pop: { type: "spring", duration: 0.4, bounce: 0.35 },
} satisfies Record<string, Transition>;

export const fade = { duration: 0.18, ease: [0.2, 0, 0, 1] } satisfies Transition;

// Tap feedback shared by cards and buttons.
export const pressScale = { scale: 0.97 };
