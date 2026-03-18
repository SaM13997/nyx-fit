import { createFileRoute } from "@tanstack/react-router";
import { useWorkoutSummary, useExerciseStats } from "@/lib/convex/hooks";
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
  const { summary, isLoading: summaryLoading } = useWorkoutSummary();
  const { stats: exerciseStats, isLoading: statsLoading } = useExerciseStats();

  const isLoading = summaryLoading || statsLoading;

  return (
    <div className="bg-black text-white font-sans min-h-screen pb-20">
      <div className="relative h-[30vh] pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animated-hex-bg opacity-50"
          style={{ "--c": "#f97316" } as any}
        />
        <div className="absolute inset-0 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black h-10 to-transparent" />

        <div className="relative flex flex-col justify-end h-full px-4 pt-12">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-5xl font-bold tracking-tighter text-orange-500">
              Stats
            </h1>
          </div>
        </div>
      </div>

      <div className="relative px-4">
        <div className="mx-auto max-w-md space-y-6">
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
              <p className="text-zinc-500 mt-2">Loading stats...</p>
            </div>
          ) : summary ? (
            <>
              <div className="space-y-3">
                <p className="text-sm text-zinc-400 font-medium px-1">
                  Your fitness journey at a glance
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={<Dumbbell className="w-5 h-5" />}
                    label="Total Workouts"
                    value={summary.totalWorkouts}
                    color="orange"
                  />
                  <StatCard
                    icon={<Clock className="w-5 h-5" />}
                    label="Avg Duration"
                    value={`${summary.averageDuration}m`}
                    color="rose"
                  />
                  <StatCard
                    icon={<Target className="w-5 h-5" />}
                    label="Total Sets"
                    value={summary.totalSets}
                    color="emerald"
                  />
                  <StatCard
                    icon={<Activity className="w-5 h-5" />}
                    label="Total Exercises"
                    value={summary.totalExercises}
                    color="blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={<Flame className="w-5 h-5" />}
                    label="Current Streak"
                    value={`${summary.currentStreak} days`}
                    color="orange"
                    highlighted
                  />
                  <StatCard
                    icon={<Trophy className="w-5 h-5" />}
                    label="Longest Streak"
                    value={`${summary.longestStreak} days`}
                    color="amber"
                    highlighted
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={<Calendar className="w-5 h-5" />}
                    label="This Week"
                    value={summary.workoutsThisWeek}
                    color="purple"
                  />
                  <StatCard
                    icon={<Calendar className="w-5 h-5" />}
                    label="This Month"
                    value={summary.workoutsThisMonth}
                    color="cyan"
                  />
                </div>
              </div>

              <div className="pt-4">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Exercise Records
                </h2>

                {exerciseStats.length > 0 ? (
                  <div className="space-y-3">
                    {exerciseStats
                      .sort((a, b) => b.totalSets - a.totalSets)
                      .slice(0, 10)
                      .map((stat) => (
                        <ExerciseStatCard
                          key={stat.id}
                          name={stat.exerciseName}
                          totalSets={stat.totalSets}
                          maxWeight={stat.maxWeight}
                          totalVolume={stat.totalVolume}
                          lastPerformed={stat.lastPerformedAt}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 text-center">
                    <p className="text-zinc-500">No exercise data yet</p>
                    <p className="text-zinc-600 text-sm mt-1">
                      Complete workouts to see your stats
                    </p>
                  </div>
                )}
              </div>

              {exerciseStats.length > 0 && (
                <div className="pt-4">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Weekly Volume Trend
                  </h2>
                  <WeeklyVolumeChart stats={exerciseStats} />
                </div>
              )}
            </>
          ) : (
            <div className="p-8 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 text-center">
              <Dumbbell className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 font-medium">No workout data yet</p>
              <p className="text-zinc-500 text-sm mt-1">
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
  color,
  highlighted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "orange" | "rose" | "emerald" | "blue" | "purple" | "cyan" | "amber";
  highlighted?: boolean;
}) {
  const colors = {
    orange: "from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400",
    rose: "from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
  };

  const colorValue = colors[color];

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
        <div className="text-2xl font-bold">{value}</div>
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
}: {
  name: string;
  totalSets: number;
  maxWeight: number;
  totalVolume: number;
  lastPerformed: string;
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
    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-white truncate pr-4">{name}</h3>
        <span className="text-xs text-zinc-500">{formatDate(lastPerformed)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <div className="text-lg font-bold text-orange-400">{totalSets}</div>
          <div className="text-[10px] uppercase text-zinc-500">Sets</div>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <div className="text-lg font-bold text-emerald-400">{maxWeight}</div>
          <div className="text-[10px] uppercase text-zinc-500">Max lbs</div>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-2">
          <div className="text-lg font-bold text-blue-400">{formatVolume(totalVolume)}</div>
          <div className="text-[10px] uppercase text-zinc-500">Volume</div>
        </div>
      </div>
    </div>
  );
}

function WeeklyVolumeChart({ stats }: { stats: any[] }) {
  const weeks: { weekStart: string; totalVolume: number }[] = [];
  const weekMap = new Map<string, number>();

  for (const stat of stats) {
    for (const week of stat.weeklyHistory || []) {
      const current = weekMap.get(week.weekStart) || 0;
      weekMap.set(week.weekStart, current + week.volume);
    }
  }

  weekMap.forEach((volume, weekStart) => {
    weeks.push({ weekStart, totalVolume: volume });
  });

  weeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  const last8Weeks = weeks.slice(-8);

  if (last8Weeks.length === 0) {
    return null;
  }

  const maxVolume = Math.max(...last8Weeks.map((w) => w.totalVolume));

  const formatWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
      <div className="flex items-end gap-1 h-32">
        {last8Weeks.map((week, i) => {
          const height = maxVolume > 0 ? (week.totalVolume / maxVolume) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-gradient-to-t from-orange-600 to-orange-500 rounded-t-sm relative group"
                style={{ height: `${height}%`, minHeight: "4px" }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {(week.totalVolume / 1000).toFixed(1)}K
                </div>
              </div>
              <span className="text-[8px] text-zinc-600 truncate w-full text-center">
                {formatWeek(week.weekStart)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
