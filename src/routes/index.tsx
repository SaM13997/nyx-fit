import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { parseRedirectParam } from "@/lib/redirect";
import { useCurrentProfile, useHomeSnapshot } from "@/lib/api/hooks";
import { resolveWeeklyGoal } from "@/lib/goals";
import { getEffectiveProfile } from "@/lib/profile";
import { HomeHeader } from "@/components/home/HomeHeader";
import { WeeklyAttendance } from "@/components/home/WeeklyAttendance";
import { QuickActions } from "@/components/home/QuickActions";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search: { redirect?: unknown } = router.state.location.search;
  const redirect = parseRedirectParam(search.redirect);
  const { data: sessionData, isPending: isAuthPending } =
    authClient.useSession();
  const session = sessionData?.session;

  useEffect(() => {
    if (isAuthPending || session) return;
    void navigate({
      to: "/onboarding",
      search: { redirect },
      replace: true,
    });
  }, [isAuthPending, session, navigate, redirect]);

  const {
    snapshot,
    isLoading: isLoadingSnapshot,
    isError: isSnapshotError,
    refetch: refetchSnapshot,
  } = useHomeSnapshot({
    enabled: !!session,
  });
  const { profile } = useCurrentProfile({
    enabled: !!session,
  });
  const effectiveProfile = getEffectiveProfile(profile, sessionData?.user);

  if (isAuthPending || !session) {
    return (
      <div className="theme-flow flex min-h-dvh items-center justify-center bg-flow-bg">
        <p role="status" className="text-[16px] leading-6 text-flow-ink-soft">
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-clip px-4 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
      <div className="flex flex-col gap-6">
        <HomeHeader
          userName={effectiveProfile.name}
          email={effectiveProfile.email}
          profilePicture={effectiveProfile.profilePicture}
        />
        {isSnapshotError && snapshot === null ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2">
            <p className="text-sm text-red-200">
              Couldn&apos;t load your workout data.
            </p>
            <button
              type="button"
              onClick={() => void refetchSnapshot()}
              className="min-h-11 shrink-0 rounded-xl border border-red-500/30 px-4 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/10"
            >
              Try again
            </button>
          </div>
        ) : null}
        <WeeklyAttendance
          workouts={snapshot?.recentWorkouts ?? []}
          goal={
            snapshot?.weeklyWorkoutGoal ??
            resolveWeeklyGoal(profile?.weeklyWorkoutGoal, profile?.fitnessLevel)
          }
          isLoading={isLoadingSnapshot}
        />
        <QuickActions />
        {/* <RecentWorkoutsList
          workouts={workouts}
          isLoading={isLoadingWorkouts}
        /> */}
      </div>
    </div>
  );
}
