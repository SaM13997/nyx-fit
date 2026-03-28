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
  Zap,
} from "lucide-react";
import { PageShell, PageHero, ContentContainer, StateBlock } from "@/components/page-shell";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

const BODY_PART_COLORS: Record<string, string> = {
  chest: "#f97316", // orange
  back: "#a855f7", // purple
  shoulders: "#06b6d4", // cyan
  arms: "#ec4899", // pink
  legs: "#10b981", // emerald
  core: "#f59e0b", // amber
  cardio: "#ef4444", // red
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
          <div className="space-y-6 pb-8">
            {/* Hero Stats (Bento Top) */}
            <div className="grid grid-cols-2 gap-3">
              <HeroStatCard
                icon={<Dumbbell className="w-5 h-5" />}
                label="Total Workouts"
                value={summary.totalWorkouts}
                accent="orange"
              />
              <HeroStatCard
                icon={<Flame className="w-5 h-5" />}
                label="Current Streak"
                value={`${summary.currentStreak} days`}
                accent="amber"
              />
            </div>

            {/* Secondary Stats (Bento Middle) */}
            <div className="grid grid-cols-2 gap-3">
              <MiniStatCard
                icon={<Clock className="w-4 h-4 text-rose-500" />}
                label="Avg Duration"
                value={`${Math.ceil(summary.averageDuration / 60000)}m`}
              />
              <MiniStatCard
                icon={<Target className="w-4 h-4 text-emerald-500" />}
                label="Total Sets"
                value={summary.totalSets}
              />
              <MiniStatCard
                icon={<Calendar className="w-4 h-4 text-purple-500" />}
                label="This Week"
                value={summary.workoutsThisWeek}
              />
              <MiniStatCard
                icon={<Calendar className="w-4 h-4 text-cyan-500" />}
                label="This Month"
                value={summary.workoutsThisMonth}
              />
            </div>

            {/* Charts & Deep Dives */}
            {exerciseStats.length > 0 && (
              <>
                <div className="pt-2">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-3 px-1">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    Volume Trend
                  </h2>
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 relative">
                    <div className="h-40 -mx-2 -mb-2">
                      <VolumeAreaChart stats={exerciseStats} />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-3 px-1">
                    <Activity className="w-5 h-5 text-orange-500" />
                    By Muscle Group
                  </h2>
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
                    {getBodyPartStats(exerciseStats)
                      .sort((a, b) => b.volume - a.volume)
                      .map((bp) => (
                        <BodyPartRow key={bp.name} name={bp.name} volume={bp.volume} color={bp.color} />
                      ))}
                  </div>
                </div>

                <div className="pt-2">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-3 px-1">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Top Exercises
                  </h2>
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
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
                </div>
              </>
            )}
          </div>
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

// Subcomponents

function HeroStatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: "orange" | "amber";
}) {
  const isOrange = accent === "orange";
  return (
    <div className={`p-5 rounded-2xl border relative overflow-hidden bg-zinc-900 ${isOrange ? "border-orange-500/20" : "border-amber-500/20"}`}>
      {/* Subtle background glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 rounded-full -mr-10 -mt-10 pointer-events-none ${isOrange ? "bg-orange-500" : "bg-amber-500"}`} />
      
      <div className="relative z-10 flex flex-col">
        <div className={`flex items-center gap-2 mb-3 ${isOrange ? "text-orange-500" : "text-amber-500"}`}>
          {icon}
          <span className="text-xs uppercase tracking-wider font-bold opacity-80">{label}</span>
        </div>
        <div className="text-4xl font-bold text-white tracking-tight">{value}</div>
      </div>
    </div>
  );
}

function MiniStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function BodyPartRow({ name, volume, color }: { name: string; volume: number; color: string }) {
  const maxVolume = 50000;
  const width = Math.min((volume / maxVolume) * 100, 100);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-zinc-200 capitalize">{name}</span>
        <span className="text-xs font-medium text-zinc-500">{(volume / 1000).toFixed(1)}K vol</span>
      </div>
      <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}40, ${color})`,
            boxShadow: `0 0 10px ${color}40`
          }}
        />
      </div>
    </div>
  );
}

function ExerciseRow({ rank, name, sets, maxWeight }: { rank: number; name: string; sets: number; maxWeight: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-zinc-950 border",
        rank <= 3 ? "text-amber-400 border-amber-500/30" : "text-zinc-500 border-zinc-800"
      )}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">{name}</div>
        <div className="text-xs text-zinc-500 mt-0.5">
          {sets} sets · {maxWeight} lbs max
        </div>
      </div>
    </div>
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

  // If there's barely any data, return a placeholder text
  if (last12Weeks.length < 2) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-sm">
        <Zap className="w-8 h-8 text-zinc-700 mb-2 opacity-50" />
        Log more weeks to see your volume trend
      </div>
    );
  }

  const volumes = last12Weeks.map(w => w.totalVolume);

  return <AreaSparkline data={volumes} color="#f97316" height={160} />;
}

function AreaSparkline({ data, color, height }: { data: number[]; color: string; height: number }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  // Add a little padding to the range so lines don't clip the very top/bottom
  const range = (max - min) * 1.2 || 1; 

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - (((value - min) + (range * 0.1)) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} 100,${height}`;

  return (
    <svg className="w-full h-full drop-shadow-md" preserveAspectRatio="none" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-90"
      />
      <polygon
        fill="url(#areaGradient)"
        points={areaPoints}
      />
    </svg>
  );
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
