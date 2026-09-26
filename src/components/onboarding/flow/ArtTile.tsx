import { useEffect } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

export type Tint = "lavender" | "mint" | "sky" | "pink" | "peach";
export type ArtId = 1 | 2 | 3 | 4;
export type TileSize = "full" | "short" | "mini";
export type Direction = 1 | -1;

/**
 * Backdrop hues. The art sits on top with `mix-blend-mode: luminosity`, so its
 * pastel fills take on the backdrop hue while the black line work stays black.
 */
const tintColor: Record<Tint, string> = {
  lavender: "#9b72ff",
  mint: "#27dc9b",
  sky: "#3cc4f2",
  pink: "#ff5cc8",
  peach: "#ff8757",
};

/** Paper colour sampled from each source PNG, so the tile edge matches the art. */
const artPaper: Record<ArtId, string> = {
  1: "#f6eafd",
  2: "#f7eafd",
  3: "#f0e4fc",
  4: "#f6eafc",
};
const ART_IDS: ArtId[] = [1, 2, 3, 4];
const artSrc = (id: ArtId) => `/onboarding/${id}.png`;

const sizeClass: Record<TileSize, string> = {
  full: "h-[calc(min(50svh,440px)+env(safe-area-inset-top))]",
  short: "h-[calc(min(36svh,320px)+env(safe-area-inset-top))]",
  mini: "h-[calc(8rem+env(safe-area-inset-top))]",
};

const EASE_OUT: [number, number, number, number] = [0.32, 0.72, 0, 1];

const swap: Variants = {
  enter: (direction: Direction) => ({
    opacity: 0,
    x: `${direction * 60}%`,
    rotate: direction * 12,
    scale: 0.72,
  }),
  center: {
    opacity: 1,
    x: "0%",
    rotate: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 240, damping: 19, mass: 0.9 },
  },
  exit: (direction: Direction) => ({
    opacity: 0,
    x: `${direction * -60}%`,
    rotate: direction * -12,
    scale: 0.72,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  }),
};

export function ArtTile({
  art,
  tint,
  size,
  direction,
  progress,
  celebrate = false,
  onSwipe,
}: {
  art: ArtId;
  tint: Tint;
  size: TileSize;
  direction: Direction;
  progress: { step: number; total: number } | null;
  celebrate?: boolean;
  onSwipe?: (direction: Direction) => void;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    for (const id of ART_IDS) {
      const image = new Image();
      image.src = artSrc(id);
    }
  }, []);

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    const travel = info.offset.x + info.velocity.x * 0.2;
    if (travel < -70) onSwipe?.(1);
    else if (travel > 70) onSwipe?.(-1);
  };

  return (
    <div
      className={cn(
        "relative isolate shrink-0 overflow-hidden rounded-b-[36px]",
        "transition-[height] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
        sizeClass[size],
      )}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        initial={false}
        animate={{ backgroundColor: tintColor[tint] }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 mix-blend-luminosity"
        style={{ backgroundColor: artPaper[art] }}
      >
        <motion.div
          className={cn(
            "absolute inset-x-0 top-[calc(env(safe-area-inset-top)+1.75rem)] bottom-0",
            onSwipe && "cursor-grab touch-pan-y active:cursor-grabbing",
          )}
          drag={onSwipe ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          onDragEnd={handleDragEnd}
        >
          <motion.div
            className="absolute inset-0"
            animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={art}
                src={artSrc(art)}
                alt=""
                draggable={false}
                custom={direction}
                variants={swap}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 size-full object-contain p-3 select-none [mask-image:radial-gradient(closest-side,#000_82%,transparent)]"
              />
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
      {progress ? <Progress {...progress} /> : null}
      {celebrate && !reduceMotion ? <Burst /> : null}
    </div>
  );
}

function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="absolute inset-x-6 top-[max(1.25rem,calc(env(safe-area-inset-top)+0.5rem))] flex gap-1.5">
      <span className="sr-only">{`Step ${step} of ${total}`}</span>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="h-1 flex-1 overflow-hidden rounded-full bg-[#16131c]/15"
        >
          <motion.span
            className="block h-full origin-left rounded-full bg-[#16131c]"
            initial={false}
            animate={{ scaleX: index < step ? 1 : 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 26,
              delay: index === step - 1 ? 0.12 : 0,
            }}
          />
        </span>
      ))}
    </div>
  );
}

const BURST_COLORS = ["#16131c", "#ff5cc8", "#27dc9b", "#3cc4f2", "#9b72ff"];

/** One-shot confetti pop from behind the character on the final step. */
function Burst() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: 14 }, (_, index) => {
        const angle = (index / 14) * Math.PI * 2 + 0.3;
        const distance = 120 + (index % 3) * 28;
        const size = 7 + (index % 4) * 3;
        return (
          <motion.span
            key={index}
            className="absolute top-1/2 left-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              backgroundColor: BURST_COLORS[index % BURST_COLORS.length],
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: [0, 1.2, 0.8],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 1.1, delay: 0.25, ease: EASE_OUT }}
          />
        );
      })}
    </div>
  );
}
