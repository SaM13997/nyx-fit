import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type AnimationDefinition,
  type Transition,
  type Variants,
} from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { formatBodyParts } from "@/components/dock/bodyParts";
import { BODY_PARTS } from "@/lib/constants";
import { pressScale, springs } from "@/lib/motion";
import { cn } from "@/lib/utils";

// "closing" keeps the body mounted while its options fade out; the body and
// the footer go away in one commit once that finishes ("closed").
export type DockPhase = "closed" | "open" | "closing";

// Shared by the idle Start button's label and the drawer title, which fly
// into each other. Same family, weight and line-height on both, so the flight
// is a near-uniform scale (16px to 20px) instead of a font swap.
export const START_TITLE_LAYOUT_ID = "dock-start-title";
export const START_TITLE_TEXT = "font-[family-name:var(--font-heading)] font-bold leading-tight";

type StartDrawerProps = {
  phase: DockPhase;
  onClose: () => void;
  // The options finished fading out (or the fallback timer fired): drop the body.
  onClosed: () => void;
  // Hands focus back to the dock's primary action once the drawer stops being modal.
  restoreFocus: () => void;
  isStarting: boolean;
  // Body parts of the last completed workout; the repeat row hides when empty.
  lastWorkedParts: string[];
  onStart: (bodyParts: string[]) => void;
  // The idle dock row (menu + start button). It shares the drawer's bottom row
  // with the footer, so the primary actions stay in the thumb zone.
  children: ReactNode;
};

const HEADING_ID = "start-drawer-heading";
// Only used if the hide animation never reports completion.
const CLOSE_FALLBACK_MS = 400;

// The surface hugs the dock row when closed and stretches to the full width
// when open. Its bottom edge is always below the viewport, so it never shows.
const SURFACE_FADE = { duration: 0.22, ease: [0.2, 0, 0, 1] } satisfies Transition;

// Options enter one after another once the surface is mostly up, and leave together.
const ITEMS_START_DELAY = 0.12;
const ITEMS_STAGGER = 0.03;

const STAGGER_VARIANTS: Variants = {
  hidden: { opacity: 0, filter: "blur(8px)", transition: { duration: 0.12, ease: "easeOut" } },
  visible: (index: number) => ({
    opacity: 1,
    filter: "blur(0px)",
    // A resting blur(0) would keep every option on its own compositing layer.
    transitionEnd: { filter: "none" },
    transition: {
      delay: ITEMS_START_DELAY + index * ITEMS_STAGGER,
      duration: 0.24,
      ease: [0.2, 0, 0, 1],
    },
  }),
};

// Reduced motion: opacity only, and no stagger.
const FADE_VARIANTS: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.1 } },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

// Empty targets: the container only hands its "hidden"/"visible" label to the
// options and reports when their animations have finished.
const CONTAINER_VARIANTS: Variants = { hidden: {}, visible: {} };

function useOptionVariants(): Variants {
  return useReducedMotion() ? FADE_VARIANTS : STAGGER_VARIANTS;
}

// Rows of two, so an expanded part's sub-parts open under its own row.
const ROWS = Array.from({ length: Math.ceil(BODY_PARTS.length / 2) }, (_, i) =>
  BODY_PARTS.slice(i * 2, i * 2 + 2)
);

