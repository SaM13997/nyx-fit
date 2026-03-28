const fs = require('fs');

const oldContent = fs.readFileSync('src/routes/stats.tsx', 'utf8');

const newContent = `import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { PageShell, PageHero, ContentContainer, SectionBlock, StateBlock } from "@/components/page-shell";

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
            <SectionBlock>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard
                  icon={<Dumbbell className="w-5 h-5" />}
                  label="Total Workouts"
                  value={summary.totalWorkouts}
                  color="orange"
                />
                <StatCard
                  icon={<Flame className="w-5 h-5" />}
                  label="Current Streak"
                  value={\`\${summary.currentStreak} days\`}
                  color="amber"
                  highlighted
                />
              </div>

              <div className="relative h-24 mb-4 -mx-2 opacity-80">
                <AreaSparkline
                  data={getWeeklyData(summary)}
                  color="#f97316"
                  height={96}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard
                  icon={<Clock className="w-5 h-5" />}
                  label="Avg Duration"
                  value={\`\${summary.averageDuration}m\`}
                  color="rose"
                />
                <StatCard
                  icon={<Target className="w-5 h-5" />}
                  label="Total Sets"
                  value={summary.totalSets}
                  color="emerald"
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
            </SectionBlock>

            {exerciseStats.length > 0 && (
              <>
                <SectionBlock title={<><TrendingUp className="w-5 h-5 text-orange-500" />Volume Trend</>}>
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 relative h-40">
                    <VolumeAreaChart stats={exerciseStats} />
                  </div>
                </SectionBlock>

                <SectionBlock title={<><Activity className="w-5 h-5 text-orange-500" />By Muscle Group</>}>
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
                    {getBodyPartStats(exerciseStats)
                      .sort((a, b) => b.volume - a.volume)
                      .map((bp) => (
                        <BodyPartRow key={bp.name} name={bp.name} volume={bp.volume} color={bp.color} />
                      ))}
                  </div>
                </SectionBlock>

                <SectionBlock title={<><Trophy className="w-5 h-5 text-amber-500" />Top Exercises</>}>
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 divide-y divide-white/[0.04]">
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
                </SectionBlock>
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
      className={\`p-4 rounded-2xl bg-linear-to-br \${colorValue} \${
        highlighted ? "border-2" : "border"
      } backdrop-blur-xs relative overflow-hidden\`}
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
            width: \`\${width}%\`,
            background: \`linear-gradient(90deg, \${color}40, \${color})\`,
          }}
        />
      </div>
    </div>
  );
}

function ExerciseRow({ rank, name, sets, maxWeight }: { rank: number; name: string; sets: number; maxWeight: number }) {
  return (
    <div className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
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

function AreaSparkline({ data, c
