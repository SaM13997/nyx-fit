import { authComponent } from "./auth";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

type ExerciseStatDoc = Doc<"exerciseStats">;
type WorkoutDoc = Doc<"workouts">;

// Helper to get the Monday of the current week as ISO string
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

// Helper to map doc to frontend type
function mapExerciseStat(doc: ExerciseStatDoc) {
  const { _id, _creationTime, ...rest } = doc;
  return {
    id: _id,
    ...rest,
  };
}

/**
 * Get all exercise stats for the current user
 */
export const getExerciseStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const stats = await ctx.db
      .query("exerciseStats")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect();

    return stats.map(mapExerciseStat);
  },
});

/**
 * Get stats for a specific exercise
 */
export const getExerciseStatByName = query({
  args: { exerciseName: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const stat = await ctx.db
      .query("exerciseStats")
      .withIndex("byUserExercise", (q) =>
        q.eq("userId", user._id).eq("exerciseName", args.exerciseName)
      )
      .first();

    return stat ? mapExerciseStat(stat) : null;
  },
});

/**
 * Get workout summary stats for the current user
 */
export const getWorkoutSummary = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const workouts = await ctx.db
      .query("workouts")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), false)) // Only completed workouts
      .collect();

    if (workouts.length === 0) {
      return {
        totalWorkouts: 0,
        averageDuration: 0,
        totalExercises: 0,
        totalSets: 0,
        currentStreak: 0,
        longestStreak: 0,
        workoutsThisWeek: 0,
        workoutsThisMonth: 0,
      };
    }

    // Calculate total exercises and sets
    let totalExercises = 0;
    let totalSets = 0;
    for (const workout of workouts) {
      totalExercises += workout.exercises.length;
      for (const exercise of workout.exercises) {
        totalSets += exercise.sets.length;
      }
    }

    // Calculate average duration
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const averageDuration = Math.round(totalDuration / workouts.length);

    // Calculate workout streaks (days with workouts)
    const workoutDates = new Set(
      workouts.map((w) => w.date.split("T")[0])
    );
    const sortedDates = Array.from(workoutDates).sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Check if today or yesterday had a workout (for current streak)
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const hasRecentWorkout = workoutDates.has(today) || workoutDates.has(yesterday);

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / 86400000
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Current streak: count backwards from most recent
    if (hasRecentWorkout && sortedDates.length > 0) {
      currentStreak = 1;
      for (let i = sortedDates.length - 1; i > 0; i--) {
        const currDate = new Date(sortedDates[i]);
        const prevDate = new Date(sortedDates[i - 1]);
        const diffDays = Math.round(
          (currDate.getTime() - prevDate.getTime()) / 86400000
        );
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Workouts this week/month
    const weekStart = getWeekStart();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    const workoutsThisWeek = workouts.filter(
      (w) => w.date.split("T")[0] >= weekStart
    ).length;

    const workoutsThisMonth = workouts.filter(
      (w) => w.date.split("T")[0] >= monthStartStr
    ).length;

    return {
      totalWorkouts: workouts.length,
      averageDuration,
      totalExercises,
      totalSets,
      currentStreak,
      longestStreak,
      workoutsThisWeek,
      workoutsThisMonth,
    };
  },
});

/**
 * Update exercise stats when a set is logged
 * Called from the workout page after adding a set
 */
export const updateExerciseStatsOnSet = mutation({
  args: {
    exerciseName: v.string(),
    weight: v.number(),
    reps: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { exerciseName, weight, reps } = args;
    const volume = weight * reps;
    const now = new Date().toISOString();
    const weekStart = getWeekStart();

    // Find existing stat for this exercise
    const existingStat = await ctx.db
      .query("exerciseStats")
      .withIndex("byUserExercise", (q) =>
        q.eq("userId", user._id).eq("exerciseName", exerciseName)
      )
      .first();

    if (existingStat) {
      // Update existing stats
      const isNewPR = weight > existingStat.maxWeight;
      const newMaxWeight = isNewPR ? weight : existingStat.maxWeight;
      const newMaxWeightReps = isNewPR ? reps : existingStat.maxWeightReps;

      // Update weekly history
      const weeklyHistory = [...existingStat.weeklyHistory];
      const currentWeekIndex = weeklyHistory.findIndex(
        (w) => w.weekStart === weekStart
      );

      if (currentWeekIndex >= 0) {
        // Update existing week entry
        const week = weeklyHistory[currentWeekIndex];
        weeklyHistory[currentWeekIndex] = {
          weekStart,
          sets: week.sets + 1,
          reps: week.reps + reps,
          volume: week.volume + volume,
          maxWeight: Math.max(week.maxWeight, weight),
        };
      } else {
        // Add new week entry
        weeklyHistory.push({
          weekStart,
          sets: 1,
          reps,
          volume,
          maxWeight: weight,
        });

        // Keep only the last 12 weeks
        if (weeklyHistory.length > 12) {
          weeklyHistory.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
          weeklyHistory.splice(0, weeklyHistory.length - 12);
        }
      }

      await ctx.db.patch(existingStat._id, {
        totalSets: existingStat.totalSets + 1,
        totalReps: existingStat.totalReps + reps,
        totalVolume: existingStat.totalVolume + volume,
        maxWeight: newMaxWeight,
        maxWeightReps: newMaxWeightReps,
        lastPerformedAt: now,
        weeklyHistory,
      });

      return { updated: true, isNewPR };
    } else {
      // Create new exercise stat
      await ctx.db.insert("exerciseStats", {
        userId: user._id,
        exerciseName,
        totalSets: 1,
        totalReps: reps,
        totalVolume: volume,
        maxWeight: weight,
        maxWeightReps: reps,
        lastPerformedAt: now,
        weeklyHistory: [
          {
            weekStart,
            sets: 1,
            reps,
            volume,
            maxWeight: weight,
          },
        ],
      });

      return { updated: false, isNewPR: true };
    }
  },
});

