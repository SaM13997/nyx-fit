import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";

import { Exercise, WorkoutSet } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Share2,
  Square,
} from "lucide-react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ExerciseItem } from "@/components/ExerciseItem";
import { SetDrawer } from "@/components/SetDrawer";
import { AddExerciseDrawer } from "@/components/AddExerciseDrawer";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const Route = createFileRoute("/workout/$id")({
  component: WorkoutPage,
});

function WorkoutPage() {
  const { id } = Route.useParams();
  const workout = useQuery(api.workouts.getWorkout, {
    id: id as Id<"workouts">,
  });
  const updateWorkout = useMutation(api.workouts.updateWorkout);

  const [currentDuration, setCurrentDuration] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showEndWorkoutDialog, setShowEndWorkoutDialog] = useState(false);

  useEffect(() => {
    if (workout?.isActive && workout.startTime) {
      const start = new Date(workout.startTime).getTime();
      const interval = setInterval(() => {
        const now = new Date().getTime();
        setCurrentDuration(Math.floor((now - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [workout?.isActive, workout?.startTime]);

  const handleEndWorkout = async () => {
    if (!workout) return;
    await updateWorkout({
      id: workout.id as Id<"workouts">,
      updates: {
        isActive: false,
        endTime: new Date().toISOString(),
        duration: currentDuration,
      },
    });
    setShowEndWorkoutDialog(false);
  };

  const handleAddSet = async (name: string, weight: number, reps: number) => {
    if (!workout) return;

    let exerciseId: string;
    const existingExercise = workout.exercises.find((e) => e.name === name);

    if (existingExercise) {
      exerciseId = existingExercise.id;
      const newSet: WorkoutSet = {
        id: uuidv4(),
        weight,
        reps,
      };
      await updateWorkout({
        id: workout.id as Id<"workouts">,
        updates: {
          exercises: workout.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, sets: [...ex.sets, newSet] } : ex
          ),
        },
      });
    } else {
      exerciseId = uuidv4();
      const newExercise: Exercise = {
        id: exerciseId,
        name,
        sets: [
          {
            id: uuidv4(),
            weight,
            reps,
          },
        ],
      };
      await updateWorkout({
        id: workout.id as Id<"workouts">,
        updates: {
          exercises: [...workout.exercises, newExercise],
        },
      });
    }
  };

  const handleSetUpdate = async (exerciseId: string, sets: WorkoutSet[]) => {
    if (!workout) return;
    const updatedExercises = workout.exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, sets } : ex
    );
    await updateWorkout({
      id: workout.id as Id<"workouts">,
      updates: {
        exercises: updatedExercises,
      },
    });
  };

  const handleExerciseClick = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    setIsDrawerOpen(true);
  };

  const getExerciseCategories = () => {
    if (!workout) return [];
    const categories = new Set(
      workout.exercises
        .map((e) => e.category)
        .filter((c): c is string => !!c)
    );
    return Array.from(categories);
  };

  if (!workout) {
    return <div className="min-h-screen  text-white p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen pb-12 px-4 pt-2 text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-8  bg-black/80 backdrop-blur-md z-30 py-4 -mx-4 px-4">
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
                <p className="text-green-400 text-xs font-medium tracking-wide uppercase">In Progress</p>
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
      <div className="sticky top-5 bg-black/80 z-20 backdrop-blur-md  overflow-hidden rounded-[2rem] p-6 mb-8 border border-white/10 shadow-2xl">
        <div className={`absolute inset-0 ${workout.isActive
          ? "bg-gradient-to-br from-green-900/40 via-zinc-900 to-black"
          : "bg-gradient-to-br from-purple-900/40 via-zinc-900 to-black"
          }`} />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                {new Date(workout.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-sm font-medium">
                  {workout.isActive ? "Current Duration" : "Total Duration"}
                </span>
              </div>
            </div>
            {workout.isActive ? (
              <button
                onClick={() => setShowEndWorkoutDialog(true)}
                className="group relative flex items-center justify-center h-14 w-14 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-95"
              >
                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <Square className="h-5 w-5 text-red-500 fill-current relative z-10" />
              </button>
            ) : (
              <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-lg font-bold">{workout.exercises.length}</span>
              </div>
            )}
          </div>

          <div className="flex items-end gap-1 mb-6">
            <span className="text-5xl font-bold tracking-tighter tabular-nums">
              {workout.isActive
                ? formatDuration(currentDuration)
                : formatDuration(workout.duration)}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {getExerciseCategories().map((category) => (
              <span
                key={category}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300"
              >
                {category}
              </span>
            ))}
          </div>

          {/* Time Details */}
          {workout.startTime && (
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between text-xs text-gray-500 font-medium uppercase tracking-wider">
              <div>
                <span className="block text-gray-600 mb-0.5">Started</span>
                {new Date(workout.startTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
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
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg shadow-purple-900/20"
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
            <h3 className="text-lg font-bold text-white mb-2">Start your workout</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-[200px] mx-auto">
              Add your first exercise to begin tracking your progress
            </p>
            <button
              onClick={() => setShowAddExercise(true)}
              className="bg-white text-black hover:bg-gray-200 rounded-xl px-6 py-3 font-bold text-sm transition-colors"
            >
              Add Exercise
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {workout.exercises.toReversed().map((exercise: Exercise) => (
              <ExerciseItem
                key={exercise.id}
                exercise={exercise}
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
          workout={workout}
          onUpdate={handleSetUpdate}
        />
      )}

      <AddExerciseDrawer
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onAddSet={handleAddSet}
        exercises={workout.exercises}
      />

      {/* End Workout Confirmation Dialog */}
      {showEndWorkoutDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">End Workout?</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              This will save your workout and stop the timer. You can't undo
              this action.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndWorkoutDialog(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-3.5 font-bold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndWorkout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-3.5 font-bold text-sm transition-colors shadow-lg shadow-red-900/20"
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
