import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, type Transition } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { formatBodyParts, getLastWorkedParts } from "@/components/dock/bodyParts";
import { DockMenu } from "@/components/dock/DockMenu";
import {
  START_TITLE_LAYOUT_ID,
  START_TITLE_TEXT,
  StartDrawer,
  type DockPhase,
} from "@/components/dock/StartDrawer";
import { getActiveNavHref } from "@/config/navigation";
import { useActiveWorkout, useHomeSnapshot, useStartWorkout } from "@/lib/api/hooks";
import { authClient } from "@/lib/auth-client";
import { pressScale, springs } from "@/lib/motion";
import { useToast } from "@/lib/toast";
import type { Workout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ACTIVE_WORKOUT_TRANSITION_NAME } from "@/lib/view-transitions";

const HIDDEN_ROUTES = new Set(["/login", "/onboarding"]);
// The Start pill's fill and glow (purple-600) as animatable values. They fade
// out while the drawer is open; only the label stays and flies up as the title.
const START_FILL_IDLE = {
  backgroundColor: "rgba(147,51,234,1)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 8px 24px rgba(147,51,234,0.35)",
};
const START_FILL_OPEN = {
  backgroundColor: "rgba(147,51,234,0)",
  boxShadow: "0 12px 40px rgba(0,0,0,0), 0 8px 24px rgba(147,51,234,0)",
};
const DOCK_FADE = { duration: 0.22, ease: [0.2, 0, 0, 1] } satisfies Transition;

const startClosing = (phase: DockPhase): DockPhase => (phase === "open" ? "closing" : phase);
const finishClosing = (phase: DockPhase): DockPhase => (phase === "closing" ? "closed" : phase);
const PRIMARY_BUTTON =
  "flex h-14 min-w-0 flex-1 items-center justify-center gap-2 px-5 text-base font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70";

