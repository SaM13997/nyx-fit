import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/types";

interface WeeklyAttendanceProps {
  workouts: Workout[];
  isLoading?: boolean;
}

// SHARED UTILS
const getWeekData = (workouts: Workout[]) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0-6
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
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

    return { date, hasWorkout, isToday, dayName: date.toLocaleDateString("en-US", { weekday: "narrow" }) };
  });
};

// VARIATION 1: "The Pill Track" - Glassmorphic, vertical pills, gradient active states
export function WeeklyAttendanceV1({ workouts, isLoading }: WeeklyAttendanceProps) {
  const weekData = getWeekData(workouts);

  if (isLoading) return <div className="h-32 bg-white/5 rounded-3xl animate-pulse" />;

  return (
    <div className="w-full relative overflow-hidden rounded-[2rem] p-5 border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
          This Week
        </h3>
        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {workouts.length} Workouts
        </span>
      </div>

      <div className="flex justify-between items-end h-16">
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
                  className="absolute inset-0 rounded-full bg-gradient-to-b from-purple-500 to-pink-600 opacity-90"
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
    </div>
  );
}

// VARIATION 2: "Minimal Material" - Clean, surface colors, circle indicators
export function WeeklyAttendanceV2({ workouts, isLoading }: WeeklyAttendanceProps) {
  const weekData = getWeekData(workouts);

  if (isLoading) return <div className="h-24 bg-zinc-800 rounded-2xl animate-pulse" />;

  return (
    <div className="w-full bg-zinc-900 rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        {weekData.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
              day.hasWorkout
                ? "bg-[#D0BCFF] text-[#381E72] shadow-[0_0_15px_rgba(208,188,255,0.3)] scale-110"
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
    </div>
  );
}

// VARIATION 3: "The Heatmap Bar" - Horizontal sleek look
export function WeeklyAttendanceV3({ workouts, isLoading }: WeeklyAttendanceProps) {
  const weekData = getWeekData(workouts);
  if (isLoading) return <div className="h-20 bg-zinc-900 rounded-xl animate-pulse" />;

  return (
    <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center shrink-0">
          <span className="font-bold text-white text-xs">W{getWeekNumber(new Date())}</span>
        </div>
        <div className="flex-1 flex justify-between items-center bg-white/5 rounded-full p-1.5 px-2">
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
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_orangered]"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper for week number
function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export function WeeklyAttendanceShowcase({ workouts, isLoading }: WeeklyAttendanceProps) {
  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Variation 1: The Pill Track</p>
        <WeeklyAttendanceV1 workouts={workouts} isLoading={isLoading} />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Variation 2: Material Circles</p>
        <WeeklyAttendanceV2 workouts={workouts} isLoading={isLoading} />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Variation 3: Sleek Bar</p>
        <WeeklyAttendanceV3 workouts={workouts} isLoading={isLoading} />
      </div>
    </div>
  );
}
