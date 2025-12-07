import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/types";

interface WeeklyAttendanceProps {
  workouts: Workout[];
  isLoading?: boolean;
}

export function WeeklyAttendance({ workouts, isLoading = false }: WeeklyAttendanceProps) {
  // Get current date and determine the start of the week (Sunday)
  const today = new Date();
  const currentDay = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);

  // Generate array of 7 days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  // Helper to check if a workout exists on a given date
  const hasWorkout = (date: Date) => {
    return workouts.some((workout) => {
      const workoutDate = new Date(workout.date);
      return (
        workoutDate.getDate() === date.getDate() &&
        workoutDate.getMonth() === date.getMonth() &&
        workoutDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (isLoading) {
    return (
      <div className="w-full relative overflow-hidden rounded-[2rem] p-6 border border-white/10 bg-black/80 backdrop-blur-md">
        <div className="h-6 w-32 bg-white/10 rounded-md animate-pulse mb-4" />
        <div className="flex justify-between items-center gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-4 w-4 bg-white/5 rounded-full animate-pulse" />
              <div className="h-10 w-8 bg-white/5 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative overflow-hidden rounded-[2rem] p-6 border border-white/10 bg-black/80 backdrop-blur-md"
    >
      {/* Subtle Background Gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent pointer-events-none"
      />

      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 relative z-10">
        Weekly Activity
      </h3>

      <div className="flex justify-between items-center relative z-10">
        {weekDays.map((date, index) => {
          const active = hasWorkout(date);
          const todayItem = isToday(date);
          const dayName = date.toLocaleDateString("en-US", { weekday: "narrow" }); // T, W, T...

          return (
            <div key={index} className="flex flex-col items-center gap-3">
              <span className={cn(
                "text-xs font-medium",
                todayItem ? "text-white" : "text-gray-500"
              )}>
                {dayName}
              </span>

              <div className={cn(
                "h-10 w-8 rounded-2xl flex items-center justify-center transition-all duration-300",
                active
                  ? "bg-gradient-to-br from-purple-500 to-pink-600 shadow-[0_0_10px_rgba(168,85,247,0.4)] scale-110"
                  : "bg-white/5 hover:bg-white/10",
                todayItem && !active && "border border-white/20"
              )}>
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-white h-1.5 w-1.5 rounded-full"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
