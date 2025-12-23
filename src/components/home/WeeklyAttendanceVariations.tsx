import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/types";

export interface IndicatorProps {
  workouts: Workout[];
  isSuccess: boolean;
}

// SHARED UTILS
export const getWeekData = (workouts: Workout[]) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 (Sun) - 6 (Sat)
  // Adjust so 0 is Monday, 6 is Sunday
  const currentDayMondayStart = currentDay === 0 ? 6 : currentDay - 1;

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayMondayStart);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    const hasWorkout = workouts.some((w) => {
      const wDate = new Date(w.date);
      return (
        wDate.getDate() === date.getDate() &&
        wDate.getMonth() === date.getMonth() &&
        wDate.getFullYear() === date.getFullYear()
      );
    });

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
            day.isToday ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"
          )}>
            {day.dayName}
          </span>
          <motion.div
            layout
            className={cn(
              "w-9 rounded-full flex items-center justify-center transition-all duration-500 relative",
              day.hasWorkout ? "h-12" : "h-9 bg-zinc-800/80 hover:bg-zinc-800",
              day.isToday && !day.hasWorkout && "ring-1 ring-white/20"
            )}
          >
            {day.hasWorkout ? (
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-full opacity-90 transition-colors",
                  isSuccess
                    ? "bg-gradient-to-b from-amber-400 to-orange-600"
                    : "bg-gradient-to-b from-purple-500 to-pink-600"
                )}
                layoutId={`active-bg-${i}`}
              >
                <div className="absolute inset-0 bg-white/20 blur-sm rounded-full" />
              </motion.div>
            ) : null}
            {day.isToday && !day.hasWorkout && (
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </motion.div>
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
                ? "bg-amber-200 text-amber-900 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-110"
                : "bg-[#D0BCFF] text-[#381E72] shadow-[0_0_15px_rgba(208,188,255,0.3)] scale-110"
              : day.isToday
                ? "bg-zinc-700 text-white ring-1 ring-zinc-500"
                : "bg-transparent text-zinc-500"
          )}>
            {day.hasWorkout ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                {day.date.getDate()}
              </motion.div>
            ) : (
              day.date.getDate()
            )}
          </div>
          <span className={cn(
            "text-[10px] uppercase tracking-wider font-medium",
            day.hasWorkout || day.isToday ? "text-zinc-300" : "text-zinc-600"
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
    <div className="flex-1 flex justify-between items-center bg-white/5 rounded-full p-1.5 px-2 w-full">
      {weekData.map((day, i) => (
        <div key={i} className="relative group">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
            day.hasWorkout
              ? "bg-zinc-100 text-black shadow-lg scale-105"
              : "text-zinc-500 hover:text-zinc-300"
          )}>
            {day.dayName}
          </div>
          {day.hasWorkout && (
            <motion.div
              layoutId="glow"
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

export function MonthlyIndicators({ workouts }: { workouts: Workout[] }) {
  // Generate last 28 days for a neat 4x7 grid
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d;
  });

  const getIntensity = (date: Date) => {
    const count = workouts.filter(w => {
      const wDate = new Date(w.date);
      return wDate.toDateString() === date.toDateString();
    }).length;
    return count;
  };

  return (
    <div className="grid grid-cols-7 gap-2 w-full">
      {days.map((date, i) => {
        const intensity = getIntensity(date);
        const isToday = new Date().toDateString() === date.toDateString();

        return (
          <div key={i} className="flex flex-col items-center gap-1 group relative">
            <div
              className={cn(
                "w-full aspect-square rounded-md transition-all duration-300",
                intensity === 0 ? "bg-zinc-900 border border-white/5" :
                  intensity === 1 ? "bg-emerald-800 border-none" :
                    "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                isToday && "ring-1 ring-white"
              )}
            />
            <div className="absolute bottom-full mb-2 bg-black px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-white/10">
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
