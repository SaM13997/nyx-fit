import { createFileRoute } from "@tanstack/react-router";
import { useWorkoutSummary, useExerciseStats } from "@/lib/convex/hooks";
import {
  Dumbbell,
  Flame,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { PageShell, PageHero, ContentContainer, StateBlock } from "@/components/page-shell";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

const BODY_PART_COLORS: Record<string, string> = {
  chest: "#f97316",
  back: "#a855f7",
  shoulders: "#06b6d4",
  arms: "#ec4899",
  legs: "#10b981",
  core: "#f59e0b",
  cardio: "#ef4444",
};

function StatsPage() {
  const { summary, isLoading: summaryLoading } = useWorkoutSummary();
  const { stats: exerciseStats, isLoading: statsLoading } = useExerciseStats();

  const isLoading = summaryLoading || statsLoading;

  return (
    <PageShell>
      <PageHero
        title="Stats"
        description="Your fitness journey at a glance"
        accentColor="orange"
        height="medium"
      />

      <ContentContainer>
        {isLoading ? (
          <StateBlock variant="loading" />
        ) : summary ? (
          <>
            <div className="space-y-8">
              <div className="relative">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-bold text-white tracking-tight">
                    {summary.totalWorkouts}
                  </span>
                  <span className="text-zinc-500 font-medium">workouts</span>
                </div>
                <p className="text-zinc-500 text-sm">
                  {summary.currentStreak > 0 ? (
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {summary.currentStreak} day streak
                    </span>
                  ) : (
                    "Start a streak today!"
                  )}
                </p>
              </div>

              <div className="relative h-24 -mx-2">
                <AreaSparkline
                  data={getWeeklyData(summary)}
                  color="#f97316"
                  height={96}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <Metric label="Avg Duration" value={`${summary.averageDuration}m`} />
                <Metric label="Total Sets" value={summary.totalSets.toString()} />
                <Metric label="This Week" value={summary.workoutsThisWeek.toString()} />
              </div>
            </div>

            <div className="h-px bg-white/[0.06] my-8" />

            {exerciseStats.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-white">Volume Trend</h2>
                </div>

                <div className="relative h-40 -mx-2 mb-8">
                  <VolumeAreaChart stats={exerciseStats} />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Dumbbell className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-white">By Muscle Group</h2>
                </div>

                <div className="space-y-3">
                  {getBodyPartStats(exerciseStats)
                    .sort((a, b) => b.volume - a.volume)
                    .map((bp) => (
                      <BodyPartRow key={bp.name} name={bp.name} volume={bp.volume} color={bp.color} />
                    ))}
                </div>

                <div className="flex items-center gap-2 mt-10 mb-4">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-white">Top Exercises</h2>
                </div>

                <div className="space-y-4">
                  {exerciseStats
                    .sort((a, b) => b.totalSets - a.totalSets)
                    .slice(0, 8)
                    .map((stat, idx) => (
                      <ExerciseRow
                        key={stat.id}
                        rank={idx + 1}
                        name={stat.exerciseName}
                        sets={stat.totalSets}
                        maxWeight={stat.maxWeight}
                      />
                    ))}
                </div>
              </>
            )}
          </>
        ) : (
          <StateBlock
            variant="empty"
            icon={<Dumbbell className="w-12 h-12" />}
            title="No workout data yet"
            message="Complete your first workout to see stats"
          />
        )}
      </ContentContainer>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function BodyPartRow({ name, volume, color }: { name: string; volume: number; color: string }) {
  const maxVolume = 50000;
  const width = Math.min((volume / maxVolume) * 100, 100);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-300 capitalize">{name}</span>
        <span className="text-xs text-zinc-500">{(volume / 1000).toFixed(1)}K vol</span>
      </div>
      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}40, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

function ExerciseRow({ rank, name, sets, maxWeight }: { rank: number; name: string; sets: number; maxWeight: number }) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-white/[0.04] last:border-0">
      <span className={cn(
        "text-lg font-bold w-6",
        rank <= 3 ? "text-amber-400" : "text-zinc-600"
      )}>
        #{rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">{name}</div>
        <div className="text-xs text-zinc-500">
          {sets} sets · {maxWeight} lbs max
        </div>
      </div>
    </div>
  );
}

function AreaSparkline({ data, color, height }: { data: number[]; color: string; height: number }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} 100,${height}`;

  return (
    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        fill="url(#areaGradient)"
        points={areaPoints}
      />
    </svg>
  );
}

function VolumeAreaChart({ stats }: { stats: any[] }) {
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
  const last12Weeks = weeks.slice(-12);

  if (last12Weeks.length < 2) return null;

  const volumes = last12Weeks.map(w => w.totalVolume);

  return <AreaSparkline data={volumes} color="#f97316" height={160} />;
}

function getWeeklyData(summary: any): number[] {
  return [
    Math.max(0, summary.workoutsThisWeek * 45),
    Math.max(0, summary.workoutsThisMonth / 4 * 45),
    summary.totalSets,
  ];
}

function getBodyPartStats(stats: any[]): { name: string; volume: number; sets: number; color: string }[] {
  const bodyPartMap = new Map<string, { volume: number; sets: number }>();

  for (const stat of stats) {
    const category = getBodyPartCategory(stat.exerciseName);
    const current = bodyPartMap.get(category) || { volume: 0, sets: 0 };
    bodyPartMap.set(category, {
      volume: current.volume + stat.totalVolume,
      sets: current.sets + stat.totalSets,
    });
  }

  return Array.from(bodyPartMap.entries()).map(([name, data]) => ({
    name,
    volume: data.volume,
    sets: data.sets,
    color: BODY_PART_COLORS[name] || "#6b7280",
  }));
}

function getBodyPartCategory(exerciseName: string): string {
  const name = exerciseName.toLowerCase();
  
  if (name.includes("bench") || name.includes("chest") || name.includes("push") || name.includes("fly")) return "chest";
  if (name.includes("row") || name.includes("pull") || name.includes("lat") || name.includes("back") || name.includes("deadlift")) return "back";
  if (name.includes("shoulder") || name.includes("press") || name.includes("raise") || name.includes("arnold")) return "shoulders";
  if (name.includes("curl") || name.includes("tricep") || name.includes("bicep") || name.includes("arm")) return "arms";
  if (name.includes("squat") || name.includes("leg") || name.includes("lunge") || name.includes("calf") || name.includes("thrust")) return "legs";
  if (name.includes("plank") || name.includes("crunch") || name.includes("core") || name.includes("ab")) return "core";
  if (name.includes("cardio") || name.includes("run") || name.includes("cycle") || name.includes("row")) return "cardio";
  
  return "other";
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
