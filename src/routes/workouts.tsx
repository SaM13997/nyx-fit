import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Workout } from "@/lib/types";
import { useWorkouts, useStartWorkout } from "@/lib/convex/hooks";
import { useNavigate } from "@tanstack/react-router";

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
    <div className="min-h-screen bg-black px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workouts</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Your training history and progress.
          </p>
        </div>

        <StartWorkoutButton />
        
        {isLoading ? (
          <div className="text-zinc-500">Loading workouts...</div>
        ) : (
          <WorkoutList workouts={workouts} />
        )}
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
      className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 p-1 shadow-lg shadow-rose-500/20"
    >
      <div className="relative flex items-center justify-center gap-3 rounded-xl bg-black/10 px-6 py-4 backdrop-blur-sm transition-colors group-hover:bg-black/0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
          <Plus className="h-6 w-6" />
        </div>
        <div className="text-left">
          <span className="block text-lg font-bold text-white">
            Start Workout
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
      <h2 className="text-lg font-semibold text-white">Recent History</h2>
      <div className="space-y-3">
        {workouts.map((workout, index) => (
          <WorkoutCard key={workout.id} workout={workout} index={index} />
        ))}
      </div>
    </div>
  );
}

function WorkoutCard({ workout, index }: { workout: Workout; index: number }) {
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
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-400">
            {formatDate(workout.date)}
          </span>
          <h3 className="text-base font-semibold text-white">
            {workout.exercises.length} Exercises
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-xs uppercase tracking-wider text-zinc-500">
              Duration
            </span>
            <span className="block text-sm font-medium text-zinc-300">
              {formatDuration(workout.duration)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Decorative gradient glow on hover */}
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-rose-500/20 blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />
    </motion.div>
  );
}
