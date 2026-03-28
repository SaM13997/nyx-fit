import { query, mutation, internalAction, internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { authComponent } from "./auth";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Type aliases for the new tables
type UserStatsDailyDoc = Doc<"userStatsDaily">;
type UserStatsPeriodicDoc = Doc<"userStatsPeriodic">;
type UserPRHistoryDoc = Doc<"userPRHistory">;
type WorkoutDoc = Doc<"workouts">;

// Muscle group mapping for exercises
const exerciseToMuscleMap: Record<string, keyof UserStatsDailyDoc["muscleVolumes"]> = {
  // Chest
  "Bench Press": "chest",
  "Incline Bench Press": "chest",
  "Dumbbell Flyes": "chest",
  "Cable Crossovers": "chest",
  "Push-ups": "chest",
  "Dips": "chest",
  "Chest Press Machine": "chest",
  "Pec Deck": "chest",
  
  // Back
  "Pull-ups": "back",
  "Lat Pulldown": "back",
  "Barbell Row": "back",
  "Dumbbell Row": "back",
  "Seated Cable Row": "back",
  "Deadlift": "back",
  "Romanian Deadlift": "back",
  "T-Bar Row": "back",
  "Face Pulls": "back",
  
  // Shoulders
  "Overhead Press": "shoulders",
  "Military Press": "shoulders",
  "Lateral Raises": "shoulders",
  "Front Raises": "shoulders",
  "Rear Delt Flyes": "shoulders",
  "Arnold Press": "shoulders",
  "Shrugs": "shoulders",
  
  // Legs
  "Squat": "legs",
  "Leg Press": "legs",
  "Leg Extension": "legs",
  "Leg Curl": "legs",
  "Lunges": "legs",
  "Bulgarian Split Squat": "legs",
  "Hack Squat": "legs",
  "Calf Raises": "legs",
  "Hip Thrust": "legs",
  "Goblet Squat": "legs",
  
  // Arms
  "Bicep Curls": "arms",
  "Hammer Curls": "arms",
  "Preacher Curls": "arms",
  "Tricep Pushdowns": "arms",
  "Skullcrushers": "arms",
  "Overhead Tricep Extension": "arms",
  "Close Grip Bench Press": "arms",
  "Concentration Curls": "arms",
  
  // Core
  "Plank": "core",
  "Crunches": "core",
  "Leg Raises": "core",
  "Russian Twists": "core",
  "Ab Wheel": "core",
  "Hanging Leg Raises": "core",
  "Cable Crunches": "core",
};

// Helper: Get muscle group for an exercise
function getMuscleGroup(exerciseName: string): keyof UserStatsDailyDoc["muscleVolumes"] {
  return exerciseToMuscleMap[exerciseName] || "core";
}

// Helper: Calculate estimated 1RM using Brzycki formula
function calculateEstimated1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight / (1.0278 - 0.0278 * reps);
}

// Helper: Get the closest rep range key
function getRepRangeKey(reps: number): "rep1" | "rep3" | "rep5" | "rep8" | "rep10" | "rep12" {
  if (reps <= 1) return "rep1";
  if (reps <= 3) return "rep3";
  if (reps <= 5) return "rep5";
  if (reps <= 8) return "rep8";
  if (reps <= 10) return "rep10";
  return "rep12";
}

