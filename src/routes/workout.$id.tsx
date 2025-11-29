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

  const handleAddExercise = async (name: string) => {
    if (!workout) return;
    const newExercise: Exercise = {
      id: uuidv4(),
      name,
      sets: [],
    };
    await updateWorkout({
      id: workout.id as Id<"workouts">,
      updates: {
        exercises: [...workout.exercises, newExercise],
      },
    });
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
    return <div className="min-h-screen bg-black text-white p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black pb-24 px-4 pt-2 text-white">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={() => window.history.back()} className="mr-3">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {workout.isActive ? "Active Workout" : "Workout Details"}
            </h1>
            {workout.isActive && (
              <p className="text-green-400 text-sm">In Progress</p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="bg-white/10 p-2 rounded-full">
            <Share2 className="h-5 w-5" />
          </button>
          <button className="bg-white/10 p-2 rounded-full">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        className={`${workout.isActive ? "bg-green-400/20" : "bg-purple-400/20"
          } rounded-3xl p-5 mb-6`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">
              {new Date(workout.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </h2>
            <p className="text-gray-400 mt-1">
              {workout.isActive ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Duration: {formatDuration(currentDuration)}
                </span>
              ) : (
                `Duration: ${formatDuration(workout.duration)}`
              )}
            </p>
            {/* Tags/Categories */}
            <div className="flex flex-wrap gap-2 mt-2">
              {getExerciseCategories().map((category) => (
                <span key={category} className="text-purple-400 text-xs">
                  #{category}
                </span>
              ))}
            </div>
          </div>
          {workout.isActive ? (
            <button
              onClick={() => setShowEndWorkoutDialog(true)}
              className="bg-red-600/30 hover:bg-red-600/40 border border-red-600/50 rounded-full h-12 w-12 flex items-center justify-center transition-colors"
            >
              <Square className="h-5 w-5 text-red-400 fill-current" />
            </button>
          ) : (
            <div className="bg-white/10 rounded-full h-12 w-12 flex items-center justify-center">
              <span className="font-bold">{workout.exercises.length}</span>
            </div>
          )}
        </div>

        {/* Workout Times */}
        {workout.startTime && (
          <div className="flex justify-between items-center mt-4 text-xs text-white/80">
            <span>
              Started{" "}
              {new Date(workout.startTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {workout.endTime && (
              <span>
                Ended{" "}
                {new Date(workout.endTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-white/10 rounded-full size-7 flex items-center justify-center text-sm font-bold">
              {workout.exercises.length}
            </span>
            <h2 className="text-xl font-bold">Exercises</h2>
          </div>
          <button
            onClick={() => setShowAddExercise(true)}
            className="bg-white/10 p-2 rounded-full"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {workout.exercises.length === 0 ? (
          <div className="bg-white/10 rounded-3xl p-6 text-center">
            <p className="text-gray-400 mb-4">No exercises added yet</p>
            <button
              onClick={() => setShowAddExercise(true)}
              className="bg-purple-500 rounded-xl px-4 py-2 font-medium"
            >
              Add First Exercise
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workout.exercises.map((exercise: Exercise) => (
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
        onAddExercise={handleAddExercise}
      />

      {/* End Workout Confirmation Dialog */}
      {showEndWorkoutDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-white/10">
            <h3 className="text-lg font-bold mb-2">End Workout?</h3>
            <p className="text-gray-400 text-sm mb-6">
              This will save your workout and stop the timer. You can't undo
              this action.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndWorkoutDialog(false)}
                className="flex-1 bg-white/10 rounded-xl py-2.5 px-4 font-medium transition-colors hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleEndWorkout}
                className="flex-1 bg-red-500 hover:bg-red-600 rounded-xl py-2.5 px-4 font-medium transition-colors"
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
