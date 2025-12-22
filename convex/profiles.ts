import type { Profile } from "../src/lib/types";
import { authComponent } from "./auth";

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

const profileUpsertValidator = v.object({
  name: v.optional(profileFieldsValidator.name),
  gender: profileFieldsValidator.gender,
  profilePicture: profileFieldsValidator.profilePicture,
  fitnessLevel: profileFieldsValidator.fitnessLevel,
  notificationsEnabled: v.optional(profileFieldsValidator.notificationsEnabled),
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
    try {
      const user = await authComponent.getAuthUser(ctx);
      if (!user) {
        return [];
      }
      const docs = await ctx.db
        .query("profiles")
        .withIndex("byUserId", (q) => q.eq("userId", user._id))
        .collect();
      return docs.map(mapProfile);
    } catch (error) {
      return [];
    }
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
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const insertedId = await ctx.db.insert("profiles", {
      ...args,
      userId: user._id,
    });
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
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Profile not found");
    }
    if (existing.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updates = sanitizeUpdates(args.updates as Partial<ProfileDoc>);
    await ctx.db.patch(args.id, updates);
    const updated = (await ctx.db.get(args.id)) as ProfileDoc;
    return mapProfile(updated);
  },
});

/**
 * Create or update the current user's profile.
 *
 * - Seeds name/email/image from the auth provider on first save.
 * - Keeps provider email in sync.
 * - Backfills provider image if a profile exists but is missing profilePicture.
 */
export const upsertCurrentProfile = mutation({
  args: {
    updates: profileUpsertValidator,
  },
  handler: async (ctx, args): Promise<Profile> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .first();

    const providerName =
      (user.name && user.name.trim()) ||
      (user.email && user.email.trim()) ||
      "User";
    const providerEmail = user.email;
    const providerImage = user.image ?? undefined;

    const rawUpdates = args.updates as Partial<ProfileDoc>;
    const normalizedName =
      typeof rawUpdates.name === "string" ? rawUpdates.name.trim() : undefined;
    const updates = sanitizeUpdates({
      ...rawUpdates,
      name: normalizedName || undefined,
    });

    if (!existing) {
      const now = new Date().toISOString();
      const insertedId = await ctx.db.insert("profiles", {
        userId: user._id,
        name: updates.name ?? providerName,
        email: providerEmail,
        gender: updates.gender,
        profilePicture: updates.profilePicture ?? providerImage,
        fitnessLevel: updates.fitnessLevel,
        notificationsEnabled: updates.notificationsEnabled ?? true,
        createdAt: now,
      });

      const doc = (await ctx.db.get(insertedId)) as ProfileDoc;
      return mapProfile(doc);
    }

    if (existing.email !== providerEmail) {
      updates.email = providerEmail;
    }

    if (!existing.profilePicture && providerImage) {
      updates.profilePicture = updates.profilePicture ?? providerImage;
    }

    await ctx.db.patch(existing._id, updates);
    const updated = (await ctx.db.get(existing._id)) as ProfileDoc;
    return mapProfile(updated);
  },
});

export const deleteProfile = mutation({
  args: { id: v.id("profiles") },
  handler: async (ctx, args): Promise<Id<"profiles">> => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Profile not found");
    }
    if (existing.userId !== user._id) {
      throw new Error("Unauthorized");
    }
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
    try {
      const user = await authComponent.getAuthUser(ctx);
      if (!user) {
        return null;
      }
      const doc = await ctx.db
        .query("profiles")
        .withIndex("byUserId", (q) => q.eq("userId", user._id))
        .first();
      return doc ? mapProfile(doc) : null;
    } catch (error) {
      return null;
    }
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return await ctx.storage.generateUploadUrl();
});

export const getStorageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as Id<"_storage">);
  },
});
