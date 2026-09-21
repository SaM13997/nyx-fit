import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Exercise, WorkoutSet } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { ArrowLeft, MoreHorizontal, Plus, Share2, Square } from "lucide-react";
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

  const reversedExercises = useMemo(
    () => workout?.exercises.toReversed() ?? [],
    [workout?.exercises]
  );

  if (isLoading) {
    return <div className="min-h-screen text-white p-4">Loading...</div>;
  }

  if (isError && !workout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-white">
        <p className="text-zinc-300">
          Couldn&apos;t load this workout. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="min-h-11 rounded-xl bg-purple-600 px-6 font-semibold text-white transition-colors hover:bg-purple-500"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-white">
        <p className="text-zinc-300">This workout no longer exists.</p>
        <Link
          to="/workouts"
          className="flex min-h-11 items-center rounded-xl bg-white/10 px-6 font-semibold text-white transition-colors hover:bg-white/20"
        >
          Back to workouts
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gap-2  px-4 pt-2 text-white font-sans">
      {isError ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2">
          <p className="text-sm text-red-200">
            Connection issue. Showing saved workout data.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="min-h-11 shrink-0 rounded-xl border border-red-500/30 px-4 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/10"
          >
            Try again
          </button>
        </div>
      ) : null}
      {/* Header */}
      <header className="flex sticky top-0 items-center justify-between   bg-black/80 backdrop-blur-md z-30 py-4  px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="bg-zinc-900/50 hover:bg-zinc-800 p-2.5 rounded-full transition-colors border border-white/5"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
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
                <p className="text-green-400 text-xs font-medium tracking-wide uppercase">
                  In Progress
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-zinc-900/50 hover:bg-zinc-800 p-2.5 rounded-full transition-colors border border-white/5">
            <Share2 className="h-5 w-5 text-gray-400" />
          </button>
          <button className="bg-zinc-900/50 hover:bg-zinc-800 p-2.5 rounded-full transition-colors border border-white/5">
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Stats Card */}
      <div className=" bg-black/80 z-20 backdrop-blur-md  overflow-hidden rounded-4xl p-6 mb-4  border border-white/10 shadow-2xl transition-colors duration-500 ease-out">
        <div
          className={`absolute inset-0 ${
            workout.isActive
              ? "bg-linear-to-br from-green-900/40 via-zinc-900 to-black"
              : "bg-linear-to-br from-purple-900/40 via-zinc-900 to-black"
          }`}
        />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-heading font-bold text-white mb-1">
                {new Date(workout.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-sm  font-medium">
                  {workout.isActive ? "Current Duration" : "Total Duration"}
                </span>
              </div>
            </div>
            {workout.isActive ? (
              <button
                onClick={() => setShowEndWorkoutDialog(true)}
                disabled={isSavePending}
                aria-label="End workout"
                className="group relative flex items-center justify-center h-14 w-14 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <Square className="h-5 w-5 text-red-500 fill-current relative z-10" />
              </button>
            ) : (
              <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
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
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500 font-medium uppercase tracking-wider">
              <div>
                <span className="block text-gray-600 mb-0.5">Started</span>
                {new Date(workout.startTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              {/* Rest Timer */}
              <RestTimer isActiveWorkout={!!workout.isActive} />

              {workout.endTime && (
                <div className="text-right">
                  <span className="block text-gray-600 mb-0.5">Ended</span>
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
            <span className="bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {workout.exercises.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddExercise(true)}
            disabled={isSavePending}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg shadow-purple-900/20 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </button>
        </div>

        {workout.exercises.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-3xl p-12 text-center bg-white/5">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Plus className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Start your workout
            </h3>
            <p className="text-gray-400 text-sm mb-6 max-w-[200px] mx-auto">
              Add your first exercise to begin tracking your progress
            </p>
            <button
              onClick={() => setShowAddExercise(true)}
              disabled={isSavePending}
              className="bg-white text-black hover:bg-gray-200 rounded-xl px-6 py-3 font-bold text-sm transition-colors disabled:opacity-50"
            >
              Add Exercise
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reversedExercises.map((exercise: Exercise) => (
              <ExerciseItem
                key={exercise.id}
                exercise={exercise}
                unit={weightUnit}
                onClick={() => handleExerciseClick(exercise.id)}
              />
            ))}
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

      {/* End Workout Confirmation Dialog */}
      {showEndWorkoutDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-100 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">End Workout?</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              This will save your workout and stop the timer. You can't undo
              this action.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndWorkoutDialog(false)}
                disabled={isSavePending}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-3.5 font-bold text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEndWorkout}
                disabled={isSavePending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-3.5 font-bold text-sm transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50"
              >
                End Workout
              </button>
            </div>
          </div>
        </div>
      )}
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

  return (
    <span className="text-5xl font-bold font-heading tracking-tighter tabular-nums">
      {formatDuration(isActive ? duration : staticDuration)}
    </span>
  );
}
