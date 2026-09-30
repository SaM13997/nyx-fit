import { Link } from "@tanstack/react-router";
import type { WorkoutListItem } from "@/lib/types";
import { WorkoutCard } from "@/components/WorkoutCard";

interface RecentWorkoutsListProps {
  workouts: WorkoutListItem[];
  isLoading: boolean;
}

export function RecentWorkoutsList({
  workouts,
  isLoading,
}: RecentWorkoutsListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Workouts</h2>
        <Link to="/workouts" className="text-purple-700 dark:text-purple-400 text-sm">
          View All
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-fill rounded-2xl p-4 animate-pulse"
            >
              <div className="h-4 bg-fill-strong rounded mb-2"></div>
              <div className="h-3 bg-fill-strong rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="bg-fill rounded-2xl p-6 text-center">
          <p className="text-muted-foreground mb-2">No workouts yet</p>
          <p className="text-ink-subtle text-sm">
            Start your first workout above!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout, index) => (
            <WorkoutCard key={workout.id} workout={workout} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

