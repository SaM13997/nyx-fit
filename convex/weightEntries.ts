import type { WeightEntry } from "../src/lib/types";
import { authComponent } from "./auth";

import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

type WeightEntryDoc = Doc<"weightEntries">;

const weightEntryFieldsValidator = {
  date: v.string(),
  weight: v.number(),
  note: v.optional(v.string()),
} as const;

const weightEntryUpdateValidator = v.object({
  date: v.optional(weightEntryFieldsValidator.date),
  weight: v.optional(weightEntryFieldsValidator.weight),
  note: weightEntryFieldsValidator.note,
});

const mapWeightEntry = (doc: WeightEntryDoc): WeightEntry => {
  const { _id, _creationTime, ...rest } = doc;
  return {
    id: _id,
    ...rest,
  } as WeightEntry;
};

const sanitizeUpdates = (
  updates: Partial<WeightEntryDoc>,
): Partial<WeightEntryDoc> => {
  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined),
  ) as Partial<WeightEntryDoc>;
};

export const listWeightEntries = query({
  args: {},
  handler: async (ctx): Promise<WeightEntry[]> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return [];
    }
    const docs = await ctx.db
      .query("weightEntries")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect();
    return docs.map(mapWeightEntry);
  },
});

export const getWeightEntry = query({
  args: { id: v.id("weightEntries") },
  handler: async (ctx, args): Promise<WeightEntry | null> => {
    const doc = await ctx.db.get(args.id);
    return doc ? mapWeightEntry(doc) : null;
  },
});

export const createWeightEntry = mutation({
  args: weightEntryFieldsValidator,
  handler: async (ctx, args): Promise<WeightEntry> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const insertedId = await ctx.db.insert("weightEntries", {
      ...args,
      userId: user._id,
    });
    const doc = (await ctx.db.get(insertedId)) as WeightEntryDoc;
    return mapWeightEntry(doc);
  },
});

export const updateWeightEntry = mutation({
  args: {
    id: v.id("weightEntries"),
    updates: weightEntryUpdateValidator,
  },
  handler: async (ctx, args): Promise<WeightEntry> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Weight entry not found");
    }
    if (existing.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updates = sanitizeUpdates(args.updates as Partial<WeightEntryDoc>);
    await ctx.db.patch(args.id, updates);
    const updated = (await ctx.db.get(args.id)) as WeightEntryDoc;
    return mapWeightEntry(updated);
  },
});

export const deleteWeightEntry = mutation({
  args: { id: v.id("weightEntries") },
  handler: async (ctx, args): Promise<Id<"weightEntries">> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Weight entry not found");
    }
    if (existing.userId !== user._id) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
    return args.id;
  },
});

