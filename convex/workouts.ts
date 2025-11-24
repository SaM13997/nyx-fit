import type { Workout } from "../src/lib/types";
import { authComponent } from "./auth";

import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { exerciseValidator } from "./schema";
import { v } from "convex/values";

type WorkoutDoc = Doc<"workouts">;

const workoutFieldsValidator = {
  date: v.string(),
  duration: v.number(),
  startTime: v.optional(v.string()),
  endTime: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  exercises: v.array(exerciseValidator),
  notes: v.optional(v.string()),
} as const;

const workoutUpdateValidator = v.object({
  date: v.optional(workoutFieldsValidator.date),
  duration: v.optional(workoutFieldsValidator.duration),
  startTime: workoutFieldsValidator.startTime,
  endTime: workoutFieldsValidator.endTime,
  isActive: workoutFieldsValidator.isActive,
  exercises: v.optional(workoutFieldsValidator.exercises),
  notes: workoutFieldsValidator.notes,
});

const mapWorkout = (doc: WorkoutDoc): Workout => {
  const { _id, _creationTime, ...rest } = doc;
  return {
    id: _id,
    ...rest,
  } as Workout;
};

const sanitizeUpdates = (updates: Partial<WorkoutDoc>): Partial<WorkoutDoc> => {
  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  ) as Partial<WorkoutDoc>;
};

export const listWorkouts = query({
  args: {},
  handler: async (ctx): Promise<Workout[]> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }
    const docs = await ctx.db
      .query("workouts")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect();
    return docs.map(mapWorkout);
  },
});

export const getWorkout = query({
  args: { id: v.id("workouts") },
  handler: async (ctx, args): Promise<Workout | null> => {
    const doc = await ctx.db.get(args.id);
    return doc ? mapWorkout(doc) : null;
  },
});

export const createWorkout = mutation({
  args: workoutFieldsValidator,
  handler: async (ctx, args): Promise<Workout> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const insertedId = await ctx.db.insert("workouts", {
      ...args,
      userId: user._id,
    });
    const doc = (await ctx.db.get(insertedId)) as WorkoutDoc;
    return mapWorkout(doc);
  },
});

export const updateWorkout = mutation({
  args: {
    id: v.id("workouts"),
    updates: workoutUpdateValidator,
  },
  handler: async (ctx, args): Promise<Workout> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Workout not found");
    }
    if (existing.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updates = sanitizeUpdates(args.updates as Partial<WorkoutDoc>);
    await ctx.db.patch(args.id, updates);
    const updated = (await ctx.db.get(args.id)) as WorkoutDoc;
    return mapWorkout(updated);
  },
});

export const deleteWorkout = mutation({
  args: { id: v.id("workouts") },
  handler: async (ctx, args): Promise<Id<"workouts">> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Workout not found");
    }
    if (existing.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Get recent workouts sorted by date (most recent first)
 */
export const listRecentWorkouts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<Workout[]> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }
    const limit = args.limit ?? 5;
    const docs = await ctx.db
      .query("workouts")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
    return docs.map(mapWorkout);
  },
});

/**
 * Get the currently active workout (if any)
 */
export const getActiveWorkout = query({
  args: {},
  handler: async (ctx): Promise<Workout | null> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }
    const doc = await ctx.db
      .query("workouts")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    return doc ? mapWorkout(doc) : null;
  },
});

/**
 * Start a new workout session
 */
export const startWorkout = mutation({
  args: {},
  handler: async (ctx): Promise<Workout> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const now = new Date().toISOString();
    const insertedId = await ctx.db.insert("workouts", {
      userId: user._id,
      date: now,
      duration: 0,
      startTime: now,
      isActive: true,
      exercises: [],
    });
    const doc = (await ctx.db.get(insertedId)) as WorkoutDoc;
    return mapWorkout(doc);
  },
});
