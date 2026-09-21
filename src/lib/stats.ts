import type { ExerciseStat, Workout } from "@/lib/types";

export type PersonalRecord = {
  exerciseName: string;
  maxWeight: number;
  maxWeightReps: number;
  lastPerformedAt: string;
};

export function topPersonalRecords(
  stats: ExerciseStat[],
  limit = 5,
): PersonalRecord[] {
  return [...stats]
    .filter((stat) => stat.maxWeight > 0)
    .sort(
      (a, b) =>
        b.maxWeight - a.maxWeight ||
        a.exerciseName.localeCompare(b.exerciseName),
    )
    .slice(0, limit)
    .map((stat) => ({
      exerciseName: stat.exerciseName,
      maxWeight: stat.maxWeight,
      maxWeightReps: stat.maxWeightReps,
      lastPerformedAt: stat.lastPerformedAt,
    }));
}

export type BodyPartFrequency = {
  bodyPart: string;
  sessions: number;
};

export function bodyPartFrequency(
  workouts: Workout[],
  now: Date,
  weeks = 8,
): BodyPartFrequency[] {
  const windowStart = now.getTime() - weeks * 7 * 86_400_000;
  const counts = new Map<string, number>();

  for (const workout of workouts) {
    if (workout.isActive === true) continue;
    const time = new Date(workout.date).getTime();
    if (time < windowStart || time > now.getTime()) continue;
    for (const bodyPart of workout.bodyPartWorkedOut ?? []) {
      counts.set(bodyPart, (counts.get(bodyPart) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([bodyPart, sessions]) => ({ bodyPart, sessions }))
    .sort(
      (a, b) =>
        b.sessions - a.sessions || a.bodyPart.localeCompare(b.bodyPart),
    );
}
