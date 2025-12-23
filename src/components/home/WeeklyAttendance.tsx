import { useAppearance } from "@/lib/AppearanceContext";
import {
  IndicatorsV1,
  IndicatorsV2,
  IndicatorsV3,
  MonthlyIndicators,
  getWeekData,
  getWeekNumber
} from "./WeeklyAttendanceVariations";
import type { Workout } from "@/lib/types";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WeeklyAttendanceProps {
  workouts: Workout[];
  isLoading?: boolean;
}

export function WeeklyAttendance({ workouts, isLoading = false }: WeeklyAttendanceProps) {
  const { attendanceVariant, attendanceSuccessThreshold } = useAppearance();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const { workoutsThisWeek } = getWeekData(workouts);
  const isSuccess = workoutsThisWeek >= attendanceSuccessThreshold;

  const toggleView = () => {
    setViewMode((prev) => (prev === "week" ? "month" : "week"));
  };

  if (isLoading) {
    return (
      <div className={cn(
        "h-36 rounded-[2rem] animate-pulse",
        attendanceVariant === 'circle' ? "h-40" : attendanceVariant === 'bar' ? "h-24" : "h-36",
        "bg-white/5"
      )} />
    );
  }

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={toggleView}
      className={cn(
        "w-full cursor-pointer active:scale-[0.98] transition-all duration-500 overflow-hidden border backdrop-blur-xl shadow-xl",
        attendanceVariant === "bar" ? "rounded-2xl p-4" : "rounded-[2rem] p-5",
        isSuccess
          ? "border-amber-500/30 bg-amber-950/10 shadow-amber-500/10"
          : "border-white/10 bg-zinc-900/50"
      )}
    >
      {/* Header (Stable Shell, Crossfading Content) */}
      <div className="flex items-center justify-between mb-4 relative h-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {viewMode === "week" ? (
            <motion.h3
              key={viewMode}
              initial={{ opacity: 0, y: 5, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(10px)" }}
              transition={{ duration: 0.5, }}
              className={cn(
                "text-xs font-bold uppercase tracking-widest pl-1 transition-colors duration-500",
                isSuccess ? "text-amber-500" : "text-zinc-400"
              )}
            >
              This Week
            </motion.h3>
          ) : (
            <motion.h3
              key={viewMode}
              initial={{ opacity: 0, y: 5, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(10px)" }}
              transition={{ duration: 0.5, }}
              className={cn(
                "text-xs font-bold uppercase tracking-widest pl-1 transition-colors duration-500",
                isSuccess ? "text-amber-500" : "text-zinc-400"
              )}
            >
              Last 4 Weeks
            </motion.h3>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full transition-colors duration-500",
              isSuccess
                ? "text-amber-300 bg-amber-500/20"
                : "text-emerald-500 bg-emerald-500/10"
            )}
          >
            {workoutsThisWeek} Workouts
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Content (Swappable with Animation) */}
      <div className="relative">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={viewMode + attendanceVariant}
            initial={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              opacity: { duration: 0.2 }
            }}
            className="w-full flex"
          >
            {viewMode === "month" ? (
              <MonthlyIndicators workouts={workouts} />
            ) : (
              renderIndicators(attendanceVariant, workouts, isSuccess)
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Special Success Glow for Bar variant */}
      {isSuccess && attendanceVariant === "bar" && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent blur-sm" />
      )}
    </motion.div>
  );
}

function renderIndicators(variant: string, workouts: Workout[], isSuccess: boolean) {
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
