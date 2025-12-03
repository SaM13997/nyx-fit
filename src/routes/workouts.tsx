import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Dumbbell } from "lucide-react";
import type { Workout } from "@/lib/types";
import { useWorkouts, useStartWorkout } from "@/lib/convex/hooks";

export const Route = createFileRoute("/workouts")({
  component: WorkoutsPage,
});

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function WorkoutsPage() {
  const { workouts, isLoading } = useWorkouts();

  return (
    <div className="min-h-screen bg-black text-white font-sans relative">
      {/* Visual Design Element - Top 35% */}
      <div className="fixed top-0 left-0 right-0 h-[35vh] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-purple-900/5 to-transparent" />
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="px-4 pt-12">
          <div className="mx-auto max-w-md">
            <h1 className="text-6xl font-bold tracking-tighter bg-gradient-to-br from-purple-400 via-purple-200 to-purple-500 bg-clip-text text-transparent">
              Workouts
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-4 pb-24 pt-[35vh]">
        <div className="mx-auto max-w-md space-y-6">
          <div className="px-1">
            <p className="text-sm text-zinc-400">
              Your training history and progress.
            </p>
          </div>

          <StartWorkoutButton />

          {isLoading ? (
            <div className="text-zinc-500 px-1">Loading workouts...</div>
          ) : (
            <WorkoutList workouts={workouts} />
          )}
        </div>
      </div>
    </div>
  );
}

function StartWorkoutButton() {
  const { startWorkout } = useStartWorkout();
  const navigate = useNavigate();

  const handleStart = async () => {
    try {
      const workout = await startWorkout();
      navigate({ to: `/workout/${workout.id}` });
    } catch (error) {
      console.error("Failed to start workout", error);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleStart}
      className="group relative w-full overflow-hidden rounded-[2rem] p-1 shadow-2xl shadow-purple-900/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800" />
      <div className="relative flex items-center justify-center gap-3 rounded-[1.75rem] bg-black/10 px-6 py-5 backdrop-blur-sm transition-colors group-hover:bg-black/0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
          <Plus className="h-6 w-6" />
        </div>
        <div className="text-left flex-1">
          <span className="block text-lg font-bold text-white">
            Start New Workout
          </span>
          <span className="block text-xs font-medium text-white/80">
            Log a new training session
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function WorkoutList({ workouts }: { workouts: Workout[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <h2 className="text-xl font-bold">Recent History</h2>
        <span className="bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-purple-500/20">
          {workouts.length}
        </span>
      </div>
      {workouts.length === 0 ? (
        <div className="border border-dashed border-purple-500/20 rounded-3xl p-12 text-center bg-purple-500/5">
          <div className="w-16 h-16 bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
            <Dumbbell className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No workouts yet</h3>
          <p className="text-gray-400 text-sm max-w-[200px] mx-auto">
            Start your first workout to begin tracking your progress
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout, index) => (
            <WorkoutCard key={workout.id} workout={workout} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutCard({ workout, index }: { workout: Workout; index: number }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.1,
      }}
      onClick={() => navigate({ to: `/workout/${workout.id}` })}
      className="group relative overflow-hidden rounded-xl border border-purple-500/10 bg-purple-500/5 p-4 transition-all hover:bg-purple-500/10 hover:border-purple-500/20 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-400">
            {formatDate(workout.date)}
          </span>
          <h3 className="text-base font-semibold text-white">
            {workout.exercises.length} {workout.exercises.length === 1 ? 'Exercise' : 'Exercises'}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-xs uppercase tracking-wider text-zinc-500">
              Duration
            </span>
            <span className="block text-sm font-medium text-purple-300">
              {formatDuration(workout.duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Decorative gradient glow on hover */}
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />
    </motion.div>
  );
}
