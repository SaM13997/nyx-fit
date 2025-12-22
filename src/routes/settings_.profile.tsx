import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useConvex } from "convex/react";

import { authClient } from "@/lib/auth-client";
import {
  useCurrentProfile,
  useUpsertCurrentProfile,
  useUploadUrl,
} from "@/lib/convex/hooks";
import { api } from "../../convex/_generated/api";
import type { FitnessLevel, Gender } from "@/lib/types";
import { getProfileFormDefaults, type ProfileFormValues } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Camera, Loader2, Save, User, Mail } from "lucide-react";
import { useToast } from "@/lib/toast";

export const Route = createFileRoute("/settings_/profile")({
  component: ProfileDetailsPage,
});

function ProfileDetailsPage() {
  const navigate = useNavigate();
  const convex = useConvex();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  const { data: sessionData, isPending: isAuthPending } =
    authClient.useSession();
  const session = sessionData?.session ?? null;
  const authUser = sessionData?.user ?? null;

  const { profile, isLoading: isProfileLoading } = useCurrentProfile({
    enabled: !!session,
  });
  const { upsertCurrentProfile } = useUpsertCurrentProfile();
  const { generateUploadUrl } = useUploadUrl();

  const [form, setForm] = useState<ProfileFormValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const readyToInit = !!session && !!authUser && !isProfileLoading;

  useEffect(() => {
    if (!readyToInit) return;
    if (form) return;
    setForm(getProfileFormDefaults(profile, authUser));
  }, [authUser, form, profile, readyToInit]);

  const inputBaseClasses =
    "dark:bg-white/5 border-white/10 h-11 w-full min-w-0 rounded-xl border bg-transparent px-4 py-2 text-base shadow-sm transition-all outline-none focus-visible:border-purple-500 focus-visible:ring-1 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-white placeholder:text-zinc-500";

  const setField = <K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K]
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl();

      // 2. Upload the file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();

      // 3. Get the public URL for the storage ID
      const publicUrl = await convex.query(api.profiles.getStorageUrl, {
        storageId,
      });

      if (publicUrl) {
        setField("profilePicture", publicUrl);
        success("Profile picture updated");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toastError(err?.message ?? "Failed to upload image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const canSubmit = useMemo(() => {
    if (!form) return false;
    return !!form.name.trim() && !!form.email.trim();
  }, [form]);

  const handleSave = async () => {
    if (!form) return;
    setIsSaving(true);

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
      success("Profile settings saved successfully");
    } catch (err: any) {
      toastError(err?.message ?? "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-black px-4 py-6 min-h-screen text-white flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-300">You need to be signed in.</p>
        <Link to="/login">
          <Button
            size="lg"
            className="font-semibold rounded-xl bg-purple-600 hover:bg-purple-500"
          >
            Go to login
          </Button>
        </Link>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 z-0 bg-black pointer-events-none">
        <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-purple-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-3/4 h-3/4 bg-blue-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 px-4 py-6 max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate({ to: "/settings" })}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
            Profile Details
          </h1>
        </div>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white/5 bg-zinc-900 shadow-2xl relative">
                {form.profilePicture ? (
                  <img
                    src={form.profilePicture}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-zinc-500 text-4xl font-bold">
                    {form.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}

                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                  <span className="text-xs font-medium text-white/90">
                    Change
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-1 right-1 h-10 w-10 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-black transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              Tap the camera icon to upload a new photo
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">
                Display Name
              </label>
              <div className="relative">
                <Input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Your display name"
                  className={cn(inputBaseClasses, "pl-11")}
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Input
                  value={form.email}
                  disabled
                  className={cn(inputBaseClasses, "pl-11 opacity-70")}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">
                  Gender
                </label>
                <select
                  className={cn(inputBaseClasses, "appearance-none")}
                  value={form.gender ?? ""}
                  onChange={(e) =>
                    setField(
                      "gender",
                      (e.target.value || undefined) as Gender | undefined
                    )
                  }
                >
                  <option value="" className="bg-zinc-900">
                    Prefer not to say
                  </option>
                  <option value="male" className="bg-zinc-900">
                    Male
                  </option>
                  <option value="female" className="bg-zinc-900">
                    Female
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">
                  Fitness Level
                </label>
                <select
                  className={cn(inputBaseClasses, "appearance-none")}
                  value={form.fitnessLevel ?? ""}
                  onChange={(e) =>
                    setField(
                      "fitnessLevel",
                      (e.target.value || undefined) as FitnessLevel | undefined
                    )
                  }
                >
                  <option value="" className="bg-zinc-900">
                    Not set
                  </option>
                  <option value="beginner" className="bg-zinc-900">
                    Beginner
                  </option>
                  <option value="intermediary" className="bg-zinc-900">
                    Intermediary
                  </option>
                  <option value="advanced" className="bg-zinc-900">
                    Advanced
                  </option>
                  <option value="pro" className="bg-zinc-900">
                    Pro
                  </option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 mt-2 cursor-pointer transition-colors hover:bg-white/10">
              <input
                type="checkbox"
                className="h-5 w-5 accent-purple-500 rounded-md"
                checked={form.notificationsEnabled}
                onChange={(e) =>
                  setField("notificationsEnabled", e.target.checked)
                }
              />
              <div className="flex-1">
                <div className="font-medium text-white">Notifications</div>
                <div className="text-xs text-zinc-400">
                  Receive workout reminders and weekly updates
                </div>
              </div>
            </label>
          </div>

          <div className="pt-6 flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/settings" })}
              disabled={isSaving}
              className="flex-1 h-12 rounded-xl border-white/10 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSubmit || isSaving}
              className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-900/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