// Helper: Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Helper: Get start of day timestamp
function startOfDay(dateStr: string): number {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// Helper: Get end of day timestamp
function endOfDay(dateStr: string): number {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

// Helper: Calculate consistency score
function calculateConsistencyScore(
  actualWorkouts: number,
  weeksInPeriod: number,
  expectedPerWeek: number = 3
): number {
  const expectedWorkouts = weeksInPeriod * expectedPerWeek;
  const score = (actualWorkouts / expectedWorkouts) * 100;
  return Math.min(Math.round(score), 100);
}

// Helper: Check if set is completed
function isSetCompleted(set: { completed?: boolean }): boolean {
  return set.completed !== false;
}

// ============================================
// DAILY STATS COMPUTATION
// ============================================

/**
 * Compute daily stats for a specific date (internal version for scheduled jobs)
 */
export const computeDailyStatsInternal = internalMutation({
  args: {
    userId: v.id("profiles"),
    date: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const { userId, date } = args;
    const startTime = startOfDay(date);
    const endTime = endOfDay(date);

    // Get all completed workouts for this date
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("byUserId", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), new Date(startTime).toISOString()),
          q.lte(q.field("date"), new Date(endTime).toISOString())
        )
      )
      .collect();

    if (workouts.length === 0) {
      const existingStats = await ctx.db
        .query("userStatsDaily")
        .withIndex("byUserDate", (q) => q.eq("userId", userId).eq("date", date))
        .first();
      
      if (existingStats) {
        await ctx.db.delete(existingStats._id);
      }
      return;
    }

    // Aggregate stats
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let exerciseCount = 0;
    let totalDuration = 0;
    let prCount = 0;

    const muscleVolumes: UserStatsDailyDoc["muscleVolumes"] = {
      chest: 0,
      back: 0,
      shoulders: 0,
      legs: 0,
      arms: 0,
      core: 0,
    };

    for (const workout of workouts) {
      totalDuration += workout.duration || 0;
      
      for (const exercise of workout.exercises) {
        exerciseCount++;
        const muscleGroup = getMuscleGroup(exercise.name);
        
        for (const set of exercise.sets) {
          if (isSetCompleted(set)) {
            const setVolume = set.weight * set.reps;
            totalVolume += setVolume;
            totalSets++;
            totalReps += set.reps;
            muscleVolumes[muscleGroup] += setVolume;
          }
        }
      }
    }

    // Check for PRs
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          if (isSetCompleted(set)) {
            const prHistory = await ctx.db
              .query("userPRHistory")
              .withIndex("byUserExercise", (q) =>
                q.eq("userId", userId).eq("exerciseId", exercise.name)
              )
              .first();

            if (prHistory) {
              const repRange = getRepRangeKey(set.reps);
              const currentPR = prHistory.prs[repRange];
              if (set.weight > currentPR.weight) {
                prCount++;
              }
            }
          }
        }
      }
    }

    const dailyStats = {
      userId,
      date,
      totalVolume,
      totalSets,
      totalReps,
      exerciseCount,
      durationMinutes: Math.round(totalDuration / 60),
      prCount,
      muscleVolumes,
      computedAt: Date.now(),
    };

    const existingStats = await ctx.db
      .query("userStatsDaily")
      .withIndex("byUserDate", (q) => q.eq("userId", userId).eq("date", date))
      .first();

    if (existingStats) {
      await ctx.db.patch(existingStats._id, dailyStats);
    } else {
      await ctx.db.insert("userStatsDaily", dailyStats);
    }
  },
});

/**
 * Compute daily stats for a specific date (user-facing)
 */
export const computeDailyStats = mutation({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { date } = args;
    const startTime = startOfDay(date);
    const endTime = endOfDay(date);

    const workouts = await ctx.db
      .query("workouts")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), new Date(startTime).toISOString()),
          q.lte(q.field("date"), new Date(endTime).toISOString())
        )
      )
      .collect();

    if (workouts.length === 0) {
      const existingStats = await ctx.db
        .query("userStatsDaily")
        .withIndex("byUserDate", (q) => q.eq("userId", user._id).eq("date", date))
        .first();
      
      if (existingStats) {
        await ctx.db.delete(existingStats._id);
      }
      return;
    }

    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let exerciseCount = 0;
    let totalDuration = 0;
    let prCount = 0;

    const muscleVolumes: UserStatsDailyDoc["muscleVolumes"] = {
      chest: 0,
      back: 0,
      shoulders: 0,
      legs: 0,
      arms: 0,
      core: 0,
    };

    for (const workout of workouts) {
      totalDuration += workout.duration || 0;
      
      for (const exercise of workout.exercises) {
        exerciseCount++;
        const muscleGroup = getMuscleGroup(exercise.name);
        
        for (const set of exercise.sets) {
          if (isSetCompleted(set)) {
            const setVolume = set.weight * set.reps;
            totalVolume += setVolume;
            totalSets++;
            totalReps += set.reps;
            muscleVolumes[muscleGroup] += setVolume;
          }
        }
      }
    }

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          if (isSetCompleted(set)) {
            const prHistory = await ctx.db
              .query("userPRHistory")
              .withIndex("byUserExercise", (q) =>
                q.eq("userId", user._id).eq("exerciseId", exercise.name)
              )
              .first();

            if (prHistory) {
              const repRange = getRepRangeKey(set.reps);
              const currentPR = prHistory.prs[repRange];
              if (set.weight > currentPR.weight) {
                prCount++;
              }
            }
          }
        }
      }
    }

    const dailyStats = {
      userId: user._id,
      date,
      totalVolume,
      totalSets,
      totalReps,
      exerciseCount,
      durationMinutes: Math.round(totalDuration / 60),
      prCount,
      muscleVolumes,
      computedAt: Date.now(),
    };

    const existingStats = await ctx.db
      .query("userStatsDaily")
      .withIndex("byUserDate", (q) => q.eq("userId", user._id).eq("date", date))
      .first();

    if (existingStats) {
      await ctx.db.patch(existingStats._id, dailyStats);
    } else {
      await ctx.db.insert("userStatsDaily", dailyStats);
    }
  },
});

