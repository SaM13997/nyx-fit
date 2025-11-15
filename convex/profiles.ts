import type { Profile } from "../src/lib/types";

import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { fitnessLevelValidator, genderValidator } from "./schema";
import { v } from "convex/values";

type ProfileDoc = Doc<"profiles">;

const profileFieldsValidator = {
  name: v.string(),
  email: v.string(),
  gender: v.optional(genderValidator),
  profilePicture: v.optional(v.string()),
  fitnessLevel: v.optional(fitnessLevelValidator),
  notificationsEnabled: v.boolean(),
  createdAt: v.string(),
} as const;

const profileUpdateValidator = v.object({
  name: v.optional(profileFieldsValidator.name),
  email: v.optional(profileFieldsValidator.email),
  gender: profileFieldsValidator.gender,
  profilePicture: profileFieldsValidator.profilePicture,
  fitnessLevel: profileFieldsValidator.fitnessLevel,
  notificationsEnabled: v.optional(
    profileFieldsValidator.notificationsEnabled,
  ),
  createdAt: v.optional(profileFieldsValidator.createdAt),
});

const mapProfile = (doc: ProfileDoc): Profile => {
  const { _id, _creationTime, ...rest } = doc;
  return {
    id: _id,
    ...rest,
  } as Profile;
};

const sanitizeUpdates = (updates: Partial<ProfileDoc>): Partial<ProfileDoc> => {
  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined),
  ) as Partial<ProfileDoc>;
};

export const listProfiles = query({
  args: {},
  handler: async (ctx): Promise<Profile[]> => {
    const docs = await ctx.db.query("profiles").collect();
    return docs.map(mapProfile);
  },
});

export const getProfile = query({
  args: { id: v.id("profiles") },
  handler: async (ctx, args): Promise<Profile | null> => {
    const doc = await ctx.db.get(args.id);
    return doc ? mapProfile(doc) : null;
  },
});

export const createProfile = mutation({
  args: profileFieldsValidator,
  handler: async (ctx, args): Promise<Profile> => {
    const insertedId = await ctx.db.insert("profiles", args);
    const doc = (await ctx.db.get(insertedId)) as ProfileDoc;
    return mapProfile(doc);
  },
});

export const updateProfile = mutation({
  args: {
    id: v.id("profiles"),
    updates: profileUpdateValidator,
  },
  handler: async (ctx, args): Promise<Profile> => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Profile not found");
    }

    const updates = sanitizeUpdates(args.updates as Partial<ProfileDoc>);
    await ctx.db.patch(args.id, updates);
    const updated = (await ctx.db.get(args.id)) as ProfileDoc;
    return mapProfile(updated);
  },
});

export const deleteProfile = mutation({
  args: { id: v.id("profiles") },
  handler: async (ctx, args): Promise<Id<"profiles">> => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Get the current user's profile
 * For now, returns the first profile. In production, this would be filtered by auth.
 */
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx): Promise<Profile | null> => {
    const doc = await ctx.db.query("profiles").first();
    return doc ? mapProfile(doc) : null;
  },
});

