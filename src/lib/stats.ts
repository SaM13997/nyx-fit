import { BODY_PARTS } from "@/lib/constants";
import type { BodyPartFrequencyEntry, BodyPartRecency, ExerciseRecord } from "@/lib/types";

export type PersonalRecord = {
  exerciseName: string;
  maxWeight: number;
  maxWeightReps: number;
  lastPerformedAt: string;
};

export function topPersonalRecords(
  stats: ExerciseRecord[],
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

type BodyPartWorkout = {
  date: string;
  isActive?: boolean;
  bodyPartWorkedOut?: string[];
};

export function bodyPartFrequency(
  workouts: readonly BodyPartWorkout[],
  now: Date,
  weeks = 8,
): BodyPartFrequencyEntry[] {
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

// Primary body parts ("legs:Quads" counts for "legs"), least recently
// trained first. Parts absent from the given completed workouts come first
// with lastWorkedAt null ("8w+"), in the order BODY_PARTS lists them.
export function leastRecentBodyParts(
  workouts: readonly BodyPartWorkout[],
): BodyPartRecency[] {
  const lastWorked = new Map<string, string>();
  for (const workout of workouts) {
    if (workout.isActive === true) continue;
    for (const part of workout.bodyPartWorkedOut ?? []) {
      const id = part.split(":")[0];
      const seen = lastWorked.get(id);
      if (seen === undefined || workout.date > seen) lastWorked.set(id, workout.date);
    }
  }

  return BODY_PARTS.map((part, order) => ({
    bodyPart: part.id,
    lastWorkedAt: lastWorked.get(part.id) ?? null,
    order,
  }))
    .sort((a, b) => {
      if (a.lastWorkedAt === b.lastWorkedAt) return a.order - b.order;
      if (a.lastWorkedAt === null) return -1;
      if (b.lastWorkedAt === null) return 1;
      return a.lastWorkedAt.localeCompare(b.lastWorkedAt);
    })
    .map(({ bodyPart, lastWorkedAt }) => ({ bodyPart, lastWorkedAt }));
}
