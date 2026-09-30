import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion";

// Only the day matters for attendance.
export type AttendanceWorkout = { date: string };

export interface IndicatorProps {
  workouts: AttendanceWorkout[];
  isSuccess: boolean;
}

// SHARED UTILS
export const getWeekData = (workouts: AttendanceWorkout[]) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 (Sun) - 6 (Sat)
  // Adjust so 0 is Monday, 6 is Sunday
  const currentDayMondayStart = currentDay === 0 ? 6 : currentDay - 1;

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayMondayStart);
  startOfWeek.setHours(0, 0, 0, 0);

  const workoutDays = new Set(
    workouts.map((workout) => new Date(workout.date).toDateString())
  );

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const hasWorkout = workoutDays.has(date.toDateString());

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    return {
      date,
      hasWorkout,
      isToday,
      dayName: date.toLocaleDateString("en-US", { weekday: "narrow" }),
    };
  });

  const workoutsThisWeek = weekData.filter(d => d.hasWorkout).length;

  return { weekData, workoutsThisWeek };
};

// INDICATORS ONLY - NO CARD SHELL

export function IndicatorsV1({ workouts, isSuccess }: IndicatorProps) {
  const { weekData } = getWeekData(workouts);
  return (
    <div className="flex justify-between items-end h-16 w-full">
      {weekData.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-2 group cursor-default">
          <span className={cn(
            "text-[10px] font-bold transition-colors duration-300",
            day.isToday ? "text-foreground" : "text-ink-subtle group-hover:text-muted-foreground"
          )}>
            {day.dayName}
          </span>
          <div
            className={cn(
              "relative flex w-9 items-center justify-center rounded-full transition-[height,background-color] duration-500 ease-[var(--ease-out-quint)]",
              day.hasWorkout ? "h-12" : "h-9 bg-muted/80",
              day.isToday && !day.hasWorkout && "ring-1 ring-line-strong"
            )}
          >
            {day.hasWorkout ? (
              <motion.div
                initial={{ opacity: 0, scaleY: 0.4 }}
                animate={{ opacity: 0.9, scaleY: 1 }}
                transition={{ ...springs.pop, delay: i * 0.035 }}
                className={cn(
                  "absolute inset-0 origin-bottom rounded-full",
                  isSuccess
                    ? "bg-gradient-to-b from-amber-400 to-orange-600"
                    : "bg-gradient-to-b from-purple-500 to-pink-600"
                )}
              >
                <div className="absolute inset-0 rounded-full bg-white/20 blur-sm" />
              </motion.div>
            ) : null}
            {day.isToday && !day.hasWorkout && (
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function IndicatorsV2({ workouts, isSuccess }: IndicatorProps) {
  const { weekData } = getWeekData(workouts);
  return (
    <div className="flex justify-between items-center w-full z-10 relative">
      {weekData.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
            day.hasWorkout
              ? isSuccess
                ? "bg-amber-200 text-amber-900 shadow-[0_0_15px_rgba(217,119,6,0.3)] dark:shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-110"
                : "bg-purple-200 text-purple-900 shadow-[0_0_15px_rgba(147,51,234,0.3)] dark:bg-[#D0BCFF] dark:text-[#381E72] dark:shadow-[0_0_15px_rgba(208,188,255,0.3)] scale-110"
              : day.isToday
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white ring-1 ring-zinc-500"
                : "bg-transparent text-ink-subtle"
          )}>
            {day.hasWorkout ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...springs.pop, delay: i * 0.035 }}
              >
                {day.date.getDate()}
              </motion.div>
            ) : (
              day.date.getDate()
            )}
          </div>
          <span className={cn(
            "text-[10px] uppercase tracking-wider font-medium",
            day.hasWorkout || day.isToday ? "text-ink-secondary" : "text-ink-subtle"
          )}>
            {day.dayName}
          </span>
        </div>
      ))}
    </div>
  );
}

export function IndicatorsV3({ workouts, isSuccess }: IndicatorProps) {
  const { weekData } = getWeekData(workouts);
  return (
    <div className="flex-1 flex justify-between items-center bg-fill rounded-full p-1.5 px-2 w-full">
      {weekData.map((day, i) => (
        <div key={i} className="relative group">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
            day.hasWorkout
              ? "bg-foreground text-background shadow-lg scale-105"
              : "text-ink-subtle hover:text-ink-secondary"
          )}>
            {day.dayName}
          </div>
          {day.hasWorkout && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springs.pop, delay: i * 0.035 }}
              className={cn(
                "absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full shadow-[0_0_8px]",
                isSuccess ? "bg-amber-400 shadow-amber-500" : "bg-orange-500 shadow-orangered"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function MonthlyIndicators({ workouts }: { workouts: AttendanceWorkout[] }) {
  // Generate last 28 days for a neat 4x7 grid
  const days = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (27 - i));
        return d;
      }),
    []
  );

  const workoutIntensityByDay = useMemo(() => {
    const counts = new Map<string, number>();

    workouts.forEach((workout) => {
      const key = new Date(workout.date).toDateString();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return counts;
  }, [workouts]);

  return (
    <div className="grid grid-cols-7 gap-2 w-full">
      {days.map((date, i) => {
        const intensity = workoutIntensityByDay.get(date.toDateString()) ?? 0;
        const isToday = new Date().toDateString() === date.toDateString();

        return (
          <div key={i} className="flex flex-col items-center gap-1 group relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springs.pop, delay: (i % 7) * 0.02 + Math.floor(i / 7) * 0.03 }}
              className={cn(
                "w-full aspect-square rounded-md",
                intensity === 0 ? "bg-card border border-hairline" :
                  intensity === 1 ? "bg-emerald-200 dark:bg-emerald-800 border-none" :
                    "bg-emerald-500 shadow-[0_0_8px_rgba(5,150,105,0.4)] dark:shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                isToday && "ring-1 ring-foreground"
              )}
            />
            <div className="absolute bottom-full mb-2 bg-popover text-popover-foreground px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-border">
              {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          </div>
        )
      })}
    </div>
  );
}

// Helper for week number
export function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}
