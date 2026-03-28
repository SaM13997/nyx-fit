import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import type { Doc } from "./_generated/dataModel";

// Helper functions
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function calculateMovingAverage(entries: { weight: number }[], days: number): number[] {
  const result = [];
  for (let i = 0; i < entries.length; i++) {
    const start = Math.max(0, i - days + 1);
    const subset = entries.slice(start, i + 1);
    const avg = subset.reduce((sum, e) => sum + e.weight, 0) / subset.length;
    result.push(avg);
  }
  return result;
}

function calculateTrend(entries: { weight: number }[]): { slope: number; weeklyChange: number } {
  const n = entries.length;
  if (n < 2) return { slope: 0, weeklyChange: 0 };
  
  const x = entries.map((_, i) => i);
  const y = entries.map((e) => e.weight);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const weeklyChange = slope * 7; // Convert daily slope to weekly
  
  return { slope, weeklyChange };
}

// ============================================
// WEIGHT LOGGING
// ============================================

export const logWeight = mutation({
  args: {
    weight: v.number(),
    date: v.string(), // YYYY-MM-DD format
    time: v.optional(v.string()), // HH:MM format
    note: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    source: v.optional(v.union(v.literal("manual"), v.literal("scale"), v.literal("import"))),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    // Check if entry already exists for this date
    const existingEntry = await ctx.db
      .query("weightEntries")
      .withIndex("byUserDate", (q) => q.eq("userId", user._id).eq("date", args.date))
      .first();

    if (existingEntry) {
      // Update existing entry
      await ctx.db.patch(existingEntry._id, {
        weight: args.weight,
        time: args.time,
        note: args.note,
        photoUrl: args.photoUrl,
        source: args.source || "manual",
      });
      return existingEntry._id;
    }

    // Create new entry
    const id = await ctx.db.insert("weightEntries", {
      userId: user._id,
      weight: args.weight,
      date: args.date,
      time: args.time,
      note: args.note,
      photoUrl: args.photoUrl,
      source: args.source || "manual",
    });

    // Generate insights after logging
    await generateWeightInsights(ctx, user._id);

    return id;
  },
});

export const getWeights = query({
  args: {
    limit: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return [];

    let query = ctx.db
      .query("weightEntries")
      .withIndex("byUserId", (q) => q.eq("userId", user._id));

    // Apply date filters if provided
    if (args.startDate || args.endDate) {
      query = query.filter((q) => {
        const conditions = [];
        if (args.startDate) {
          conditions.push(q.gte(q.field("date"), args.startDate));
        }
        if (args.endDate) {
          conditions.push(q.lte(q.field("date"), args.endDate));
        }
        return conditions.length === 1 ? conditions[0] : q.and(...conditions);
      });
    }

    const weights = await query.order("desc").take(args.limit ?? 100);
    return weights;
  },
});

