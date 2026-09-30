import { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";
import { BackButton } from "@/components/BackButton";
import { createFileRoute } from "@tanstack/react-router";
import { useStatsOverview, useCurrentProfile } from "@/lib/api/hooks";
import { formatExerciseCategory } from "@/lib/exerciseCategories";
import { topPersonalRecords } from "@/lib/stats";
import type { WeeklyStat, WeightUnit } from "@/lib/types";
import { convertWeightFromLbs, formatWeight, formatWeightUnit } from "@/lib/units";
import { formatCountLabel } from "@/lib/utils";
import {
  Dumbbell,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Trophy,
  Activity,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

function StatsPage() {
  const {
    overview,
    isLoading,
    isError,
    refetch,
  } = useStatsOverview();
  const { profile } = useCurrentProfile();
  const unit = profile?.weightUnit ?? "lbs";

  const exerciseStats = overview?.exercises ?? [];
  const records = topPersonalRecords(exerciseStats);
  const frequency = overview?.bodyPartFrequency ?? [];

  return (
    <div className="relative bg-background text-foreground font-sans min-h-dvh pb-32 overflow-x-clip">
      <BackButton
        fallback="/"
        className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-20"
      />
      <div className="relative h-[35vh] pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animated-hex-bg opacity-50"
          style={{ "--c": "var(--color-series-accent)" } as React.CSSProperties}
        />
        <div className="absolute inset-0 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background h-10 to-transparent" />

        <div className="relative flex flex-col justify-end h-full px-4 pt-12">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-6xl font-bold tracking-tighter text-orange-700 dark:text-orange-500">
              Stats
            </h1>
          </div>
        </div>
      </div>

      <div className="relative px-4">
        <div className="mx-auto max-w-md space-y-6">
          <div className="px-1">
            <p className="text-sm text-muted-foreground font-medium">
              Your fitness journey at a glance
            </p>
          </div>

          {isError && !overview ? (
            <div className="p-8 rounded-3xl bg-red-500/10 dark:bg-red-500/5 border border-red-600/20 dark:border-red-500/20 text-center">
              <p className="text-red-700 dark:text-red-200 font-medium">
                Couldn&apos;t load your stats.
              </p>
              <p className="text-red-700/70 dark:text-red-200/70 text-sm mt-1">
                Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 min-h-11 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
              >
                Try again
              </button>
            </div>
          ) : isLoading && !overview ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-700 dark:text-orange-500" />
              <p className="text-ink-subtle mt-2">Loading stats...</p>
            </div>
          ) : overview ? (
            <>
              {isError ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-600/20 dark:border-red-500/20 bg-red-500/10 px-4 py-2">
                  <p className="text-sm text-red-700 dark:text-red-200">
                    Connection issue. Showing saved stats.
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="min-h-11 shrink-0 rounded-xl border border-red-600/30 dark:border-red-500/30 px-4 text-sm font-semibold text-red-700 dark:text-red-100 transition-colors hover:bg-red-500/10"
                  >
                    Try again
                  </button>
                </div>
              ) : null}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={<Dumbbell className="w-5 h-5" />}
                    label="Total Workouts"
                    value={overview.totalWorkouts}
                    color="orange"
                  />
                  <StatCard
                    icon={<Clock className="w-5 h-5" />}
                    label="Avg Duration"
                    value={Math.round(overview.averageDuration / 60)}
                    suffix="m"
                    color="rose"
                  />
                  <StatCard
                    icon={<Target className="w-5 h-5" />}
                    label="Total Sets"
                    value={overview.totalSets}
                    color="emerald"
                  />
                  <StatCard
                    icon={<Activity className="w-5 h-5" />}
                    label="Total Exercises"
                    value={overview.totalExercises}
                    color="blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={<Flame className="w-5 h-5" />}
                    label="Weekly Streak"
                    value={overview.streak.current}
                    suffix={overview.streak.current === 1 ? " wk" : " wks"}
                    color="orange"
                    highlighted
                  />
                  <StatCard
                    icon={<Trophy className="w-5 h-5" />}
                    label="Best Streak"
                    value={overview.streak.longest}
                    suffix={overview.streak.longest === 1 ? " wk" : " wks"}
                    color="amber"
                    highlighted
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={<Calendar className="w-5 h-5" />}
                    label="This Week"
                    value={overview.workoutsThisWeek}
                    color="purple"
                  />
                  <StatCard
                    icon={<Calendar className="w-5 h-5" />}
                    label="This Month"
                    value={overview.workoutsThisMonth}
                    color="cyan"
                  />
                </div>
              </div>

              <div className="pt-4">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-700 dark:text-orange-500" />
                  Exercise Records
                </h2>

                {exerciseStats.length > 0 ? (
                  <div className="space-y-3">
                    {[...exerciseStats]
                      .sort((a, b) => b.totalSets - a.totalSets)
                      .slice(0, 10)
                      .map((stat) => (
                        <ExerciseStatCard
                          key={stat.exerciseKey}
                          name={stat.exerciseName}
                          totalSets={stat.totalSets}
                          maxWeight={stat.maxWeight}
                          totalVolume={stat.totalVolume}
                          lastPerformed={stat.lastPerformedAt}
                          unit={unit}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-card border border-border text-center">
                    <p className="text-ink-subtle">No exercise data yet</p>
                    <p className="text-ink-subtle text-sm mt-1">
                      Complete workouts to see your stats
                    </p>
                  </div>
                )}
              </div>

              {records.length > 0 ? (
                <div className="pt-4">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-700 dark:text-orange-500" />
                    Personal Records
                  </h2>
                  <div className="space-y-3">
                    {records.map((record) => (
                      <div
                        key={record.exerciseName}
                        className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-3"
                      >
                        <span className="font-bold text-foreground truncate">{record.exerciseName}</span>
                        <span className="text-sm font-semibold text-orange-700 dark:text-orange-400 whitespace-nowrap">
                          {formatWeight(record.maxWeight, unit)} {formatWeightUnit(unit)} × {record.maxWeightReps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {frequency.length > 0 ? (
                <div className="pt-4">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-700 dark:text-orange-500" />
                    Training Frequency
                  </h2>
                  <div className="space-y-3">
                    {frequency.map((entry) => (
                      <div
                        key={entry.bodyPart}
                        className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-3"
                      >
                        <span className="font-bold text-foreground">{formatExerciseCategory(entry.bodyPart)}</span>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatCountLabel(entry.sessions, "session")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {overview.weeklyStats.length > 0 && (
                <div className="pt-4">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    Weekly Volume Trend
                  </h2>
                  <WeeklyVolumeChart weeks={overview.weeklyStats} />
                </div>
              )}
            </>
          ) : (
            <div className="p-8 rounded-3xl bg-card border border-border text-center">
              <Dumbbell className="w-12 h-12 text-ink-subtle mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No workout data yet</p>
              <p className="text-ink-subtle text-sm mt-1">
                Complete your first workout to see stats
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
  highlighted,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: "orange" | "rose" | "emerald" | "blue" | "purple" | "cyan" | "amber";
  highlighted?: boolean;
}) {
  const colors = {
    orange: "from-orange-500/20 to-orange-600/10 border-orange-600/30 text-orange-700 dark:border-orange-500/30 dark:text-orange-400",
    rose: "from-rose-500/20 to-rose-600/10 border-rose-600/30 text-rose-700 dark:border-rose-500/30 dark:text-rose-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-600/30 text-success-ink dark:border-emerald-500/30",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-600/30 text-info-ink dark:border-blue-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-600/30 text-purple-700 dark:border-purple-500/30 dark:text-purple-400",
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-600/30 text-cyan-700 dark:border-cyan-500/30 dark:text-cyan-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-600/30 text-amber-800 dark:border-amber-500/30 dark:text-amber-400",
  };

  const colorValue = colors[color];
  // Starts at zero so the figure counts up once the screen is on stage.
  const [shownValue, setShownValue] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setShownValue(value), 120);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <div
      className={`p-4 rounded-2xl bg-linear-to-br ${colorValue} ${
        highlighted ? "border-2" : "border"
      } backdrop-blur-xs relative overflow-hidden`}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1 opacity-80">
          {icon}
          <span className="text-xs uppercase tracking-wider font-bold">{label}</span>
        </div>
        <div className="text-2xl font-bold tabular-nums">
          <NumberFlow value={shownValue} suffix={suffix} aria-label={`${value}${suffix ?? ""}`} />
        </div>
      </div>
    </div>
  );
}

function ExerciseStatCard({
  name,
  totalSets,
  maxWeight,
  totalVolume,
  lastPerformed,
  unit,
}: {
  name: string;
  totalSets: number;
  maxWeight: number;
  totalVolume: number;
  lastPerformed: string;
  unit: WeightUnit;
}) {
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-foreground truncate pr-4">{name}</h3>
        <span className="text-xs text-ink-subtle">{formatDate(lastPerformed)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-fill rounded-xl p-2">
          <div className="text-lg font-bold text-orange-700 dark:text-orange-400">{totalSets}</div>
          <div className="text-[10px] uppercase text-ink-subtle">Sets</div>
        </div>
        <div className="bg-fill rounded-xl p-2">
          <div className="text-lg font-bold text-success-ink">{formatWeight(maxWeight, unit, 0)}</div>
          <div className="text-[10px] uppercase text-ink-subtle">Max {formatWeightUnit(unit)}</div>
        </div>
        <div className="bg-fill rounded-xl p-2">
          <div className="text-lg font-bold text-info-ink">{formatVolume(convertWeightFromLbs(totalVolume, unit))}</div>
          <div className="text-[10px] uppercase text-ink-subtle">Volume</div>
        </div>
      </div>
    </div>
  );
}

function WeeklyVolumeChart({ weeks }: { weeks: WeeklyStat[] }) {
  const volumes = weeks.map((week) => ({
    weekStart: week.weekStart,
    totalVolume: week.volume,
  }));

  const last8Weeks = volumes.slice(-8);

  if (last8Weeks.length === 0) {
    return null;
  }

  const maxVolume = Math.max(...last8Weeks.map((w) => w.totalVolume));

  const formatWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="p-4 rounded-2xl bg-card border border-border">
      <div className="flex items-end gap-1 h-32">
        {last8Weeks.map((week, i) => {
          const height = maxVolume > 0 ? (week.totalVolume / maxVolume) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              role="img"
              aria-label={`Week of ${formatWeek(week.weekStart)}: ${(week.totalVolume / 1000).toFixed(1)}K volume`}
            >
              <div
                className="w-full bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-sm relative group"
                style={{ height: `${height}%`, minHeight: "4px" }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-muted text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {(week.totalVolume / 1000).toFixed(1)}K
                </div>
              </div>
              <span className="text-[8px] text-ink-subtle truncate w-full text-center">
                {formatWeek(week.weekStart)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