function formatElapsed(startIso: string | undefined, now: number): string {
  const start = startIso ? Date.parse(startIso) : NaN;
  const total = Number.isNaN(start) ? 0 : Math.max(0, Math.floor((now - start) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${String(minutes).padStart(2, "0")}:${seconds}`;
}

// Coordinates the dock: nav menu, start button and start drawer. Everything
// sits at the bottom so it stays under the thumb. The drawer's surface is the
// dock itself: it is transparent around the resting row and grows out of it.
export function ActionDock() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { data: session } = authClient.useSession();
  const enabled = !!session;
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [phase, setPhase] = useState<DockPhase>("closed");
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const resumeRef = useRef<HTMLAnchorElement>(null);
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const { activeWorkout, isLoading } = useActiveWorkout({ enabled });
  const hasActiveWorkout = !!activeWorkout;
  // Only the start drawer needs history ("Repeat last"). It comes from the
  // home snapshot (usually already cached), fetched when the drawer opens.
  const { snapshot } = useHomeSnapshot({ enabled: enabled && phase !== "closed" });
  const { startWorkout, isPending: isStarting } = useStartWorkout();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Leaving the page (menu link, resume link) never leaves an overlay open.
  useEffect(() => {
    setMenuOpen(false);
    setPhase(startClosing);
  }, [pathname]);

  // A workout in progress replaces the Start button, so the drawer has no origin.
  useEffect(() => {
    if (hasActiveWorkout) setPhase(startClosing);
  }, [hasActiveWorkout]);

  if (!mounted || HIDDEN_ROUTES.has(pathname) || !session) return null;

  const inWorkout = pathname.startsWith("/workout/");
  // The idle row is only "at rest" once the drawer has fully closed again.
  const resting = phase === "closed";

  const handleStart = async (bodyParts: string[]) => {
    try {
      const workout = await startWorkout({ bodyPartWorkedOut: bodyParts });
      setPhase(startClosing);
      // The workouts list has always opened a new workout straight away.
      if (pathname === "/workouts") void navigate({ to: "/workout/$id", params: { id: workout.id } });
    } catch (error) {
      console.error("Failed to start workout:", error);
      showError("Couldn't start your workout. Try again.");
    }
  };

  const openStart = () => {
    setMenuOpen(false);
    setPhase("open");
  };

  return (
    <>
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: phase === "open" ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setPhase(startClosing)}
        className={cn("fixed inset-0 z-50 bg-black/60", resting && "pointer-events-none")}
      />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center [view-transition-name:bottom-nav]">
        <StartDrawer
          phase={phase}
          onClose={() => setPhase(startClosing)}
          onClosed={() => setPhase(finishClosing)}
          restoreFocus={() => (startButtonRef.current ?? resumeRef.current)?.focus({ preventScroll: true })}
          isStarting={isStarting}
          lastWorkedParts={getLastWorkedParts(snapshot?.latestWorkout?.workout ?? null)}
          onStart={(parts) => void handleStart(parts)}
        >
          {/* Shrinks away as the drawer opens and grows back once it has closed. */}
          <motion.div
            initial={false}
            animate={{ opacity: resting ? 1 : 0, scale: resting ? 1 : 0.6 }}
            transition={{ opacity: DOCK_FADE, scale: springs.snappy }}
            className="shrink-0"
          >
            <DockMenu
              open={menuOpen}
              activeHref={getActiveNavHref(pathname)}
              onOpenChange={(open) => {
                setMenuOpen(open);
                if (open) setPhase(startClosing);
              }}
            />
          </motion.div>
          {inWorkout ? null : activeWorkout ? (
            <ResumeButton ref={resumeRef} workout={activeWorkout} />
          ) : isLoading ? (
            <div
              aria-hidden
              className="pointer-events-auto h-14 flex-1 animate-pulse rounded-full bg-white/10"
            />
          ) : (
            <motion.button
              ref={startButtonRef}
              type="button"
              whileTap={pressScale}
              transition={springs.snappy}
              // The visible label is hidden while the drawer title stands in for it.
              aria-label="Start workout"
              aria-haspopup="dialog"
              aria-expanded={phase === "open"}
              onClick={openStart}
              className={`pointer-events-auto relative isolate rounded-full hover:brightness-110 ${PRIMARY_BUTTON}`}
            >
              {/* Fill and glow live on their own layer (the button keeps its focus
                  ring), and fade out so only the label is left to fly up. */}
              <motion.span
                aria-hidden
                initial={false}
                animate={resting ? START_FILL_IDLE : START_FILL_OPEN}
                transition={DOCK_FADE}
                className="absolute inset-0 -z-10 rounded-full"
              />
              <motion.span
                aria-hidden
                initial={false}
                animate={{ opacity: resting ? 1 : 0 }}
                transition={DOCK_FADE}
                className="flex"
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
              </motion.span>
              <motion.span
                layoutId={START_TITLE_LAYOUT_ID}
                layoutCrossfade={false}
                transition={resting ? springs.smooth : springs.sheet}
                className={`whitespace-nowrap ${START_TITLE_TEXT}`}
              >
                Start workout
              </motion.span>
            </motion.button>
          )}
        </StartDrawer>
      </div>
    </>
  );
}

type ResumeButtonProps = { workout: Workout; ref: React.Ref<HTMLAnchorElement> };

function ResumeButton({ workout, ref }: ResumeButtonProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = formatBodyParts(workout.bodyPartWorkedOut);

  return (
    <Link
      ref={ref}
      to="/workout/$id"
      params={{ id: workout.id }}
      aria-label={parts ? `Resume workout, ${parts}` : "Resume workout"}
      style={{ viewTransitionName: ACTIVE_WORKOUT_TRANSITION_NAME }}
      className={`pointer-events-auto rounded-full bg-emerald-700 shadow-[0_12px_40px_rgb(0_0_0/0.5),0_8px_24px_rgb(4_120_87/0.35)] transition-colors hover:bg-emerald-600 ${PRIMARY_BUTTON}`}
    >
      <span aria-hidden className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-200" />
      </span>
      <span aria-hidden className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
        <span>Resume</span>
        <span className="tabular-nums">· {formatElapsed(workout.startTime, now)}</span>
        {parts ? <span className="truncate text-sm font-semibold opacity-80">· {parts}</span> : null}
      </span>
    </Link>
  );
}
