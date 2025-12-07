import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/types";

interface WorkoutStatusCardProps {
  activeWorkout: Workout | null;
  isLoading?: boolean;
  isStarting: boolean;
  onStartWorkout: () => void;
}

export function WorkoutStatusCard({
  activeWorkout,
  isLoading = false,
  isStarting,
  onStartWorkout,
}: WorkoutStatusCardProps) {
  // Prevent clicking during loading or starting
  const isInteractive = !activeWorkout && !isStarting && !isLoading;

  return (
    <motion.div
      layout
      layoutId="workout-status-container"
      onClick={isInteractive ? onStartWorkout : undefined}
      className={cn(
        "relative overflow-hidden rounded-[2rem] p-6 border border-white/10 shadow-2xl backdrop-blur-md bg-black/80",
        isInteractive && "cursor-pointer",
        (isStarting || isLoading) && "opacity-50"
      )}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Background Gradient - with smooth transition */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{
          background: activeWorkout
            ? "linear-gradient(to bottom right, rgba(1, 107, 40, 0.4), rgba(24, 24, 27, 1), rgba(0, 0, 0, 1))"
            : "linear-gradient(to bottom right, rgba(147, 51, 234, 0.4), rgba(24, 24, 27, 1), rgba(0, 0, 0, 1))",
        }}
        transition={{ duration: 0.5 }}
      />

      {activeWorkout ? (
        <Link
          to="/workout/$id"
          params={{ id: activeWorkout.id }}
          className="absolute inset-0 z-20"
          aria-label="View active workout"
        />
      ) : null}

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Loading Skeleton */}
              <div className="flex items-center justify-between">
                <div className="text-left flex-1">
                  {/* Title skeleton */}
                  <div className="h-7 w-48 bg-white/10 rounded-lg mb-2 animate-pulse" />
                  {/* Subtitle skeleton */}
                  <div className="h-5 w-32 bg-white/5 rounded-md animate-pulse" />
                </div>
                {/* Icon skeleton */}
                <div className="rounded-full h-14 w-14 bg-white/5 border border-white/10 animate-pulse" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Actual Content */}
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <motion.h2
                    layout="position"
                    className={cn(
                      "text-xl font-bold mb-1",
                      activeWorkout ? "text-white" : "text-white"
                    )}
                  >
                    {activeWorkout ? "Active Workout" : "Start New Workout"}
                  </motion.h2>
                  <motion.p
                    layout="position"
                    className={cn(
                      "text-sm font-medium transition-colors duration-500",
                      activeWorkout ? "text-green-400" : "text-gray-400"
                    )}
                  >
                    {activeWorkout
                      ? "In Progress"
                      : isStarting
                        ? "Starting..."
                        : "Begin your fitness session"}
                  </motion.p>
                </div>
                <motion.div
                  layout="position"
                  className={cn(
                    "rounded-full h-14 w-14 flex items-center justify-center border transition-colors duration-500",
                    activeWorkout
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  {activeWorkout ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/20 blur-md rounded-full" />
                      <ArrowUpRight className="h-6 w-6 text-green-500 relative z-10" />
                    </div>
                  ) : (
                    <Plus className="h-6 w-6 text-gray-400" />
                  )}
                </motion.div>
              </div>

              {/* Active workout details - with AnimatePresence for smooth entry */}
              <AnimatePresence>
                {activeWorkout && (
                  <motion.div
                    key="workout-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-between text-xs text-gray-500 font-medium uppercase tracking-wider">
                      <div>
                        <span className="block text-gray-600 mb-0.5">Started</span>
                        {new Date(activeWorkout.startTime!).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-right">
                        <span className="block text-gray-600 mb-0.5">Exercises</span>
                        {activeWorkout.exercises.length}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