// Bottom sheet whose surface IS the dock: the resting dock row sits in a
// transparent surface that grows upward into the drawer. ActionDock owns the
// phase; this owns the surface, the options and the footer.
export function StartDrawer({
  phase,
  onClose,
  onClosed,
  restoreFocus,
  isStarting,
  lastWorkedParts,
  onStart,
  children,
}: StartDrawerProps) {
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const variants = useOptionVariants();
  const isOpen = phase === "open";
  const isMounted = phase !== "closed";

  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  });
  const handleClosed = useEffectEvent(onClosed);
  const handleRestoreFocus = useEffectEvent(restoreFocus);

  // The page behind stays put until the drawer has fully settled.
  useEffect(() => {
    if (!isMounted) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [isMounted]);

  // Layout effect: focus moves into the drawer in the same commit that marks the
  // idle row aria-hidden, so a hidden element never keeps focus.
  useLayoutEffect(() => {
    if (isOpen) document.getElementById(HEADING_ID)?.focus({ preventScroll: true });
  }, [isOpen]);

  // A passive effect on purpose: its cleanup runs after the commit that removes
  // `inert` from the idle row, so the Start button can take focus back.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => handleEscape(event);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      handleRestoreFocus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (phase !== "closing") return;
    const id = window.setTimeout(() => handleClosed(), CLOSE_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Reset once the drawer is gone, so tiles do not flicker while it closes.
  useEffect(() => {
    if (phase === "closed") setSelectedParts(new Set());
  }, [phase]);

  const togglePart = (partId: string) => {
    setSelectedParts((current) => {
      const next = new Set(current);
      if (next.has(partId)) {
        next.delete(partId);
        const part = BODY_PARTS.find((p) => p.id === partId);
        part?.subParts?.forEach((sub) => next.delete(`${partId}:${sub}`));
      } else {
        next.add(partId);
      }
      return next;
    });
  };

  const toggleSubPart = (parentId: string, subPart: string) => {
    setSelectedParts((current) => {
      const next = new Set(current);
      const key = `${parentId}:${subPart}`;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const wasLastWorked = (partId: string) =>
    lastWorkedParts.some((p) => p === partId || p.startsWith(`${partId}:`));

  const primaryCount = BODY_PARTS.filter((part) => selectedParts.has(part.id)).length;
  const lastLabel = useMemo(() => formatBodyParts(lastWorkedParts), [lastWorkedParts]);
  const canStart = primaryCount > 0 && !isStarting;

  // Stagger order: subtitle, repeat row, tiles, then the footer buttons.
  const tileBase = lastLabel ? 2 : 1;
  const footerBase = tileBase + BODY_PARTS.length;

  // Opening springs up with a touch of life; closing settles without overshoot.
  const layoutSpring = phase === "closed" ? springs.smooth : springs.sheet;

  const handleAnimationComplete = (definition: AnimationDefinition) => {
    if (definition === "hidden") onClosed();
  };

  return (
    <motion.div
      role={isOpen ? "dialog" : undefined}
      aria-modal={isOpen ? true : undefined}
      aria-labelledby={isOpen ? HEADING_ID : undefined}
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate={isOpen ? "visible" : "hidden"}
      onAnimationComplete={handleAnimationComplete}
      className={cn(
        "relative isolate flex max-h-[88dvh] w-full max-w-lg flex-col pb-[max(1.25rem,env(safe-area-inset-bottom))] text-foreground",
        isOpen && "pointer-events-auto"
      )}
    >
      {/* Childless, so framer's layout scaling never distorts anything. */}
      <motion.div
        aria-hidden
        layout
        initial={false}
        animate={{ opacity: isMounted ? 1 : 0, borderRadius: isMounted ? 28 : 36 }}
        transition={{ layout: layoutSpring, default: SURFACE_FADE }}
        className={cn(
          "pointer-events-none absolute -bottom-24 -z-10 bg-card shadow-sheet",
          isMounted ? "inset-x-0 top-0" : "inset-x-2 -top-2"
        )}
      />

      {isMounted ? (
        <div aria-busy={isStarting} className="mb-3 flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-6 pb-1 pt-5">
            <motion.h2
              id={HEADING_ID}
              tabIndex={-1}
              layoutId={START_TITLE_LAYOUT_ID}
              layoutCrossfade={false}
              transition={springs.sheet}
              className={`w-fit whitespace-nowrap text-xl text-foreground outline-none ${START_TITLE_TEXT}`}
            >
              Start workout
            </motion.h2>
            <motion.p variants={variants} custom={0} className="mt-1 text-sm text-muted-foreground">
              What are you working on today?
            </motion.p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-b border-hairline px-5 pb-3 pt-3">
            {lastLabel ? (
              <motion.button
                type="button"
                variants={variants}
                custom={1}
                whileTap={pressScale}
                disabled={isStarting}
                onClick={() => onStart(lastWorkedParts)}
                className="mb-4 flex min-h-14 w-full items-center gap-3 rounded-2xl border border-success-line bg-success-tint px-4 text-left outline-none transition-colors hover:bg-emerald-500/15 focus-visible:ring-2 focus-visible:ring-success-line disabled:opacity-60"
              >
                <RotateCcw aria-hidden className="h-5 w-5 shrink-0 text-success-ink" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">Repeat last</span>
                  <span className="block truncate text-xs font-medium text-success-ink">
                    {lastLabel}
                  </span>
                </span>
              </motion.button>
            ) : null}

            <div className="flex flex-col">
              {ROWS.map((row, rowIndex) => (
                <div
                  key={row.map((part) => part.id).join("-")}
                  className={cn(rowIndex > 0 && "pt-2.5")}
                >
                  <div className="grid grid-cols-2 gap-2.5">
                    {row.map((part, colIndex) => (
                      <BodyPartTile
                        key={part.id}
                        label={part.label}
                        variants={variants}
                        index={tileBase + rowIndex * 2 + colIndex}
                        selected={selectedParts.has(part.id)}
                        lastWorked={wasLastWorked(part.id)}
                        onToggle={() => togglePart(part.id)}
                      />
                    ))}
                  </div>
                  {row.map((part) => (
                    <AnimatePresence key={`${part.id}-subparts`} initial={false}>
                      {part.subParts && selectedParts.has(part.id) ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={springs.smooth}
                          // Spacing lives inside the clipped panel, so a closed
                          // panel takes no room and the drawer never jumps.
                          className="overflow-hidden"
                        >
                          <div
                            role="group"
                            aria-label={`${part.label} focus`}
                            className={cn(
                              "grid gap-2 pt-2.5",
                              part.subParts.length === 3 ? "grid-cols-3" : "grid-cols-2"
                            )}
                          >
                            {part.subParts.map((subPart, index) => {
                              const key = `${part.id}:${subPart}`;
                              const selected = selectedParts.has(key);
                              return (
                                <motion.button
                                  key={subPart}
                                  type="button"
                                  aria-pressed={selected}
                                  onClick={() => toggleSubPart(part.id, subPart)}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ ...springs.snappy, delay: 0.04 * index }}
                                  whileTap={pressScale}
                                  className={cn(
                                    "flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors duration-200",
                                    selected
                                      ? "border-brand-line bg-brand-tint text-brand-ink"
                                      : "border-border bg-fill text-muted-foreground"
                                  )}
                                >
                                  <AnimatePresence initial={false}>
                                    {selected ? (
                                      <motion.span
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: "auto", opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        transition={springs.snappy}
                                        className="flex overflow-hidden"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </motion.span>
                                    ) : null}
                                  </AnimatePresence>
                                  {subPart}
                                  {wasLastWorked(key) ? (
                                    <>
                                      <span
                                        aria-hidden
                                        className="h-1.5 w-1.5 rounded-full bg-success-ink"
                                      />
                                      <span className="sr-only">, trained last session</span>
                                    </>
                                  ) : null}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* One grid cell, two layers: the idle dock row and the drawer footer sit
          exactly where the other one is, so the thumb never has to move. */}
      <div className="grid shrink-0 grid-cols-1 px-4">
        <div
          inert={isOpen}
          aria-hidden={isOpen || undefined}
          className="col-start-1 row-start-1 flex items-end gap-3"
        >
          {children}
        </div>
        {isMounted ? (
          <div inert={!isOpen} className="relative col-start-1 row-start-1 flex gap-3">
            <motion.button
              type="button"
              variants={variants}
              custom={footerBase}
              whileTap={pressScale}
              onClick={onClose}
              className="h-14 flex-1 rounded-full bg-fill-strong text-base font-bold text-foreground outline-none transition-colors hover:bg-fill-strong focus-visible:ring-2 focus-visible:ring-foreground/60"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              variants={variants}
              custom={footerBase + 1}
              whileTap={canStart ? pressScale : undefined}
              onClick={() => onStart(Array.from(selectedParts))}
              disabled={!canStart}
              className={cn(
                "h-14 flex-[1.4] rounded-full text-base font-bold outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand-line",
                canStart
                  ? "bg-brand text-white shadow-lg shadow-purple-900/30 hover:bg-brand-hover"
                  : "cursor-not-allowed bg-fill text-muted-foreground"
              )}
            >
              {isStarting ? "Starting…" : "Start"}
              <AnimatePresence initial={false}>
                {primaryCount > 0 && !isStarting ? (
                  <motion.span
                    key={primaryCount}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 0.7, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={springs.snappy}
                    className="ml-1.5 inline-block tabular-nums"
                  >
                    · {primaryCount}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

type BodyPartTileProps = {
  label: string;
  variants: Variants;
  index: number;
  selected: boolean;
  lastWorked: boolean;
  onToggle: () => void;
};

function BodyPartTile({ label, variants, index, selected, lastWorked, onToggle }: BodyPartTileProps) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      variants={variants}
      custom={index}
      whileTap={pressScale}
      transition={springs.snappy}
      className={cn(
        "relative flex min-h-14 items-center justify-between gap-2 rounded-2xl border px-4 text-left transition-[background-color,border-color,box-shadow] duration-200",
        selected
          ? "border-brand-line bg-brand-tint shadow-[inset_0_0_0_1px_var(--brand-line)]"
          : "border-border bg-fill hover:bg-fill-strong"
      )}
    >
      <span
        className={cn(
          "text-base font-bold transition-colors duration-200",
          selected ? "text-foreground" : "text-ink-secondary"
        )}
      >
        {label}
      </span>
      <span className="flex items-center gap-2">
        {lastWorked ? (
          <>
            <span
              aria-hidden
              className="rounded-full bg-success-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success-ink"
            >
              Last
            </span>
            <span className="sr-only">, trained last session</span>
          </>
        ) : null}
        <span
          aria-hidden
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border transition-colors duration-200",
            selected ? "border-purple-400 bg-purple-500" : "border-line-strong"
          )}
        >
          <AnimatePresence initial={false}>
            {selected ? (
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, transition: { duration: 0.1 } }}
                transition={springs.pop}
                className="flex"
              >
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      </span>
    </motion.button>
  );
}