// ============================================
// PERIODIC STATS COMPUTATION
// ============================================

/**
 * Compute periodic (1/3/6 month) stats (internal version)
 */
export const computePeriodicStatsInternal = internalMutation({
  args: {
    userId: v.id("profiles"),
    periodType: v.union(v.literal("1m"), v.literal("3m"), v.literal("6m")),
  },
  handler: async (ctx, args): Promise<void> => {
    const { userId, periodType } = args;
    const endDate = new Date();
    const monthsBack = periodType === "1m" ? 1 : periodType === "3m" ? 3 : 6;
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const periodStart = formatDate(startDate);
    const periodEnd = formatDate(endDate);

    const dailyStats = await ctx.db
      .query("userStatsDaily")
      .withIndex("byUserId", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), periodStart),
          q.lte(q.field("date"), periodEnd)
        )
      )
      .collect();

    if (dailyStats.length === 0) {
      return;
    }

    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let workoutCount = 0;
    let totalDuration = 0;
    let prCount = 0;
    let longestStreak = 0;
    let currentStreak = 0;

    const muscleVolumes: UserStatsPeriodicDoc["muscleDistribution"] = {
      chest: 0,
      back: 0,
      shoulders: 0,
      legs: 0,
      arms: 0,
      core: 0,
    };

    const exerciseVolumes: Map<string, { volume: number; bestWeight: number; bestReps: number }> = new Map();
    let prevDate: string | null = null;

    for (const day of dailyStats) {
      totalVolume += day.totalVolume;
      totalSets += day.totalSets;
      totalReps += day.totalReps;
      workoutCount++;
      totalDuration += day.durationMinutes;
      prCount += day.prCount;

      muscleVolumes.chest += day.muscleVolumes.chest;
      muscleVolumes.back += day.muscleVolumes.back;
      muscleVolumes.shoulders += day.muscleVolumes.shoulders;
      muscleVolumes.legs += day.muscleVolumes.legs;
      muscleVolumes.arms += day.muscleVolumes.arms;
      muscleVolumes.core += day.muscleVolumes.core;

      if (prevDate) {
        const prev = new Date(prevDate);
        const curr = new Date(day.date);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      prevDate = day.date;

      const dayStart = startOfDay(day.date);
      const dayEnd = endOfDay(day.date);
      
      const workouts = await ctx.db
        .query("workouts")
        .withIndex("byUserId", (q) => q.eq("userId", userId))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), new Date(dayStart).toISOString()),
            q.lte(q.field("date"), new Date(dayEnd).toISOString())
          )
        )
        .collect();

      for (const workout of workouts) {
        for (const exercise of workout.exercises) {
          for (const set of exercise.sets) {
            if (isSetCompleted(set)) {
              const setVolume = set.weight * set.reps;
              const existing = exerciseVolumes.get(exercise.name) || {
                volume: 0,
                bestWeight: 0,
                bestReps: 0,
              };
              
              existing.volume += setVolume;
              if (set.weight > existing.bestWeight) {
                existing.bestWeight = set.weight;
                existing.bestReps = set.reps;
              }
              
              exerciseVolumes.set(exercise.name, existing);
            }
          }
        }
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    const totalMuscleVolume = Object.values(muscleVolumes).reduce((a, b) => a + b, 0);
    const muscleDistribution: UserStatsPeriodicDoc["muscleDistribution"] = {
      chest: totalMuscleVolume > 0 ? Math.round((muscleVolumes.chest / totalMuscleVolume) * 100) : 0,
      back: totalMuscleVolume > 0 ? Math.round((muscleVolumes.back / totalMuscleVolume) * 100) : 0,
      shoulders: totalMuscleVolume > 0 ? Math.round((muscleVolumes.shoulders / totalMuscleVolume) * 100) : 0,
      legs: totalMuscleVolume > 0 ? Math.round((muscleVolumes.legs / totalMuscleVolume) * 100) : 0,
      arms: totalMuscleVolume > 0 ? Math.round((muscleVolumes.arms / totalMuscleVolume) * 100) : 0,
      core: totalMuscleVolume > 0 ? Math.round((muscleVolumes.core / totalMuscleVolume) * 100) : 0,
    };

    const sortedExercises = Array.from(exerciseVolumes.entries())
      .sort((a, b) => b[1].volume - a[1].volume)
      .slice(0, 5);

    const prevPeriodEnd = new Date(startDate);
    prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd);
    prevPeriodStart.setMonth(prevPeriodStart.getMonth() - monthsBack);

    const prevDailyStats = await ctx.db
      .query("userStatsDaily")
      .withIndex("byUserId", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), formatDate(prevPeriodStart)),
          q.lte(q.field("date"), formatDate(prevPeriodEnd))
        )
      )
      .collect();

    const prevTotalVolume = prevDailyStats.reduce((sum, day) => sum + day.totalVolume, 0);
    const volumeGrowthRate = prevTotalVolume > 0 
      ? Math.round(((totalVolume - prevTotalVolume) / prevTotalVolume) * 100)
      : 0;

    const topExercises: UserStatsPeriodicDoc["topExercises"] = await Promise.all(
      sortedExercises.map(async ([name, data]) => {
        let prevVolume = 0;
        for (const day of prevDailyStats) {
          const dayStart = startOfDay(day.date);
          const dayEnd = endOfDay(day.date);
          
          const workouts = await ctx.db
            .query("workouts")
            .withIndex("byUserId", (q) => q.eq("userId", userId))
            .filter((q) =>
              q.and(
                q.gte(q.field("date"), new Date(dayStart).toISOString()),
                q.lte(q.field("date"), new Date(dayEnd).toISOString())
              )
            )
            .collect();

          for (const workout of workouts) {
            const exercise = workout.exercises.find((e) => e.name === name);
            if (exercise) {
              for (const set of exercise.sets) {
                if (isSetCompleted(set)) {
                  prevVolume += set.weight * set.reps;
                }
              }
            }
          }
        }

        const volumeGrowth = prevVolume > 0 
          ? Math.round(((data.volume - prevVolume) / prevVolume) * 100)
          : 0;

        return {
          exerciseId: name,
          name,
          totalVolume: data.volume,
          bestSet: { weight: data.bestWeight, reps: data.bestReps },
          volumeGrowth,
        };
      })
    );

    const weeksInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const periodicStats = {
      userId,
      periodType,
      periodStart,
      periodEnd,
      totalVolume,
      totalSets,
      totalReps,
      workoutCount,
      avgVolumePerWorkout: workoutCount > 0 ? Math.round(totalVolume / workoutCount) : 0,
      avgSetsPerWorkout: workoutCount > 0 ? Math.round(totalSets / workoutCount) : 0,
      avgDurationMinutes: workoutCount > 0 ? Math.round(totalDuration / workoutCount) : 0,
      avgWorkoutsPerWeek: weeksInPeriod > 0 ? Math.round((workoutCount / weeksInPeriod) * 10) / 10 : 0,
      consistencyScore: calculateConsistencyScore(workoutCount, weeksInPeriod),
      longestStreak,
      volumeGrowthRate,
      prCount,
      muscleDistribution,
      topExercises,
      computedAt: Date.now(),
    };

    const existingStats = await ctx.db
      .query("userStatsPeriodic")
      .withIndex("byUserPeriod", (q) =>
        q.eq("userId", userId).eq("periodType", periodType).eq("periodStart", periodStart)
      )
      .first();

    if (existingStats) {
      await ctx.db.patch(existingStats._id, periodicStats);
    } else {
      await ctx.db.insert("userStatsPeriodic", periodicStats);
    }
  },
});