/**
 * Get exercise progression data for charts
 * Returns week-over-week data for a specific exercise
 */
export const getExerciseProgression = query({
  args: {
    exerciseName: v.string(),
    weeks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const stat = await ctx.db
      .query("exerciseStats")
      .withIndex("byUserExercise", (q) =>
        q.eq("userId", user._id).eq("exerciseName", args.exerciseName)
      )
      .first();

    if (!stat) {
      return null;
    }

    const weeksToShow = args.weeks ?? 12;
    const history = stat.weeklyHistory
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .slice(-weeksToShow);

    return {
      exerciseName: stat.exerciseName,
      currentMaxWeight: stat.maxWeight,
      progression: history,
    };
  },
});

/**
 * Recalculate all exercise stats from workout history
 * Useful for data migration or fixing inconsistencies
 */
export const recalculateAllStats = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get all completed workouts
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), false))
      .collect();

    // Delete existing stats for this user
    const existingStats = await ctx.db
      .query("exerciseStats")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect();

    for (const stat of existingStats) {
      await ctx.db.delete(stat._id);
    }

    // Build stats from workouts
    const statsMap = new Map<
      string,
      {
        totalSets: number;
        totalReps: number;
        totalVolume: number;
        maxWeight: number;
        maxWeightReps: number;
        lastPerformedAt: string;
        weeklyData: Map<
          string,
          { sets: number; reps: number; volume: number; maxWeight: number }
        >;
      }
    >();

    for (const workout of workouts) {
      const workoutWeek = getWeekStart(new Date(workout.date));

      for (const exercise of workout.exercises) {
        let stat = statsMap.get(exercise.name);
        if (!stat) {
          stat = {
            totalSets: 0,
            totalReps: 0,
            totalVolume: 0,
            maxWeight: 0,
            maxWeightReps: 0,
            lastPerformedAt: workout.date,
            weeklyData: new Map(),
          };
          statsMap.set(exercise.name, stat);
        }

        // Update last performed
        if (workout.date > stat.lastPerformedAt) {
          stat.lastPerformedAt = workout.date;
        }

        // Process each set
        for (const set of exercise.sets) {
          const volume = set.weight * set.reps;
          stat.totalSets++;
          stat.totalReps += set.reps;
          stat.totalVolume += volume;

          if (set.weight > stat.maxWeight) {
            stat.maxWeight = set.weight;
            stat.maxWeightReps = set.reps;
          }

          // Update weekly data
          let weekData = stat.weeklyData.get(workoutWeek);
          if (!weekData) {
            weekData = { sets: 0, reps: 0, volume: 0, maxWeight: 0 };
            stat.weeklyData.set(workoutWeek, weekData);
          }
          weekData.sets++;
          weekData.reps += set.reps;
          weekData.volume += volume;
          weekData.maxWeight = Math.max(weekData.maxWeight, set.weight);
        }
      }
    }

    // Insert new stats
    for (const [exerciseName, stat] of statsMap) {
      // Convert weekly data to array and keep last 12 weeks
      const weeklyHistory = Array.from(stat.weeklyData.entries())
        .map(([weekStart, data]) => ({
          weekStart,
          ...data,
        }))
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .slice(-12);

      await ctx.db.insert("exerciseStats", {
        userId: user._id,
        exerciseName,
        totalSets: stat.totalSets,
        totalReps: stat.totalReps,
        totalVolume: stat.totalVolume,
        maxWeight: stat.maxWeight,
        maxWeightReps: stat.maxWeightReps,
        lastPerformedAt: stat.lastPerformedAt,
        weeklyHistory,
      });
    }

    return { exercisesProcessed: statsMap.size };
  },
});
