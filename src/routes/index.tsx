import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { parseRedirectParam } from "@/lib/redirect";
import {
  useActiveWorkout,
  useCurrentProfile,
  useStartWorkout,
  useWorkouts,
} from "@/lib/api/hooks";
import { getEffectiveProfile } from "@/lib/profile";
import { HomeHeader } from "@/components/home/HomeHeader";
import { WeeklyAttendance } from "@/components/home/WeeklyAttendance";
import { QuickActions } from "@/components/home/QuickActions";
import { WorkoutStatusCard } from "@/components/home/WorkoutStatusCard";

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
    workouts: allWorkouts,
    isLoading: isLoadingAllWorkouts,
    isError: isWorkoutsError,
    refetch: refetchWorkouts,
  } = useWorkouts({
    enabled: !!session,
  });
  const {
    activeWorkout,
    isLoading: isLoadingActiveWorkout,
    isError: isActiveWorkoutError,
    refetch: refetchActiveWorkout,
  } = useActiveWorkout({
    enabled: !!session,
  });
  const { profile } = useCurrentProfile({
    enabled: !!session,
  });
  const { startWorkout } = useStartWorkout();
  const effectiveProfile = getEffectiveProfile(profile, sessionData?.user);

  const [isStarting, setIsStarting] = useState(false);

  const handleStartWorkout = async (bodyParts: string[]) => {
    try {
      setIsStarting(true);
      await startWorkout({ bodyPartWorkedOut: bodyParts });
    } catch (error) {
      console.error("Failed to start workout:", error);
      setIsStarting(false);
    }
  };

  if (isAuthPending || !session) {
    return (
      <div className="theme-lumen flex min-h-screen items-center justify-center bg-lm-bg">
        <p role="status" className="text-[16px] leading-6 text-lm-ink-soft">
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-clip px-4 py-6 pb-24 min-h-screen text-white">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn("flex flex-col gap-6")}
      >
        <HomeHeader
          userName={effectiveProfile.name}
          email={effectiveProfile.email}
          profilePicture={effectiveProfile.profilePicture}
        />
        {isWorkoutsError || isActiveWorkoutError ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2">
            <p className="text-sm text-red-200">
              Couldn&apos;t load your workout data.
            </p>
            <button
              type="button"
              onClick={() => {
                if (isWorkoutsError) void refetchWorkouts();
                if (isActiveWorkoutError) void refetchActiveWorkout();
              }}
              className="min-h-11 shrink-0 rounded-xl border border-red-500/30 px-4 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/10"
            >
              Try again
            </button>
          </div>
        ) : null}
        <WeeklyAttendance
          workouts={allWorkouts}
          isLoading={isLoadingAllWorkouts}
        />
        <WorkoutStatusCard
          activeWorkout={activeWorkout}
          isLoading={isLoadingActiveWorkout}
          isStarting={isStarting}
          onStartWorkout={handleStartWorkout}
        />
        <QuickActions />
        {/* <RecentWorkoutsList
          workouts={workouts}
          isLoading={isLoadingWorkouts}
        /> */}
      </motion.div>
    </div>
  );
}
