import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ExperienceLevel } from "../config";
import { experienceOptions } from "./config";

const chipTint: Record<ExperienceLevel, string> = {
  beginner: "has-checked:bg-[#7ff0c6]",
  intermediary: "has-checked:bg-[#86d9f7]",
  advanced: "has-checked:bg-[#ff9ade]",
};

/**
 * A scroll-snapping row of native radios. The chip nearest the centre is the
 * selection, so swiping the row picks a level; tapping or arrow keys scroll the
 * chosen chip into the centre.
 */
export function LevelPicker({
  value,
  onChange,
}: {
  value: ExperienceLevel;
  onChange: (value: ExperienceLevel) => void;
}) {
  const reduceMotion = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef(new Map<ExperienceLevel, HTMLLabelElement>());
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const fromScrollRef = useRef(false);
  const programmaticRef = useRef(false);
  const settledRef = useRef(false);
  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (fromScrollRef.current) {
      fromScrollRef.current = false;
      return;
    }
    const scroller = scrollerRef.current;
    const chip = chipRefs.current.get(value);
    if (!scroller || !chip || typeof scroller.scrollTo !== "function") return;
    const left =
      chip.offsetLeft + chip.offsetWidth / 2 - scroller.clientWidth / 2;
    if (Math.abs(scroller.scrollLeft - left) < 1) return;
    const smooth = settledRef.current && !reduceMotion;
    programmaticRef.current = smooth;
    scroller.scrollTo({ left, behavior: smooth ? "smooth" : "instant" });
    settledRef.current = true;
  }, [value, reduceMotion]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let frame = 0;
    let idle = 0;

    const nearest = () => {
      const centre = scroller.scrollLeft + scroller.clientWidth / 2;
      let best: ExperienceLevel | null = null;
      let bestDistance = Infinity;
      for (const [level, chip] of chipRefs.current) {
        const distance = Math.abs(
          chip.offsetLeft + chip.offsetWidth / 2 - centre,
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          best = level;
        }
      }
      return best;
    };

    const onScroll = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        programmaticRef.current = false;
      }, 140);
      if (programmaticRef.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const level = nearest();
        if (level === null || level === valueRef.current) return;
        fromScrollRef.current = true;
        onChangeRef.current(level);
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      window.clearTimeout(idle);
    };
  }, []);

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Training experience</legend>
      <div
        ref={scrollerRef}
        className={cn(
          "flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain py-1",
          "px-[calc(50%-4.25rem)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)]",
        )}
      >
        {experienceOptions.map((option) => (
          <label
            key={option.value}
            ref={(node) => {
              if (node) chipRefs.current.set(option.value, node);
              else chipRefs.current.delete(option.value);
            }}
            className={cn(
              "flex h-12 w-34 shrink-0 cursor-pointer snap-center items-center justify-center rounded-full bg-night-surface text-[15px] font-semibold text-night-ink-soft select-none",
              "scale-[0.92] transition-[background-color,color,scale] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
              "has-checked:scale-100 has-checked:text-night-bg",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-night-ink",
              chipTint[option.value],
            )}
          >
            <input
              type="radio"
              name="experience"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
