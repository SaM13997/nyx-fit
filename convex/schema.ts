import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const setValidator = v.object({
  id: v.string(),
  weight: v.number(),
  reps: v.number(),
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
  v.literal("intermediary"),
  v.literal("advanced"),
  v.literal("pro")
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
    notes: v.optional(v.string()),
  })
    .index("byUserId", ["userId"])
    .index("byDate", ["date"]),

  weightEntries: defineTable({
    userId: v.string(),
    date: v.string(),
    weight: v.number(),
    note: v.optional(v.string()),
  })
    .index("byUserId", ["userId"])
    .index("byDate", ["date"]),
});