/**
 * Compute periodic (1/3/6 month) stats (user-facing)
 */
export const computePeriodicStats = mutation({
  args: {
    periodType: v.union(v.literal("1m"), v.literal("3m"), v.literal("6m")),
  },
  handler: async (ctx, args): Promise<void> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { periodType } = args;
    const endDate = new Date();
    const monthsBack = periodType === "1m" ? 1 : periodType === "3m" ? 3 : 6;
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const periodStart = formatDate(startDate);
    const periodEnd = formatDate(endDate);

    const dailyStats = await ctx.db
      .query("userStatsDaily")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), periodStart),
          q.lte(q.field("date"), periodEnd)
        )
      )
      .collect();

    if (dailyStats.length === 0) {
      return;
    }

    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let workoutCount = 0;
    let totalDuration = 0;
    let prCount = 0;
    let longestStreak = 0;
    let currentStreak = 0;

    const muscleVolumes: UserStatsPeriodicDoc["muscleDistribution"] = {
      chest: 0,
      back: 0,
      shoulders: 0,
      legs: 0,
      arms: 0,
      core: 0,
    };

    const exerciseVolumes: Map<string, { volume: number; bestWeight: number; bestReps: number }> = new Map();
    let prevDate: string | null = null;

    for (const day of dailyStats) {
      totalVolume += day.totalVolume;
      totalSets += day.totalSets;
      totalReps += day.totalReps;
      workoutCount++;
      totalDuration += day.durationMinutes;
      prCount += day.prCount;

      muscleVolumes.chest += day.muscleVolumes.chest;
      muscleVolumes.back += day.muscleVolumes.back;
      muscleVolumes.shoulders += day.muscleVolumes.shoulders;
      muscleVolumes.legs += day.muscleVolumes.legs;
      muscleVolumes.arms += day.muscleVolumes.arms;
      muscleVolumes.core += day.muscleVolumes.core;

      if (prevDate) {
        const prev = new Date(prevDate);
        const curr = new Date(day.date);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      prevDate = day.date;

      const dayStart = startOfDay(day.date);
      const dayEnd = endOfDay(day.date);
      
      const workouts = await ctx.db
        .query("workouts")
        .withIndex("byUserId", (q) => q.eq("userId", user._id))
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), new Date(dayStart).toISOString()),
            q.lte(q.field("date"), new Date(dayEnd).toISOString())
          )
        )
        .collect();

      for (const workout of workouts) {
        for (const exercise of workout.exercises) {
          for (const set of exercise.sets) {
            if (isSetCompleted(set)) {
              const setVolume = set.weight * set.reps;
              const existing = exerciseVolumes.get(exercise.name) || {
                volume: 0,
                bestWeight: 0,
                bestReps: 0,
              };
              
              existing.volume += setVolume;
              if (set.weight > existing.bestWeight) {
                existing.bestWeight = set.weight;
                existing.bestReps = set.reps;
              }
              
              exerciseVolumes.set(exercise.name, existing);
            }
          }
        }
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    const totalMuscleVolume = Object.values(muscleVolumes).reduce((a, b) => a + b, 0);
    const muscleDistribution: UserStatsPeriodicDoc["muscleDistribution"] = {
      chest: totalMuscleVolume > 0 ? Math.round((muscleVolumes.chest / totalMuscleVolume) * 100) : 0,
      back: totalMuscleVolume > 0 ? Math.round((muscleVolumes.back / totalMuscleVolume) * 100) : 0,
      shoulders: totalMuscleVolume > 0 ? Math.round((muscleVolumes.shoulders / totalMuscleVolume) * 100) : 0,
      legs: totalMuscleVolume > 0 ? Math.round((muscleVolumes.legs / totalMuscleVolume) * 100) : 0,
      arms: totalMuscleVolume > 0 ? Math.round((muscleVolumes.arms / totalMuscleVolume) * 100) : 0,
      core: totalMuscleVolume > 0 ? Math.round((muscleVolumes.core / totalMuscleVolume) * 100) : 0,
    };

    const sortedExercises = Array.from(exerciseVolumes.entries())
      .sort((a, b) => b[1].volume - a[1].volume)
      .slice(0, 5);

    const prevPeriodEnd = new Date(startDate);
    prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd);
    prevPeriodStart.setMonth(prevPeriodStart.getMonth() - monthsBack);

    const prevDailyStats = await ctx.db
      .query("userStatsDaily")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), formatDate(prevPeriodStart)),
          q.lte(q.field("date"), formatDate(prevPeriodEnd))
        )
      )
      .collect();

    const prevTotalVolume = prevDailyStats.reduce((sum, day) => sum + day.totalVolume, 0);
    const volumeGrowthRate = prevTotalVolume > 0 
      ? Math.round(((totalVolume - prevTotalVolume) / prevTotalVolume) * 100)
      : 0;

    const topExercises: UserStatsPeriodicDoc["topExercises"] = await Promise.all(
      sortedExercises.map(async ([name, data]) => {
        let prevVolume = 0;
        for (const day of prevDailyStats) {
          const dayStart = startOfDay(day.date);
          const dayEnd = endOfDay(day.date);
          
          const workouts = await ctx.db
            .query("workouts")
            .withIndex("byUserId", (q) => q.eq("userId", user._id))
            .filter((q) =>
              q.and(
                q.gte(q.field("date"), new Date(dayStart).toISOString()),
                q.lte(q.field("date"), new Date(dayEnd).toISOString())
              )
            )
            .collect();

          for (const workout of workouts) {
            const exercise = workout.exercises.find((e) => e.name === name);
            if (exercise) {
              for (const set of exercise.sets) {
                if (isSetCompleted(set)) {
                  prevVolume += set.weight * set.reps;
                }
              }
            }
          }
        }

        const volumeGrowth = prevVolume > 0 
          ? Math.round(((data.volume - prevVolume) / prevVolume) * 100)
          : 0;

        return {
          exerciseId: name,
          name,
          totalVolume: data.volume,
          bestSet: { weight: data.bestWeight, reps: data.bestReps },
          volumeGrowth,
        };
      })
    );

    const weeksInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const periodicStats = {
      userId: user._id,
      periodType,
      periodStart,
      periodEnd,
      totalVolume,
      totalSets,
      totalReps,
      workoutCount,
      avgVolumePerWorkout: workoutCount > 0 ? Math.round(totalVolume / workoutCount) : 0,
      avgSetsPerWorkout: workoutCount > 0 ? Math.round(totalSets / workoutCount) : 0,
      avgDurationMinutes: workoutCount > 0 ? Math.round(totalDuration / workoutCount) : 0,
      avgWorkoutsPerWeek: weeksInPeriod > 0 ? Math.round((workoutCount / weeksInPeriod) * 10) / 10 : 0,
      consistencyScore: calculateConsistencyScore(workoutCount, weeksInPeriod),
      longestStreak,
      volumeGrowthRate,
      prCount,
      muscleDistribution,
      topExercises,
      computedAt: Date.now(),
    };

    const existingStats = await ctx.db
      .query("userStatsPeriodic")
      .withIndex("byUserPeriod", (q) =>
        q.eq("userId", user._id).eq("periodType", periodType).eq("periodStart", periodStart)
      )
      .first();

    if (existingStats) {
      await ctx.db.patch(existingStats._id, periodicStats);
    } else {
      await ctx.db.insert("userStatsPeriodic", periodicStats);
    }
  },
});

