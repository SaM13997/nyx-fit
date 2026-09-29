import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
  type Transition,
} from "framer-motion";

import { springs } from "@/lib/motion";
import { cn } from "@/lib/utils";

type AnimatedHeightProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  transition?: Transition;
};

// Resizes closer together than this come from content that is already
// animating its own height, so the container follows it frame by frame.
const FOLLOW_WINDOW_MS = 64;

// Animates a container's real height to follow its content. Unlike `layout`,
// nothing is scaled, so text, borders and radii never distort, and siblings
// below reflow smoothly with it.
export function AnimatedHeight({
  children,
  className,
  innerClassName,
  transition = springs.smooth,
}: AnimatedHeightProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const height = useMotionValue(0);
  const [measured, setMeasured] = useState(false);
  const reduceMotion = useReducedMotion();
  const transitionRef = useRef(transition);
  transitionRef.current = transition;
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || typeof ResizeObserver === "undefined") return;

    let controls: AnimationPlaybackControls | undefined;
    let lastResize = Number.NEGATIVE_INFINITY;
    let first = true;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const next = entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height;
      const now = performance.now();
      const following = now - lastResize < FOLLOW_WINDOW_MS;
      lastResize = now;

      // Re-targeting a spring every frame makes it trail behind a nested
      // animation and land late, so continuous changes are tracked directly.
      if (first || following || reduceMotionRef.current) {
        controls?.stop();
        height.set(next);
      } else {
        controls = animate(height, next, transitionRef.current);
      }
      if (first) {
        first = false;
        setMeasured(true);
      }
    });
    observer.observe(inner);

    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [height]);

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      style={{ height: measured ? height : "auto" }}
    >
      <div ref={innerRef} className={cn("relative", innerClassName)}>
        {children}
      </div>
    </motion.div>
  );
}
