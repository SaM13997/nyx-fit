import type { Profile } from "@/lib/types";

export type AuthUserLike = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type EffectiveProfile = {
  name: string;
  email: string;
  profilePicture?: string;
  source: "profile" | "auth";
};

export type ProfileFormValues = {
  name: string;
  email: string;
  profilePicture?: string;
  gender?: Profile["gender"];
  fitnessLevel?: Profile["fitnessLevel"];
  notificationsEnabled: boolean;
};

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function getEffectiveProfile(
  profile: Profile | null | undefined,
  authUser: AuthUserLike | null | undefined,
): EffectiveProfile {
  const authName = normalizeString(authUser?.name);
  const authEmail = normalizeString(authUser?.email);
  const authImage = normalizeString(authUser?.image);

  const name = profile?.name ?? authName ?? authEmail ?? "User";
  const email = profile?.email ?? authEmail ?? "";
  const profilePicture = profile?.profilePicture ?? authImage ?? undefined;

  return {
    name,
    email,
    profilePicture,
    source: profile ? "profile" : "auth",
  };
}

export function getProfileFormDefaults(
  profile: Profile | null | undefined,
  authUser: AuthUserLike | null | undefined,
): ProfileFormValues {
  const effective = getEffectiveProfile(profile, authUser);

  return {
    name: effective.name,
    email: effective.email,
    profilePicture: effective.profilePicture,
    gender: profile?.gender,
    fitnessLevel: profile?.fitnessLevel,
    notificationsEnabled: profile?.notificationsEnabled ?? true,
  };
}
