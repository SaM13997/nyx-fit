import type { FitnessLevel } from "@/lib/types";

export const MIN_WEEKLY_GOAL = 1;
export const MAX_WEEKLY_GOAL = 7;

const DEFAULT_WEEKLY_GOALS: Record<FitnessLevel, number> = {
  beginner: 3,
  intermediary: 3,
  advanced: 4,
  pro: 5,
};

const FALLBACK_WEEKLY_GOAL = 3;

// A saved goal wins; otherwise the default follows the lifter's level.
export const resolveWeeklyGoal = (
  goal: number | null | undefined,
  level: FitnessLevel | null | undefined,
): number => {
  if (goal !== null && goal !== undefined) return goal;
  return level === null || level === undefined ? FALLBACK_WEEKLY_GOAL : DEFAULT_WEEKLY_GOALS[level];
};
