import { describe, expect, it } from "vitest";
import { resolveWeeklyGoal } from "./goals";
import { computeWeeklyStreaks, type WeekCount } from "./streaks";

const weeks = (...entries: [string, number][]): WeekCount[] =>
  entries.map(([weekStart, workouts]) => ({ weekStart, workouts }));

const CURRENT = "2026-09-14";

describe("computeWeeklyStreaks", () => {
  it("counts consecutive weeks that met the goal", () => {
    const result = computeWeeklyStreaks(
      weeks(["2026-08-31", 3], ["2026-09-07", 4], ["2026-09-14", 3]),
      3,
      CURRENT,
    );
    expect(result).toEqual({ current: 3, longest: 3 });
  });

  it("does not break the streak while the current week is still short", () => {
    const result = computeWeeklyStreaks(
      weeks(["2026-08-31", 3], ["2026-09-07", 3], ["2026-09-14", 1]),
      3,
      CURRENT,
    );
    expect(result).toEqual({ current: 2, longest: 2 });
  });

  it("adds the in-progress week once it is met", () => {
    const result = computeWeeklyStreaks(weeks(["2026-09-07", 3], ["2026-09-14", 3]), 3, CURRENT);
    expect(result.current).toBe(2);
  });

  it("breaks on a missed week, including a week with no row", () => {
    const result = computeWeeklyStreaks(
      weeks(["2026-08-17", 3], ["2026-08-24", 3], ["2026-08-31", 3], ["2026-09-07", 2], ["2026-09-14", 3]),
      3,
      CURRENT,
    );
    expect(result).toEqual({ current: 1, longest: 3 });

    const gap = computeWeeklyStreaks(weeks(["2026-08-24", 3], ["2026-09-14", 3]), 3, CURRENT);
    expect(gap).toEqual({ current: 1, longest: 1 });
  });

  it("is zero when the last completed week was missed", () => {
    const result = computeWeeklyStreaks(weeks(["2026-08-24", 5], ["2026-08-31", 5]), 3, CURRENT);
    expect(result).toEqual({ current: 0, longest: 2 });
  });

  it("re-scores past weeks when the goal changes", () => {
    const history = weeks(["2026-08-31", 3], ["2026-09-07", 4], ["2026-09-14", 4]);
    expect(computeWeeklyStreaks(history, 3, CURRENT)).toEqual({ current: 3, longest: 3 });
    expect(computeWeeklyStreaks(history, 4, CURRENT)).toEqual({ current: 2, longest: 2 });
    expect(computeWeeklyStreaks(history, 5, CURRENT)).toEqual({ current: 0, longest: 0 });
  });

  it("handles no history and year boundaries", () => {
    expect(computeWeeklyStreaks([], 3, CURRENT)).toEqual({ current: 0, longest: 0 });
    const result = computeWeeklyStreaks(
      weeks(["2025-12-22", 3], ["2025-12-29", 3], ["2026-01-05", 3]),
      3,
      "2026-01-05",
    );
    expect(result.current).toBe(3);
  });
});

describe("resolveWeeklyGoal", () => {
  it("prefers a saved goal and otherwise follows the level", () => {
    expect(resolveWeeklyGoal(6, "beginner")).toBe(6);
    expect(resolveWeeklyGoal(null, "beginner")).toBe(3);
    expect(resolveWeeklyGoal(undefined, "intermediary")).toBe(3);
    expect(resolveWeeklyGoal(null, "advanced")).toBe(4);
    expect(resolveWeeklyGoal(null, "pro")).toBe(5);
    expect(resolveWeeklyGoal(null, undefined)).toBe(3);
  });
});