// ============================================
// PR TRACKING
// ============================================

/**
 * Update PR history when a set is completed
 */
export const updatePRHistory = mutation({
  args: {
    exerciseId: v.string(),
    weight: v.number(),
    reps: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { exerciseId, weight, reps, date } = args;
    const repRange = getRepRangeKey(reps);
    const estimated1RM = calculateEstimated1RM(weight, reps);

    const prHistory = await ctx.db
      .query("userPRHistory")
      .withIndex("byUserExercise", (q) =>
        q.eq("userId", user._id).eq("exerciseId", exerciseId)
      )
      .first();

    const isNewPR = !prHistory || weight > prHistory.prs[repRange].weight;

    if (!prHistory) {
      await ctx.db.insert("userPRHistory", {
        userId: user._id,
        exerciseId,
        prs: {
          rep1: { weight: reps === 1 ? weight : 0, date: reps === 1 ? date : "" },
          rep3: { weight: repRange === "rep3" ? weight : 0, date: repRange === "rep3" ? date : "" },
          rep5: { weight: repRange === "rep5" ? weight : 0, date: repRange === "rep5" ? date : "" },
          rep8: { weight: repRange === "rep8" ? weight : 0, date: repRange === "rep8" ? date : "" },
          rep10: { weight: repRange === "rep10" ? weight : 0, date: repRange === "rep10" ? date : "" },
          rep12: { weight: repRange === "rep12" ? weight : 0, date: repRange === "rep12" ? date : "" },
        },
        history: [{ date, weight, reps, estimated1RM }],
        lastUpdated: Date.now(),
      });
    } else {
      const newPRs = { ...prHistory.prs };
      if (isNewPR) {
        newPRs[repRange] = { weight, date };
      }

      const newHistory = [...prHistory.history, { date, weight, reps, estimated1RM }];
      if (newHistory.length > 100) {
        newHistory.shift();
      }

      await ctx.db.patch(prHistory._id, {
        prs: newPRs,
        history: newHistory,
        lastUpdated: Date.now(),
      });
    }

    return isNewPR;
  },
});

