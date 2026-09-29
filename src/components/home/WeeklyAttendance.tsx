import { useAppearance } from "@/lib/AppearanceContext";
import {
  IndicatorsV1,
  IndicatorsV2,
  IndicatorsV3,
  MonthlyIndicators,
  getWeekData,
  getWeekNumber,
  type AttendanceWorkout,
} from "./WeeklyAttendanceVariations";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion";
import { AnimatedHeight } from "@/components/motion/AnimatedHeight";

interface WeeklyAttendanceProps {
  workouts: AttendanceWorkout[];
  // Workouts per week that unlock the success state.
  goal: number;
  isLoading?: boolean;
}

export function WeeklyAttendance({ workouts, goal, isLoading = false }: WeeklyAttendanceProps) {
  const { attendanceVariant } = useAppearance();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const { workoutsThisWeek } = getWeekData(workouts);
  const isSuccess = workoutsThisWeek >= goal;

  const toggleView = () => {
    setViewMode((prev) => (prev === "week" ? "month" : "week"));
  };

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-[2rem] animate-pulse",
        attendanceVariant === 'circle' ? "h-40" : attendanceVariant === 'bar' ? "h-24" : "h-36",
        "bg-white/5"
      )} />
    );
  }

  const title = viewMode === "week" ? "This Week" : "Last 4 Weeks";

  return (
    <motion.button
      type="button"
      onClick={toggleView}
      whileTap={{ scale: 0.98 }}
      transition={springs.snappy}
      aria-label={`${title}: ${workoutsThisWeek} workouts. Show ${viewMode === "week" ? "last 4 weeks" : "this week"}`}
      className={cn(
        "relative block w-full overflow-hidden border text-left shadow-xl backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-500 outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        attendanceVariant === "bar" ? "rounded-2xl" : "rounded-[2rem]",
        isSuccess
          ? "border-amber-500/30 bg-amber-950/10 shadow-amber-500/10"
          : "border-white/10 bg-zinc-900/50"
      )}
    >
      <AnimatedHeight innerClassName={attendanceVariant === "bar" ? "p-4" : "p-5"}>
        <div className="relative mb-4 flex h-5 items-center justify-between">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h3
              key={viewMode}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={springs.snappy}
              className={cn(
                "pl-1 text-xs font-bold uppercase tracking-widest transition-colors duration-500",
                isSuccess ? "text-amber-500" : "text-zinc-400"
              )}
            >
              {title}
            </motion.h3>
          </AnimatePresence>

          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums transition-colors duration-500",
              isSuccess ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/10 text-emerald-400"
            )}
          >
            {workoutsThisWeek} {workoutsThisWeek === 1 ? "Workout" : "Workouts"}
          </span>
        </div>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={viewMode + attendanceVariant}
            initial={{ opacity: 0, filter: "blur(6px)" }}
            animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.28, delay: 0.05 } }}
            exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.12 } }}
            className="flex w-full"
          >
            {viewMode === "month" ? (
              <MonthlyIndicators workouts={workouts} />
            ) : (
              renderIndicators(attendanceVariant, workouts, isSuccess)
            )}
          </motion.div>
        </AnimatePresence>
      </AnimatedHeight>

      {isSuccess && attendanceVariant === "bar" && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent blur-sm" />
      )}
    </motion.button>
  );
}

function renderIndicators(variant: string, workouts: AttendanceWorkout[], isSuccess: boolean) {
  switch (variant) {
    case "circle":
      return <IndicatorsV2 workouts={workouts} isSuccess={isSuccess} />;
    case "bar":
      return (
        <div className="flex items-center gap-4 w-full">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500",
            isSuccess
              ? "bg-gradient-to-tr from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20"
              : "bg-gradient-to-tr from-orange-500 to-red-600"
          )}>
            <span className="font-bold text-white text-xs">W{getWeekNumber(new Date())}</span>
          </div>
          <IndicatorsV3 workouts={workouts} isSuccess={isSuccess} />
        </div>
      );
    case "pill":
    default:
      return <IndicatorsV1 workouts={workouts} isSuccess={isSuccess} />;
  }
}
