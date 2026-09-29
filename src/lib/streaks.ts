import { addDaysToKey } from "@/lib/weeks";

export type WeekCount = { weekStart: string; workouts: number };

export type WeeklyStreak = { current: number; longest: number };

// Weekly-goal streaks over local Monday-keyed weeks.
//  - A week counts when its workouts reach the goal.
//  - The in-progress week extends the streak once it is met, but never
//    breaks it while it is still short.
//  - Weeks without a row count as zero workouts.
// The goal applies retroactively: changing it re-scores past weeks.
export const computeWeeklyStreaks = (
  weeks: readonly WeekCount[],
  goal: number,
  currentWeekStart: string,
): WeeklyStreak => {
  const met = new Set<string>();
  for (const week of weeks) {
    if (week.workouts >= goal) met.add(week.weekStart);
  }

  let current = 0;
  let cursor = met.has(currentWeekStart) ? currentWeekStart : addDaysToKey(currentWeekStart, -7);
  while (met.has(cursor)) {
    current += 1;
    cursor = addDaysToKey(cursor, -7);
  }

  let longest = 0;
  for (const weekStart of met) {
    // Only count from the first week of each run.
    if (met.has(addDaysToKey(weekStart, -7))) continue;
    let length = 0;
    let next = weekStart;
    while (met.has(next)) {
      length += 1;
      next = addDaysToKey(next, 7);
    }
    longest = Math.max(longest, length);
  }

  return { current, longest: Math.max(longest, current) };
};