// ============================================
// API QUERIES
// ============================================

/**
 * Get dashboard stats for all periods (1m, 3m, 6m)
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const periodicStats = await ctx.db
      .query("userStatsPeriodic")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect();

    const periods: Record<string, UserStatsPeriodicDoc> = {};
    for (const stat of periodicStats) {
      periods[stat.periodType] = stat;
    }

    const dailyStats = await ctx.db
      .query("userStatsDaily")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    let currentStreak = 0;
    const today = formatDate(new Date());
    let checkDate = today;

    for (const day of dailyStats) {
      if (day.date === checkDate) {
        currentStreak++;
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - 1);
        checkDate = formatDate(prevDate);
      } else {
        break;
      }
    }

    const lastWorkout = await ctx.db
      .query("workouts")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    return {
      periods: {
        "1m": periods["1m"] || null,
        "3m": periods["3m"] || null,
        "6m": periods["6m"] || null,
      },
      currentStreak,
      lastWorkout: lastWorkout
        ? {
            date: formatDate(new Date(lastWorkout.date)),
            volume: 0,
            duration: lastWorkout.duration,
          }
        : null,
    };
  },
});

/**
 * Get exercise-specific stats
 */
export const getExerciseStats = query({
  args: {
    exerciseId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const prHistory = await ctx.db
      .query("userPRHistory")
      .withIndex("byUserExercise", (q) =>
        q.eq("userId", user._id).eq("exerciseId", args.exerciseId)
      )
      .first();

    if (!prHistory) {
      return null;
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const progression = prHistory.history
      .filter((h) => new Date(h.date) >= sixMonthsAgo)
      .map((h) => ({
        date: h.date,
        weight: h.weight,
        reps: h.reps,
        estimated1RM: h.estimated1RM,
      }));

    const max1RM = Math.max(...prHistory.history.map((h) => h.estimated1RM), 0);
    let strengthLevel: "beginner" | "intermediate" | "advanced" = "beginner";
    
    if (max1RM > 200) {
      strengthLevel = "advanced";
    } else if (max1RM > 100) {
      strengthLevel = "intermediate";
    }

    return {
      exerciseId: args.exerciseId,
      name: args.exerciseId,
      currentPRs: prHistory.prs,
      progression,
      estimated1RM: max1RM,
      strengthLevel,
    };
  },
});

/**
 * Get comparison data between periods
 */
export const getStatsComparison = query({
  args: {
    periodTypes: v.array(v.union(v.literal("1m"), v.literal("3m"), v.literal("6m"))),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const comparisons = [];

    for (const periodType of args.periodTypes) {
      const stats = await ctx.db
        .query("userStatsPeriodic")
        .withIndex("byUserPeriodType", (q) => q.eq("userId", user._id).eq("periodType", periodType))
        .order("desc")
        .first();

      if (stats) {
        comparisons.push({
          period: periodType,
          totalVolume: stats.totalVolume,
          workoutCount: stats.workoutCount,
          consistencyScore: stats.consistencyScore,
          volumeGrowthRate: stats.volumeGrowthRate,
        });
      }
    }

    return { comparisons };
  },
});

// ============================================
// SCHEDULED ACTIONS
// ============================================

/**
 * Internal query to get workouts since a date
 */
export const listWorkoutsSince = query({
  args: {
    since: v.string(),
  },
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("byDate", (q) => q.gte("date", args.since))
      .collect();
    return workouts.map((w) => ({ userId: w.userId, date: w.date }));
  },
});

/**
 * Nightly job to recompute all stats
 * Schedule this via Convex dashboard to run daily at 2 AM
 * 
 * Note: This action requires proper Convex scheduling setup.
 * For now, stats are computed on-demand when users view their dashboard
 * and when workouts are completed.
 */
export const runNightlyStatsJob = internalAction({
  args: {},
  handler: async (ctx) => {
    // This is a placeholder for the scheduled job
    // In production, this would:
    // 1. Query all active users from the last 7 days
    // 2. Recompute daily stats for yesterday
    // 3. Recompute all periodic stats
    // 4. Update caches
    
    return { processedUsers: 0, message: "Stats job placeholder - implement with proper Convex scheduling" };
  },
});
