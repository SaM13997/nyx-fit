import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Fragment,
  ViewTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { motion } from "framer-motion";
import type { Exercise, WorkoutSet } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { MoreHorizontal, Plus, Share2, Square } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ExerciseItem } from "@/components/ExerciseItem";
import { SetDrawer } from "@/components/SetDrawer";
import { AddExerciseDrawer } from "@/components/AddExerciseDrawer";
import { RestTimer } from "@/components/RestTimer";
import type { ExerciseCategory } from "@/lib/exerciseCategories";
import {
  useCurrentProfile,
  useUpdateWorkout,
  useWorkout,
  type WorkoutUpdates,
} from "@/lib/api/hooks";
import { useToast } from "@/lib/toast";
import { Sheet } from "@/components/motion/Sheet";
import { BackButton } from "@/components/BackButton";
import { ACTIVE_WORKOUT_TRANSITION_NAME } from "@/lib/view-transitions";
import { pressScale } from "@/lib/motion";

// Matches the push/pop duration in styles.css.
const ROUTE_TRANSITION_MS = 550;

export const Route = createFileRoute("/workout/$id")({
  component: WorkoutPage,
});

function WorkoutPage() {
  const { id } = Route.useParams();
  const { workout, isLoading, isError, refetch } = useWorkout(id);
  const { profile } = useCurrentProfile();
  const { updateWorkout } = useUpdateWorkout();
  const { error: showError } = useToast();
  const weightUnit = profile?.weightUnit ?? "lbs";

  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showEndWorkoutDialog, setShowEndWorkoutDialog] = useState(false);
  const [isSavePending, setIsSavePending] = useState(false);
  const currentDurationRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const revisionRef = useRef(workout?.revision ?? 0);

  useEffect(() => {
    if (workout !== null) {
      revisionRef.current = workout.revision;
    }
  }, [workout]);

  const saveWorkout = useCallback(
    async (updates: WorkoutUpdates): Promise<boolean> => {
      if (!workout || saveInFlightRef.current) return false;

      saveInFlightRef.current = true;
      setIsSavePending(true);

      try {
        const result = await updateWorkout({
          id: workout.id,
          revision: revisionRef.current,
          updates,
        });

        if (!result.ok) {
          showError(
            "This workout changed elsewhere. Review the latest data and try again."
          );
          const refreshed = await refetch();
          if (refreshed.data) {
            revisionRef.current = refreshed.data.revision;
          }
          return false;
        }

        revisionRef.current = result.workout.revision;
        return true;
      } catch (e) {
        console.error("Failed to save workout:", e);
        showError(
          "Couldn't save your workout. Check your connection and try again."
        );
        return false;
      } finally {
        saveInFlightRef.current = false;
        setIsSavePending(false);
      }
    },
    [workout, updateWorkout, showError, refetch]
  );

  const handleEndWorkout = async () => {
    if (!workout) return;

    if (
      typeof window !== "undefined" &&
      workout.bodyPartWorkedOut &&
      workout.bodyPartWorkedOut.length > 0
    ) {
      try {
        window.localStorage.setItem(
          "lastWorkedBodyParts",
          JSON.stringify(workout.bodyPartWorkedOut)
        );
      } catch (e) {
        console.error("Failed to store last worked body parts", e);
      }
    }

    const saved = await saveWorkout({
      isActive: false,
      endTime: new Date().toISOString(),
      duration: currentDurationRef.current || workout.duration,
    });

    if (saved) {
      setShowEndWorkoutDialog(false);
    }
  };

  const handleAddSet = async (
    name: string,
    category: ExerciseCategory,
    weight: number,
    reps: number
  ): Promise<boolean> => {
    if (!workout) return false;

    const newSet: WorkoutSet = {
      id: uuidv4(),
      weight,
      reps,
    };
    const existingExercise = workout.exercises.find((e) => e.name === name);
    const newExercise: Exercise = {
      id: uuidv4(),
      name,
      category,
      sets: [newSet],
    };

    const exercises = existingExercise
      ? workout.exercises.map((ex) =>
          ex.id === existingExercise.id
            ? {
                ...ex,
                category: ex.category ?? category,
                sets: [...ex.sets, newSet],
              }
            : ex
        )
      : [...workout.exercises, newExercise];

    return saveWorkout({ exercises });
  };

  const handleSetUpdate = async (
    exerciseId: string,
    sets: WorkoutSet[]
  ): Promise<boolean> => {
    if (!workout) return false;

    const exercises = workout.exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, sets } : ex
    );

    return saveWorkout({ exercises });
  };

  const handleExerciseClick = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    setIsDrawerOpen(true);
  };

  // Deferred so new/removed exercises commit in a transition, which lets
  // React's <ViewTransition> animate rows in and glide the rest down.
  const deferredExercises = useDeferredValue(workout?.exercises);
  // Row boundaries arm once the route's push transition has settled: any
  // <ViewTransition> committed during it would start a second transition
  // and cancel the push.
  const [animateRows, setAnimateRows] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setAnimateRows(true), ROUTE_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, []);
  const reversedExercises = useMemo(
    () => deferredExercises?.toReversed() ?? [],
    [deferredExercises]
  );

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading workout" className="flex min-h-dvh flex-col gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-4 py-4">
          <div className="h-11 w-11 animate-pulse rounded-full bg-fill" />
          <div className="h-6 w-40 animate-pulse rounded-lg bg-fill-strong" />
        </div>
        <div className="h-64 animate-pulse rounded-[2rem] bg-fill" />
        <div className="h-24 animate-pulse rounded-2xl bg-fill" />
        <div className="h-24 animate-pulse rounded-2xl bg-fill" />
      </div>
    );
  }

  if (isError && !workout) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-4 text-foreground">
        <p className="text-ink-secondary">
          Couldn&apos;t load this workout. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="min-h-11 rounded-xl bg-brand px-6 font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-4 text-foreground">
        <p className="text-ink-secondary">This workout no longer exists.</p>
        <Link
          to="/workouts"
          className="flex min-h-11 items-center rounded-xl bg-fill-strong px-6 font-semibold text-foreground transition-colors hover:bg-line-strong"
        >
          Back to workouts
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col gap-2 px-4 pb-32 text-foreground font-sans">
      {isError ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-600/40 dark:border-red-500/20 bg-red-500/10 px-4 py-2">
          <p className="text-sm text-red-700 dark:text-red-200">
            Connection issue. Showing saved workout data.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="min-h-11 shrink-0 rounded-xl border border-red-600/40 dark:border-red-500/30 px-4 text-sm font-semibold text-red-700 dark:text-red-100 transition-colors hover:bg-red-500/10"
          >
            Try again
          </button>
        </div>
      ) : null}
      {/* Header */}
      <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between bg-glass px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center gap-3">
          <BackButton fallback="/workouts" className="border-hairline bg-card/50" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {workout.isActive ? "Active Workout" : "Workout Details"}
            </h1>
            {workout.isActive && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <p className="text-green-700 dark:text-green-400 text-xs font-medium tracking-wide uppercase">
                  In Progress
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Share workout"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-card/50 transition-colors hover:bg-fill-strong active:scale-95"
          >
            <Share2 className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            type="button"
            aria-label="More options"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-card/50 transition-colors hover:bg-fill-strong active:scale-95"
          >
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Stats Card */}
      <div
        style={{
          viewTransitionName: workout.isActive ? ACTIVE_WORKOUT_TRANSITION_NAME : undefined,
        }}
        className="relative isolate mb-4 overflow-hidden rounded-[2rem] border border-border bg-card p-6 shadow-float"
      >
        <div
          className={`absolute inset-0 -z-10 ${
            workout.isActive
              ? "bg-linear-to-br from-green-700/40 dark:from-green-900/40 via-card to-background"
              : "bg-linear-to-br from-purple-700/40 dark:from-purple-900/40 via-card to-background"
          }`}
        />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-heading font-bold text-foreground mb-1">
                {new Date(workout.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm  font-medium">
                  {workout.isActive ? "Current Duration" : "Total Duration"}
                </span>
              </div>
            </div>
            {workout.isActive ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowEndWorkoutDialog(true)}
                disabled={isSavePending}
                aria-label="End workout"
                className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-red-600/40 dark:border-red-500/20 bg-red-500/10 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <Square className="h-5 w-5 text-red-700 dark:text-red-500 fill-current relative z-10" />
              </motion.button>
            ) : (
              <div className="h-14 w-14 rounded-full bg-fill border border-border flex items-center justify-center">
                <span className="text-lg font-bold">
                  {workout.exercises.length}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-end gap-1 mb-6">
            <WorkoutDuration
              isActive={!!workout.isActive}
              startTime={workout.startTime}
              staticDuration={workout.duration}
              onDurationChange={(duration) => {
                currentDurationRef.current = duration;
              }}
            />
          </div>

          {/* Tags
          <div className="flex flex-wrap gap-2">
            {getExerciseCategories().map((category) => (
              <span
                key={category}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300"
              >
                {category}
              </span>
            ))}
          </div> */}

          {/* Time Details */}
          {workout.startTime && (
            <div className="mt-6 pt-4 border-t border-hairline flex justify-between items-center text-xs text-ink-subtle font-medium uppercase tracking-wider">
              <div>
                <span className="block text-ink-subtle mb-0.5">Started</span>
                {new Date(workout.startTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              {/* Rest Timer */}
              <RestTimer isActiveWorkout={!!workout.isActive} />

              {workout.endTime && (
                <div className="text-right">
                  <span className="block text-ink-subtle mb-0.5">Ended</span>
                  {new Date(workout.endTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Exercises Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Exercises</h2>
            <span className="bg-fill-strong text-ink-secondary px-2.5 py-0.5 rounded-full text-xs font-bold">
              {workout.exercises.length}
            </span>
          </div>
          <motion.button
            type="button"
            whileTap={pressScale}
            onClick={() => setShowAddExercise(true)}
            disabled={isSavePending}
            className="flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-white shadow-lg shadow-purple-900/20 transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </motion.button>
        </div>

        {workout.exercises.length === 0 ? (
          <div className="border border-dashed border-border rounded-3xl p-12 text-center bg-fill">
            <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
              <Plus className="h-8 w-8 text-ink-subtle" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Start your workout
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-[200px] mx-auto">
              Add your first exercise to begin tracking your progress
            </p>
            <button
              onClick={() => setShowAddExercise(true)}
              disabled={isSavePending}
              className="bg-foreground text-background hover:bg-foreground/85 rounded-xl px-6 py-3 font-bold text-sm transition-colors disabled:opacity-50"
            >
              Add Exercise
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reversedExercises.map((exercise: Exercise) => {
              const item = (
                <ExerciseItem
                  exercise={exercise}
                  unit={weightUnit}
                  onClick={() => handleExerciseClick(exercise.id)}
                />
              );

              return animateRows ? (
                <ViewTransition
                  key={exercise.id}
                  name={`exercise-${exercise.id}`}
                  enter="vt-item-enter"
                  exit="vt-item-exit"
                >
                  {item}
                </ViewTransition>
              ) : (
                <Fragment key={exercise.id}>{item}</Fragment>
              );
            })}
          </div>
        )}
      </div>

      {selectedExercise && (
        <SetDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          exerciseId={selectedExercise}
          unit={weightUnit}
          workout={workout}
          onUpdate={handleSetUpdate}
          isSaving={isSavePending}
        />
      )}

      <AddExerciseDrawer
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onAddSet={handleAddSet}
        unit={weightUnit}
        exercises={workout.exercises}
        isSaving={isSavePending}
      />

      {/* End workout confirmation: a bottom sheet keeps both actions in thumb reach. */}
      <Sheet
        open={showEndWorkoutDialog}
        onClose={() => {
          if (!isSavePending) setShowEndWorkoutDialog(false);
        }}
        labelledBy="end-workout-title"
      >
        <div className="px-6 pb-6 pt-4">
          <h3 id="end-workout-title" tabIndex={-1} className="mb-2 text-xl font-bold outline-none">
            End Workout?
          </h3>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            This will save your workout and stop the timer. You can&apos;t undo
            this action.
          </p>
          <div className="flex gap-3">
            <motion.button
              type="button"
              whileTap={pressScale}
              onClick={() => setShowEndWorkoutDialog(false)}
              disabled={isSavePending}
              className="min-h-12 flex-1 rounded-2xl bg-muted text-sm font-bold text-foreground transition-colors hover:bg-line-strong disabled:opacity-50"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              whileTap={pressScale}
              onClick={handleEndWorkout}
              disabled={isSavePending}
              className="min-h-12 flex-1 rounded-2xl bg-red-500 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {isSavePending ? "Saving…" : "End Workout"}
            </motion.button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function WorkoutDuration({
  isActive,
  startTime,
  staticDuration,
  onDurationChange,
}: {
  isActive: boolean;
  startTime?: string;
  staticDuration: number;
  onDurationChange: (duration: number) => void;
}) {
  const [duration, setDuration] = useState(staticDuration);

  useEffect(() => {
    if (!isActive) {
      onDurationChange(staticDuration);
    }
  }, [isActive, onDurationChange, staticDuration]);

  useEffect(() => {
    if (!isActive || !startTime) {
      setDuration(staticDuration);
      onDurationChange(staticDuration);
      return;
    }

    const start = new Date(startTime).getTime();

    const syncDuration = () => {
      const nextDuration = Math.floor((Date.now() - start) / 1000);
      setDuration(nextDuration);
      onDurationChange(nextDuration);
    };

    syncDuration();
    const interval = window.setInterval(syncDuration, 1000);

    return () => window.clearInterval(interval);
  }, [isActive, onDurationChange, startTime, staticDuration]);

  if (!isActive) {
    return (
      <span className="text-5xl font-bold font-heading tracking-tighter tabular-nums">
        {formatDuration(staticDuration)}
      </span>
    );
  }

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  // Digits roll like a native stopwatch instead of snapping each second.
  return (
    <NumberFlowGroup>
      <span
        role="timer"
        aria-label={`Elapsed ${hours} hours ${minutes} minutes ${seconds} seconds`}
        className="inline-flex items-center text-5xl font-bold font-heading leading-none tracking-tighter tabular-nums"
      >
        {hours > 0 ? <NumberFlow value={hours} suffix=":" /> : null}
        <NumberFlow
          value={minutes}
          format={{ minimumIntegerDigits: hours > 0 ? 2 : 1 }}
          suffix=":"
          digits={{ 1: { max: 5 } }}
        />
        <NumberFlow
          value={seconds}
          format={{ minimumIntegerDigits: 2 }}
          digits={{ 1: { max: 5 } }}
        />
      </span>
    </NumberFlowGroup>
  );
}
