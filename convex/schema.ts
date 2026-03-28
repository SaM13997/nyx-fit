import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const setValidator = v.object({
  id: v.string(),
  weight: v.number(),
  reps: v.number(),
  completed: v.optional(v.boolean()),
});

export const exerciseValidator = v.object({
  id: v.string(),
  name: v.string(),
  sets: v.array(setValidator),
  category: v.optional(v.string()),
});

export const genderValidator = v.union(v.literal("male"), v.literal("female"));

export const fitnessLevelValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
  v.literal("coach")
);

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    gender: v.optional(genderValidator),
    profilePicture: v.optional(v.string()),
    fitnessLevel: v.optional(fitnessLevelValidator),
    notificationsEnabled: v.boolean(),
    createdAt: v.string(),
  })
    .index("byUserId", ["userId"])
    .index("byEmail", ["email"])
    .index("byCreatedAt", ["createdAt"]),

  workouts: defineTable({
    userId: v.string(),
    date: v.string(),
    duration: v.number(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    exercises: v.array(exerciseValidator),
    bodyPartWorkedOut: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  })
    .index("byUserId", ["userId"])
    .index("byDate", ["date"]),

  weightEntries: defineTable({
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    weight: v.number(), // stored in kg
    note: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    time: v.optional(v.string()), // HH:MM format
    source: v.optional(v.union(v.literal("manual"), v.literal("scale"), v.literal("import"))),
  })
    .index("byUserId", ["userId"])
    .index("byUserDate", ["userId", "date"])
    .index("byDate", ["date"]),

  weightGoals: defineTable({
    userId: v.string(),
    goalType: v.union(v.literal("loss"), v.literal("gain"), v.literal("maintenance")),
    targetWeight: v.number(),
    startWeight: v.number(),
    startDate: v.string(),
    targetDate: v.optional(v.string()),
    weeklyRate: v.optional(v.number()), // positive for gain, negative for loss
    acceptableVariance: v.optional(v.number()), // for maintenance mode
    isActive: v.boolean(),
  })
    .index("byUserId", ["userId"])
    .index("byActive", ["userId", "isActive"]),

  // Pre-aggregated exercise stats for efficient stats page queries
  exerciseStats: defineTable({
    userId: v.string(),
    exerciseName: v.string(), // Matches exercise.name from workouts
    totalSets: v.number(), // All-time set count
    totalReps: v.number(), // All-time rep count
    totalVolume: v.number(), // Sum of (weight × reps) across all sets
    maxWeight: v.number(), // Personal record weight
    maxWeightReps: v.number(), // Reps achieved at max weight
    lastPerformedAt: v.string(), // ISO date string
    // Rolling weekly history for progression charts (up to 12 weeks)
    weeklyHistory: v.array(
      v.object({
        weekStart: v.string(), // ISO date (Monday of that week)
        sets: v.number(),
        reps: v.number(),
        volume: v.number(),
        maxWeight: v.number(),
      })
    ),
  })
    .index("byUserId", ["userId"])
    .index("byUserExercise", ["userId", "exerciseName"]),

  // Daily aggregated workout stats
  userStatsDaily: defineTable({
    userId: v.string(),
    date: v.string(), // "2026-03-18" format
    
    // Volume Metrics
    totalVolume: v.number(), // sum(sets × reps × weight)
    totalSets: v.number(),
    totalReps: v.number(),
    exerciseCount: v.number(),
    
    // Time Metrics
    durationMinutes: v.number(),
    
    // Personal Records
    prCount: v.number(),
    
    // Muscle Group Distribution
    muscleVolumes: v.object({
      chest: v.number(),
      back: v.number(),
      shoulders: v.number(),
      legs: v.number(),
      arms: v.number(),
      core: v.number(),
    }),
    
    // Computed at insert time
    computedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byUserDate", ["userId", "date"]),

  // Periodic (1/3/6 month) aggregated stats
  userStatsPeriodic: defineTable({
    userId: v.string(),
    periodType: v.union(v.literal("1m"), v.literal("3m"), v.literal("6m")),
    periodStart: v.string(), // "2026-03-01"
    periodEnd: v.string(), // "2026-03-31"
    
    // Aggregate Volume
    totalVolume: v.number(),
    totalSets: v.number(),
    totalReps: v.number(),
    workoutCount: v.number(),
    
    // Averages
    avgVolumePerWorkout: v.number(),
    avgSetsPerWorkout: v.number(),
    avgDurationMinutes: v.number(),
    avgWorkoutsPerWeek: v.number(),
    
    // Consistency
    consistencyScore: v.number(), // 0-100 (actual/planned workouts)
    longestStreak: v.number(), // days
    
    // Progress Tracking
    volumeGrowthRate: v.number(), // % vs previous period
    prCount: v.number(),
    
    // Muscle Balance
    muscleDistribution: v.object({
      chest: v.number(), // % of total volume
      back: v.number(),
      shoulders: v.number(),
      legs: v.number(),
      arms: v.number(),
      core: v.number(),
    }),
    
    // Exercise-Specific Progress
    topExercises: v.array(
      v.object({
        exerciseId: v.string(),
        name: v.string(),
        totalVolume: v.number(),
        bestSet: v.object({ weight: v.number(), reps: v.number() }),
        volumeGrowth: v.number(), // % vs previous period
      })
    ),
    
    computedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byUserPeriodType", ["userId", "periodType"])
    .index("byUserPeriod", ["userId", "periodType", "periodStart"]),

  // Weight insights and notifications
  weightInsights: defineTable({
    userId: v.string(),
    type: v.union(v.literal("milestone"), v.literal("trend"), v.literal("warning"), v.literal("achievement")),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("alert")),
    date: v.string(),
    isRead: v.boolean(),
  })
    .index("byUserId", ["userId"])
    .index("byUserUnread", ["userId", "isRead"]),

  // Personal Records history per exercise
  userPRHistory: defineTable({
    userId: v.string(),
    exerciseId: v.string(),
    
    // Current PRs by rep range (using rep1, rep3, etc. instead of "1", "3" for Convex compatibility)
    prs: v.object({
      rep1: v.object({ weight: v.number(), date: v.string() }),
      rep3: v.object({ weight: v.number(), date: v.string() }),
      rep5: v.object({ weight: v.number(), date: v.string() }),
      rep8: v.object({ weight: v.number(), date: v.string() }),
      rep10: v.object({ weight: v.number(), date: v.string() }),
      rep12: v.object({ weight: v.number(), date: v.string() }),
    }),
    
    // History for trends
    history: v.array(
      v.object({
        date: v.string(),
        weight: v.number(),
        reps: v.number(),
        estimated1RM: v.number(), // using Brzycki formula
      })
    ),
    
    lastUpdated: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byUserExercise", ["userId", "exerciseId"]),
});
