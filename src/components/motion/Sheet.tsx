import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";

import { springs } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  // Accessible name for the dialog: the id of the sheet's heading.
  labelledBy?: string;
  // Rendered in the drag zone under the grabber; dragging here dismisses.
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  // Shared layout id of a trigger element: the sheet grows out of it and
  // shrinks back into it instead of sliding in from the bottom edge.
  layoutId?: string;
  onExitComplete?: () => void;
};

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 600;

// Bottom sheet with native-feeling physics: springs up, follows the finger
// from its grabber/header, flicks away, and hands focus back on close.
export function Sheet({
  open,
  onClose,
  labelledBy,
  header,
  children,
  className,
  layoutId,
  onExitComplete,
}: SheetProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const reduceMotion = useReducedMotion();
  // Reduced motion: crossfade only, no shape morph or slide. Dragging still
  // works because it follows the finger.
  const morph = layoutId !== undefined && !reduceMotion;
  const slide = !morph && !reduceMotion;

  useEffect(() => setPortalTarget(document.body), []);

  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
  });

  useEffect(() => {
    // Waits for the portal so sheets that mount already open still get focus.
    if (!open || !portalTarget) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => onEscape(event);
    window.addEventListener("keydown", onKeyDown);

    const frame = requestAnimationFrame(() => {
      const heading = labelledBy ? document.getElementById(labelledBy) : null;
      (heading ?? panelRef.current)?.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [open, labelledBy, portalTarget]);

  const handleDragEnd = (_: PointerEvent, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) {
      onClose();
    }
  };

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {open ? (
        <div key="sheet" className="fixed inset-0 z-[90]">
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            layoutId={morph ? layoutId : undefined}
            initial={slide ? { y: "100%" } : { opacity: 0 }}
            animate={slide ? { y: 0 } : { opacity: 1 }}
            exit={
              slide
                ? { y: "100%", transition: springs.smooth }
                : { opacity: 0, transition: { duration: 0.2 } }
            }
            transition={morph ? springs.smooth : slide ? springs.sheet : { duration: 0.2 }}
            // Set as a style so layout animations correct the radius under scaling.
            style={morph ? { borderRadius: 28 } : undefined}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.9 }}
            onDragEnd={handleDragEnd}
            className={cn(
              "absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-[1.75rem] border-t border-white/10 bg-zinc-900 pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-12px_48px_rgb(0_0_0/0.5)] outline-none",
              className
            )}
          >
            {/* Overscroll filler so the spring's bounce never reveals a gap. */}
            {slide ? (
              <div aria-hidden className="absolute inset-x-0 top-full h-24 bg-zinc-900" />
            ) : null}
            <div
              className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-white/20" />
              {header}
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    portalTarget
  );
}
