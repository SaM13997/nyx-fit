import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, Check, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperienceLevel } from "../config";
import { flowCopy, levelLabel } from "./config";
import { caption } from "./classes";

export type LevelBarsTone = "lavender" | "lime" | "ink";

const levelBarColors: Record<LevelBarsTone, string> = {
  lavender: "#B9A9F2",
  lime: "#9FD34B",
  ink: "#2B2B30",
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

export type BarTone = "rest" | "lavender" | "mint" | "lime" | "ink" | "tomato";

export const barToneClass: Record<BarTone, string> = {
  rest: "bg-flow-bar-rest",
  lavender: "bg-flow-lavender",
  mint: "bg-flow-mint",
  lime: "bg-flow-lime",
  ink: "bg-[#26262b]",
  tomato: "bg-flow-tomato",
};

export function BarsCard({
  heights,
  tones,
  caption,
  className,
}: {
  heights: number[];
  tones?: BarTone[];
  caption?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flow-shadow-float rounded-[26px] border border-flow-line bg-flow-card px-5 pt-5 pb-4",
        className,
      )}
    >
      <div aria-hidden="true" className="flex h-[88px] items-end gap-2.5">
        {heights.map((height, index) => (
          <div
            key={`${height}-${index}`}
            style={{ height }}
            className={cn(
              "flex-1 rounded-full",
              barToneClass[tones?.[index] ?? "rest"],
            )}
          />
        ))}
      </div>
      {caption ? (
        <div className="mt-4 flex justify-between gap-3 border-t border-flow-line pt-3 text-flow-ink">
          {caption}
        </div>
      ) : null}
    </div>
  );
}

export function Capsule({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flow-shadow-card inline-flex items-center gap-2.5 rounded-full border border-flow-line bg-white py-2.5 pr-4 pl-2.5 whitespace-nowrap",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-flow-lime text-flow-ink"
      >
        <Check className="size-4" strokeWidth={3} />
      </span>
      <span className={cn(caption, "font-semibold text-flow-ink")}>
        {children}
      </span>
    </div>
  );
}

export function RingsArt({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative flex size-[248px] items-center justify-center",
        className,
      )}
    >
      <motion.svg
        viewBox="0 0 248 248"
        className="absolute inset-0 size-full"
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <circle
          cx="124"
          cy="124"
          r="112"
          fill="none"
          stroke="rgba(23,23,25,0.07)"
          strokeWidth="1"
          strokeDasharray="2 9"
        />
        <circle
          cx="124"
          cy="124"
          r="98"
          fill="none"
          stroke="var(--flow-mint)"
          strokeWidth="1.5"
        />
        <circle
          cx="124"
          cy="124"
          r="84"
          fill="none"
          stroke="rgba(200,246,92,0.5)"
          strokeWidth="1.5"
        />
      </motion.svg>

      <motion.svg
        viewBox="0 0 248 248"
        className="absolute inset-0 size-full"
        aria-hidden="true"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="124"
          cy="124"
          r="91"
          fill="none"
          stroke="var(--flow-lime)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="36 536"
        />
      </motion.svg>

      <motion.div
        className="absolute inset-0"
        aria-hidden="true"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute top-[8px] left-[34%] size-2.5 rounded-full bg-flow-lime" />
      </motion.div>
      <motion.div
        className="absolute inset-0"
        aria-hidden="true"
        animate={reduceMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute top-1/2 right-[8px] size-2.5 -translate-y-1/2 rounded-full bg-flow-forest" />
      </motion.div>

      <motion.span
        initial={reduceMotion ? false : { scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 22,
          delay: 0.05,
        }}
        className="relative flex size-[108px] items-center justify-center rounded-full bg-flow-lime text-flow-ink shadow-[0_0_0_10px_rgba(200,246,92,0.2),0_20px_48px_-14px_rgba(154,205,48,0.75)]"
      >
        <Check className="size-11" strokeWidth={2.5} />
      </motion.span>
    </div>
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
      <svg
        viewBox="0 0 320 320"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <ellipse
          cx="160"
          cy="160"
          rx="148"
          ry="96"
          fill="none"
          stroke="rgba(23,23,25,0.1)"
          strokeWidth="1"
          transform="rotate(-16 160 160)"
        />
        <ellipse
          cx="160"
          cy="160"
          rx="126"
          ry="126"
          fill="none"
          stroke="rgba(200,246,92,0.45)"
          strokeWidth="1.5"
          strokeDasharray="3 10"
        />
        <ellipse
          cx="160"
          cy="160"
          rx="104"
          ry="142"
          fill="none"
          stroke="rgba(217,240,228,0.95)"
          strokeWidth="1.5"
          transform="rotate(20 160 160)"
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute top-[46%] left-[2%] size-2.5 rounded-full bg-flow-ink"
      />
      <span
        aria-hidden="true"
        className="absolute top-[34%] right-[3%] size-2.5 rounded-full bg-flow-forest"
      />

      <div
        aria-hidden="true"
        className="absolute top-1/2 aspect-square w-full -translate-y-1/2 rotate-[10deg] scale-[0.96] rounded-[28px] border border-white/60 bg-flow-lavender/60"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 aspect-square w-full -translate-y-1/2 -rotate-[11deg] scale-[0.94] rounded-[28px] border border-white/60 bg-flow-mint/65"
      />

      <div className="flow-shadow-float relative w-full -rotate-[6deg] rounded-[26px] border border-flow-line bg-flow-card px-5 pt-5 pb-5 text-center">
        <p className="text-[10px] leading-3 font-semibold tracking-[0.2em] text-flow-ink-faint uppercase">
          {flowCopy.save.cardEyebrow}
        </p>
        <span
          aria-hidden="true"
          className="mx-auto mt-3.5 flex size-[58px] items-center justify-center rounded-full bg-flow-lime text-flow-ink"
        >
          <UserRound className="size-7" strokeWidth={1.75} />
        </span>
        <p className="mt-3 font-heading text-[16px] leading-5 font-semibold tracking-[-0.01em] text-flow-ink">
          {flowCopy.save.cardTitle}
        </p>
        <div className="mt-4 h-px bg-flow-line" />
        <p className="mt-3 text-[12px] leading-4 text-flow-ink-faint">
          {flowCopy.save.cardLabel}
        </p>
        <p className="mx-auto mt-2 w-fit rounded-full bg-flow-lime px-4 py-1.5 text-[13px] leading-4 font-bold text-flow-ink">
          {levelLabel(level)}
        </p>
        <div
          aria-hidden="true"
          className="mt-4 flex h-[48px] items-end justify-start gap-1"
        >
          {([14, 22, 32, 44] as const).map((height, index) => (
            <div
              key={height}
              style={{ height }}
              className={cn(
                "w-6 rounded-full",
                (
                  [
                    "bg-flow-lavender",
                    "bg-flow-bar-rest",
                    "bg-flow-mint",
                    "bg-[#26262b]",
                  ] as const
                )[index],
              )}
            />
          ))}
        </div>

        <div className="flow-shadow-card absolute right-0 -bottom-4 w-[140px] rotate-[4deg] rounded-[18px] border border-flow-line bg-white p-3 text-left">
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-flow-lime text-flow-ink"
            >
              <Bookmark className="size-4" strokeWidth={2.25} />
            </span>
            <span className="text-[12.5px] leading-[1.25] font-semibold text-flow-ink">
              {flowCopy.save.capsule}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
