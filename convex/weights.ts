import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

export const logWeight = mutation({
  args: {
    weight: v.number(),
    date: v.string(), // ISO date string
    note: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    // Check if entry exists for this date to update instead?
    // For now, let's just create. Or maybe upsert by date?
    // Let's stick to simple create for now, user can edit/delete.
    // Actually, usually one weight per day is standard.
    // Let's check if one exists for the same day (simple date check).
    
    // date here is likely full ISO. We might want to store YYYY-MM-DD for uniqueness if we enforce it.
    // But requirement didn't specify strict uniqueness. Let's just append.
    
    const id = await ctx.db.insert("weightEntries", {
      userId: user._id,
      weight: args.weight,
      date: args.date,
      note: args.note,
      photoUrl: args.photoUrl,
    });
    return id;
  },
});

export const getWeights = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return [];

    const weights = await ctx.db
      .query("weightEntries")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 100);

    return weights;
  },
});

export const updateWeight = mutation({
  args: {
    id: v.id("weightEntries"),
    weight: v.optional(v.number()),
    date: v.optional(v.string()),
    note: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry || entry.userId !== user._id) {
      throw new Error("Untitled or unauthorized");
    }

    await ctx.db.patch(args.id, {
      weight: args.weight,
      date: args.date,
      note: args.note,
      photoUrl: args.photoUrl,
    });
  },
});

export const deleteWeight = mutation({
  args: {
    id: v.id("weightEntries"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry || entry.userId !== user._id) {
      throw new Error("Untitled or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const setWeightGoal = mutation({
  args: {
    targetWeight: v.number(),
    weeklyGoal: v.number(),
    startDate: v.string(),
    startWeight: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("weightGoals")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        targetWeight: args.targetWeight,
        weeklyGoal: args.weeklyGoal,
        startDate: args.startDate,
        startWeight: args.startWeight,
      });
    } else {
      await ctx.db.insert("weightGoals", {
        userId: user._id,
        ...args,
      });
    }
  },
});

export const getWeightGoal = query({
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    return await ctx.db
      .query("weightGoals")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .first();
  },
});