export const updateWeight = mutation({
  args: {
    id: v.id("weightEntries"),
    weight: v.optional(v.number()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    note: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const entry = await ctx.db.get(args.id);
    if (!entry || entry.userId !== user._id) {
      throw new Error("Entry not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      weight: args.weight,
      date: args.date,
      time: args.time,
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
      throw new Error("Entry not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

// ============================================
// WEIGHT GOALS
// ============================================

export const setWeightGoal = mutation({
  args: {
    goalType: v.union(v.literal("loss"), v.literal("gain"), v.literal("maintenance")),
    targetWeight: v.number(),
    startWeight: v.number(),
    startDate: v.string(),
    targetDate: v.optional(v.string()),
    weeklyRate: v.optional(v.number()),
    acceptableVariance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    // Deactivate existing goals
    const existingGoals = await ctx.db
      .query("weightGoals")
      .withIndex("byActive", (q) => q.eq("userId", user._id).eq("isActive", true))
      .collect();

    for (const goal of existingGoals) {
      await ctx.db.patch(goal._id, { isActive: false });
    }

    // Create new goal
    await ctx.db.insert("weightGoals", {
      userId: user._id,
      ...args,
      isActive: true,
    });
  },
});

export const getWeightGoal = query({
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    return await ctx.db
      .query("weightGoals")
      .withIndex("byActive", (q) => q.eq("userId", user._id).eq("isActive", true))
      .first();
  },
});

export const archiveWeightGoal = mutation({
  args: {
    id: v.id("weightGoals"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== user._id) {
      throw new Error("Goal not found or unauthorized");
    }

    await ctx.db.patch(args.id, { isActive: false });
  },
});

// ============================================
// WEIGHT STATS & ANALYTICS
// ============================================

export const getWeightStats = query({
  args: {
    period: v.optional(v.union(v.literal("1w"), v.literal("1m"), v.literal("3m"), v.literal("6m"), v.literal("1y"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    const period = args.period || "3m";
    const endDate = new Date();
    const startDate = new Date(endDate);
    
    switch (period) {
      case "1w": startDate.setDate(startDate.getDate() - 7); break;
      case "1m": startDate.setMonth(startDate.getMonth() - 1); break;
      case "3m": startDate.setMonth(startDate.getMonth() - 3); break;
      case "6m": startDate.setMonth(startDate.getMonth() - 6); break;
      case "1y": startDate.setFullYear(startDate.getFullYear() - 1); break;
      case "all": startDate.setFullYear(2000); break;
    }

    const entries = await ctx.db
      .query("weightEntries")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("date"), formatDate(startDate)))
      .order("asc")
      .collect();

    if (entries.length === 0) {
      return null;
    }

    const weights = entries.map((e) => e.weight);
    const movingAvg = calculateMovingAverage(entries, 7);
    const trend = calculateTrend(entries);

    // Calculate weekly change
    const weeklyChange = trend.weeklyChange;

    // Calculate change from start of period
    const startWeight = entries[0].weight;
    const currentWeight = entries[entries.length - 1].weight;
    const totalChange = currentWeight - startWeight;

    // Calculate min/max
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    // Calculate average
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

    // Calculate consistency (% of days with entries)
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const consistency = Math.round((entries.length / daysInPeriod) * 100);

    // Calculate streak
    let streak = 0;
    const today = formatDate(new Date());
    let checkDate = today;
    const entryDates = new Set(entries.map((e) => e.date));

    while (entryDates.has(checkDate)) {
      streak++;
      const prevDate = new Date(checkDate);
      prevDate.setDate(prevDate.getDate() - 1);
      checkDate = formatDate(prevDate);
    }

    return {
      currentWeight,
      startWeight,
      totalChange,
      weeklyChange: Math.round(weeklyChange * 10) / 10,
      minWeight,
      maxWeight,
      avgWeight: Math.round(avgWeight * 10) / 10,
      consistency,
      streak,
      entries: entries.length,
      movingAverage: movingAvg[movingAvg.length - 1],
    };
  },
});

export const getWeightChartData = query({
  args: {
    period: v.optional(v.union(v.literal("1w"), v.literal("1m"), v.literal("3m"), v.literal("6m"), v.literal("1y"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return [];

    const period = args.period || "3m";
    const endDate = new Date();
    const startDate = new Date(endDate);
    
    switch (period) {
      case "1w": startDate.setDate(startDate.getDate() - 7); break;
      case "1m": startDate.setMonth(startDate.getMonth() - 1); break;
      case "3m": startDate.setMonth(startDate.getMonth() - 3); break;
      case "6m": startDate.setMonth(startDate.getMonth() - 6); break;
      case "1y": startDate.setFullYear(startDate.getFullYear() - 1); break;
      case "all": startDate.setFullYear(2000); break;
    }

    const entries = await ctx.db
      .query("weightEntries")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("date"), formatDate(startDate)))
      .order("asc")
      .collect();

    // Calculate 7-day moving average
    const movingAvg = calculateMovingAverage(entries, 7);

    return entries.map((entry, index) => ({
      date: entry.date,
      weight: entry.weight,
      movingAverage: movingAvg[index],
      note: entry.note,
      photoUrl: entry.photoUrl,
    }));
  },
});

// ============================================
// WEIGHT INSIGHTS
// ============================================

async function generateWeightInsights(ctx: any, userId: string) {
  // Get recent entries
  const recentEntries = await ctx.db
    .query("weightEntries")
    .withIndex("byUserId", (q: any) => q.eq("userId", userId))
    .order("desc")
    .take(30);

  if (recentEntries.length < 2) return;

  const currentWeight = recentEntries[0].weight;
  const previousWeight = recentEntries[1].weight;
  const goal = await ctx.db
    .query("weightGoals")
    .withIndex("byActive", (q: any) => q.eq("userId", userId).eq("isActive", true))
    .first();

  // Check for new low/high
  const allTimeLow = Math.min(...recentEntries.map((e: any) => e.weight));
  const allTimeHigh = Math.max(...recentEntries.map((e: any) => e.weight));

  if (currentWeight === allTimeLow && currentWeight < previousWeight) {
    // Check if insight already exists for today
    const today = formatDate(new Date());
    const existingInsight = await ctx.db
      .query("weightInsights")
      .withIndex("byUserId", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.eq(q.field("date"), today))
      .filter((q: any) => q.eq(q.field("type"), "milestone"))
      .first();

    if (!existingInsight) {
      await ctx.db.insert("weightInsights", {
        userId,
        type: "milestone",
        title: "New Low Weight!",
        description: `You've reached ${currentWeight.toFixed(1)} lbs, a new personal low!`,
        severity: "success",
        date: today,
        isRead: false,
      });
    }
  }

  // Check goal progress
  if (goal) {
    const progress = ((goal.startWeight - currentWeight) / (goal.startWeight - goal.targetWeight)) * 100;
    if (progress >= 100 && !goal.targetDate) {
      const today = formatDate(new Date());
      await ctx.db.insert("weightInsights", {
        userId,
        type: "achievement",
        title: "Goal Achieved!",
        description: `Congratulations! You've reached your target weight of ${goal.targetWeight} lbs!`,
        severity: "success",
        date: today,
        isRead: false,
      });
    }
  }
}

export const getWeightInsights = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return [];

    let query = ctx.db
      .query("weightInsights")
      .withIndex("byUserId", (q) => q.eq("userId", user._id));

    if (args.unreadOnly) {
      query = query.filter((q) => q.eq(q.field("isRead"), false));
    }

    const insights = await query.order("desc").take(args.limit ?? 10);
    return insights;
  },
});

export const markInsightRead = mutation({
  args: {
    id: v.id("weightInsights"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Unauthenticated");

    const insight = await ctx.db.get(args.id);
    if (!insight || insight.userId !== user._id) {
      throw new Error("Insight not found or unauthorized");
    }

    await ctx.db.patch(args.id, { isRead: true });
  },
});

// ============================================
// EXPORT
// ============================================

export const exportWeightData = query({
  args: {
    format: v.optional(v.union(v.literal("csv"), v.literal("json"))),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) return null;

    const entries = await ctx.db
      .query("weightEntries")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const format = args.format || "csv";

    if (format === "csv") {
      const headers = "Date,Weight,Note\n";
      const rows = entries.map((e) => `${e.date},${e.weight},${e.note || ""}`).join("\n");
      return headers + rows;
    } else {
      return JSON.stringify(entries, null, 2);
    }
  },
});
