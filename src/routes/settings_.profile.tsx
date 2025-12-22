import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";
import {
  useCurrentProfile,
  useUpsertCurrentProfile,
} from "@/lib/convex/hooks";
import type { FitnessLevel, Gender } from "@/lib/types";
import {
  getProfileFormDefaults,
  type ProfileFormValues,
} from "@/lib/profile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/settings_/profile")({
  component: ProfileDetailsPage,
});

function ProfileDetailsPage() {
  const navigate = useNavigate();
  const { data: sessionData, isPending: isAuthPending, error } =
    authClient.useSession();
  const session = sessionData?.session ?? null;
  const authUser = sessionData?.user ?? null;

  const { profile, isLoading: isProfileLoading } = useCurrentProfile({
    enabled: !!session,
  });
  const { upsertCurrentProfile } = useUpsertCurrentProfile();

  const [form, setForm] = useState<ProfileFormValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const readyToInit = !!session && !!authUser && !isProfileLoading;

  useEffect(() => {
    if (!readyToInit) return;
    if (form) return;
    setForm(getProfileFormDefaults(profile, authUser));
  }, [authUser, form, profile, readyToInit]);

  const inputBaseClasses =
    "dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  const setField = <K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  };

  const canSubmit = useMemo(() => {
    if (!form) return false;
    return !!form.name.trim() && !!form.email.trim();
  }, [form]);

  const handleSave = async () => {
    if (!form) return;
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const saved = await upsertCurrentProfile({
        updates: {
          name: form.name,
          gender: form.gender,
          profilePicture: form.profilePicture?.trim()
            ? form.profilePicture.trim()
            : undefined,
          fitnessLevel: form.fitnessLevel,
          notificationsEnabled: form.notificationsEnabled,
        },
      });

      setForm(getProfileFormDefaults(saved, authUser));
      setStatusMessage("Saved.");
    } catch (err: any) {
      setStatusMessage(err?.message ?? "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-black px-4 py-6 min-h-screen text-white flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-300">You need to be signed in.</p>
        <Link to="/login">
          <Button size="lg" className="font-semibold">
            Go to login
          </Button>
        </Link>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24 min-h-screen text-white">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate({ to: "/settings" })}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          Back
        </button>
        <Link to="/settings" className="text-sm text-zinc-500 hover:text-white">
          Settings
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Profile details</h1>
      <p className="text-sm text-zinc-400 mt-1">
        Your profile is stored in Nyx so you can override provider defaults
        safely.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-linear-to-tr from-purple-500 to-blue-500 overflow-hidden">
            {form.profilePicture ? (
              <img
                src={form.profilePicture}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{form.name}</div>
            <div className="text-sm text-zinc-400 truncate">{form.email}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Name</label>
          <Input
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Your display name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Email (from provider)</label>
          <Input value={form.email} disabled />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Profile picture URL</label>
          <Input
            value={form.profilePicture ?? ""}
            onChange={(e) => setField("profilePicture", e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-zinc-500">
            If you leave this blank, we’ll keep your provider image when saving
            for the first time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Gender</label>
            <select
              className={cn(inputBaseClasses, "text-white")}
              value={form.gender ?? ""}
              onChange={(e) =>
                setField(
                  "gender",
                  (e.target.value || undefined) as Gender | undefined,
                )
              }
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Fitness level</label>
            <select
              className={cn(inputBaseClasses, "text-white")}
              value={form.fitnessLevel ?? ""}
              onChange={(e) =>
                setField(
                  "fitnessLevel",
                  (e.target.value || undefined) as FitnessLevel | undefined,
                )
              }
            >
              <option value="">Not set</option>
              <option value="beginner">Beginner</option>
              <option value="intermediary">Intermediary</option>
              <option value="advanced">Advanced</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <input
            type="checkbox"
            className="h-4 w-4 accent-purple-500"
            checked={form.notificationsEnabled}
            onChange={(e) => setField("notificationsEnabled", e.target.checked)}
          />
          <div className="flex-1">
            <div className="font-medium">Notifications</div>
            <div className="text-sm text-zinc-400">
              Enable workout reminders and updates.
            </div>
          </div>
        </label>

        {statusMessage ? (
          <p
            className={cn(
              "text-sm",
              statusMessage === "Saved." ? "text-emerald-300" : "text-red-300",
            )}
          >
            {statusMessage}
          </p>
        ) : null}

        {error?.message ? (
          <p className="text-xs text-red-300">{error.message}</p>
        ) : null}

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={!canSubmit || isSaving}
            className="flex-1 font-semibold"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/settings" })}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
