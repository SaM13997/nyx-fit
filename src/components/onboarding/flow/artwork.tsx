import { motion, useReducedMotion } from "framer-motion";
import { Check, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperienceLevel } from "../config";
import { flowCopy, levelLabel } from "./config";

export type LevelBarsTone = "cyan" | "ink";

const levelBarColors: Record<LevelBarsTone, string> = {
  cyan: "#2AC8E0",
  ink: "#23262C",
};

export function LevelBarsIcon({
  count,
  tone = "ink",
  className,
}: {
  count: 1 | 2 | 3;
  tone?: LevelBarsTone;
  className?: string;
}) {
  const heights = [6, 10, 14];
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4", className)}
      fill={levelBarColors[tone]}
      aria-hidden="true"
    >
      {heights.map((height, index) => (
        <rect
          key={height}
          x={index * 5.5}
          y={16 - height}
          width="3.5"
          height={height}
          rx="1.75"
          opacity={index < count ? 1 : 0.28}
        />
      ))}
    </svg>
  );
}

export function SegmentedBar({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex h-1.5 gap-1", className)}>
      <span className="flex-1 rounded-full bg-flow-ink" />
      <span className="flex-1 rounded-full bg-flow-ink" />
      <span className="flex-1 rounded-full bg-flow-bar-rest" />
    </div>
  );
}

export type FaceMood = "calm" | "effort" | "cheer" | "focus";

const facePaths: Record<
  FaceMood,
  { mouth: string; eyes: string; extras?: string; extraWidth?: number }
> = {
  calm: {
    mouth: "M44 62c4 5 12 5 16 0",
    eyes: "M49 49h.01M67 49h.01",
  },
  effort: {
    mouth: "M49 65c2 4 10 4 12 0",
    eyes: "M46 52l6 3M70 52l-6 3",
    extras: "M41 44l8 6M75 44l-8 6",
    extraWidth: 2.6,
  },
  focus: {
    mouth: "M47 63h9M60 63h9",
    eyes: "M46 51h6M64 51h6",
    extras: "M42 44l8 3M74 44l-8 3",
    extraWidth: 2.6,
  },
  cheer: {
    mouth: "M48 56c3 7 13 7 16 0",
    eyes: "M49 46h.01M67 46h.01",
    extras: "M34 30l8 7M82 30l-8 7",
    extraWidth: 2.4,
  },
};

export function FaceSvg({ mood, className }: { mood: FaceMood; className?: string }) {
  const face = facePaths[mood];
  return (
    <svg viewBox="0 0 116 116" fill="none" className={className} aria-hidden="true">
      <circle
        cx="58"
        cy="61"
        r="31"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M34 33l7 5M82 33l-7 5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {face.extras ? (
        <path
          d={face.extras}
          stroke="currentColor"
          strokeWidth={face.extraWidth ?? 2.6}
          strokeLinecap="round"
        />
      ) : null}
      <path
        d={face.eyes}
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d={face.mouth}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BarbellCue({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 26" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 13h48M12 4v18M6 9v8M60 4v18M66 9v8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FaceMark({ mood, className }: { mood: FaceMood; className?: string }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <FaceSvg mood={mood} className="w-full" />
      <BarbellCue className="absolute -top-[4%] left-1/2 w-[52%] -translate-x-1/2 -translate-y-full" />
    </span>
  );
}

export function ProfileCardArt({
  level,
  className,
}: {
  level: ExperienceLevel | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center",
        className,
      )}
    >
      <div className="flow-shadow-float relative w-[210px] rounded-[26px] border border-flow-line bg-flow-card px-5 pt-5 pb-5 text-center">
        <p className="text-[10px] leading-3 font-semibold tracking-[0.2em] text-flow-ink-faint uppercase">
          {flowCopy.save.cardEyebrow}
        </p>
        <span
          aria-hidden="true"
          className="mx-auto mt-3 flex w-[92px] items-center justify-center rounded-[22px] bg-flow-mint text-flow-ink"
        >
          <FaceMark mood="calm" className="w-full" />
        </span>
        <p className="mt-3 font-heading text-[16px] leading-5 font-semibold tracking-[-0.01em] text-flow-ink">
          {flowCopy.save.cardTitle}
        </p>
        <div className="mt-4 h-px bg-flow-line" />
        <p className="mt-3 text-[12px] leading-4 text-flow-ink-faint">
          {flowCopy.save.cardLabel}
        </p>
        <p className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full bg-flow-cyan px-4 py-1.5 text-[13px] leading-4 font-bold text-flow-ink">
          <UserRound className="size-4" strokeWidth={2.25} />
          {levelLabel(level)}
        </p>
        <SegmentedBar className="mt-4" />
      </div>

      <div className="flow-shadow-card absolute right-1 -bottom-3 w-[152px] rotate-[4deg] rounded-[18px] border border-flow-line bg-white p-3 text-left">
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-flow-cyan text-flow-ink"
          >
            <Check className="size-4" strokeWidth={2.25} />
          </span>
          <span className="text-[12.5px] leading-[1.25] font-semibold text-flow-ink">
            {flowCopy.save.capsule}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CheerArt({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("relative flex w-[188px] justify-center", className)}
    >
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 size-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-dashed border-flow-ink/15"
      />
      <div className="relative w-[164px] rounded-full bg-flow-cyan px-3 pt-3 text-flow-ink">
        <FaceMark mood="cheer" className="w-full" />
      </div>
      <span
        aria-hidden="true"
        className="absolute top-[16%] right-[2%] size-2.5 rounded-full bg-flow-cyan"
      />
      <span
        aria-hidden="true"
        className="absolute top-[24%] left-[4%] size-2 rounded-full bg-flow-blush"
      />
    </motion.div>
  );
}
