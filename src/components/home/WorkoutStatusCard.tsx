import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, CornerUpRight, Dumbbell, Link2Off, Plus, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/types";

interface WorkoutStatusCardProps {
  activeWorkout: Workout | null;
  isStarting: boolean;
  onStartWorkout: () => void;
}

export function WorkoutStatusCard({
  activeWorkout,
  isStarting,
  onStartWorkout,
}: WorkoutStatusCardProps) {
  return (
    <motion.div
      layout
      layoutId="workout-status-container"
      onClick={!activeWorkout && !isStarting ? onStartWorkout : undefined}
      className={cn(
        "relative delay-500 overflow-hidden rounded-[2rem] p-6 border border-white/10 shadow-2xl backdrop-blur-md bg-black/80",
        !activeWorkout && !isStarting && "cursor-pointer",
        isStarting && "opacity-50"
      )}
    >
      {/* Background Gradient */}
      <div
        className={cn(
          "absolute inset-0 transition-colors delay-500 duration-500",
          activeWorkout
            ? "bg-gradient-to-br from-green-900/40 via-zinc-900 to-black"
            : "bg-gradient-to-br from-purple-900/40 via-zinc-900 to-black"
        )}
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
        <div className="flex items-center justify-between">
          <div className="text-left">
            <motion.h2
              layoutId="workout-status-title"
              className={cn(
                "text-xl font-bold mb-1",
                activeWorkout ? "text-white" : "text-white"
              )}
            >
              {activeWorkout ? "Active Workout" : "Start New Workout"}
            </motion.h2>
            <motion.p
              layoutId="workout-status-subtitle"
              className={cn(
                "text-sm font-medium delay-500 transition-colors duration-500",
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
            layoutId="workout-status-icon"
            className={cn(
              "rounded-full h-14 w-14 flex items-center justify-center border",
              activeWorkout
                ? "bg-green-500/10 border-green-500/20"
                : "bg-white/5 border-white/10"
            )}
          >
            {activeWorkout ? (
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-md rounded-full" />
                {/* <Dumbbell className="h-6 w-6 text-green-500 relative z-10" /> */}
                <ArrowUpRight className="h-6 w-6  text-green-500 relative z-10" />
              </div>
            ) : (
              <Plus className="h-6 w-6 text-gray-400" />
            )}
          </motion.div>
        </div>
        {activeWorkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 pt-4 border-t border-white/5 flex justify-between text-xs text-gray-500 font-medium uppercase tracking-wider"
          >
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
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

