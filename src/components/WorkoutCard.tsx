import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import { cn, formatCountLabel, formatDuration, formatLocaleDate } from "@/lib/utils";
import type { Workout } from "@/lib/types";

interface WorkoutCardProps {
  workout: Workout;
  index?: number;
}

export function WorkoutCard({ workout, index = 0 }: WorkoutCardProps) {
  // Determine if workout is active (no end time or explicitly marked active)
  const isActive = !workout.endTime || workout.isActive;

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
    >
      <Link
        to="/workout/$id"
        params={{ id: workout.id }}
        className={cn(
          "group relative block overflow-hidden rounded-xl border p-4 transition-all cursor-pointer",
          isActive
            ? "bg-green-500/5 border-green-500/10 hover:bg-green-500/10 hover:border-green-500/20"
            : "bg-purple-800/5 border-purple-500/10 hover:bg-purple-500/10 hover:border-purple-500/20"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("text-sm font-medium", isActive ? "text-green-400" : "text-zinc-400")}>
                {formatLocaleDate(workout.date)}
              </span>
              {isActive && (
                <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  <PlayCircle className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>

            <h3 className={cn("text-base font-semibold break-words", isActive ? "text-green-50" : "text-white")}>
              {formatCountLabel(workout.exercises.length, "Exercise")}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <span className="block text-xs uppercase tracking-wider text-zinc-500">
                Duration
              </span>
              <span className={cn("block text-sm font-medium", isActive ? "text-green-300" : "text-purple-100")}>
                {formatDuration(workout.duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Decorative gradient glow on hover */}
        <div
          className={cn(
            "absolute -right-12 -top-12 h-24 w-24 rounded-full blur-2xl transition-opacity opacity-0 group-hover:opacity-100",
            isActive ? "bg-green-500/20" : "bg-purple-500/20"
          )}
        />
      </Link>
    </motion.div>
  );
}
