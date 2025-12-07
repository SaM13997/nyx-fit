import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import {
  useRecentWorkouts,
  useActiveWorkout,
  useCurrentProfile,
  useStartWorkout,
  useWorkouts,
} from "@/lib/convex/hooks";
import { HomeHeader } from "@/components/home/HomeHeader";
import { RecentWorkoutsList } from "@/components/home/RecentWorkoutsList";
import { WeeklyAttendance } from "@/components/home/WeeklyAttendance";
import { WeeklyAttendanceShowcase } from "@/components/home/WeeklyAttendanceVariations";
import { QuickActions } from "@/components/home/QuickActions";
import { WorkoutStatusCard } from "@/components/home/WorkoutStatusCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { data: sessionData, isPending: isAuthPending } = authClient.useSession();
  const session = sessionData?.session;

  //  const { workouts, isLoading: isLoadingWorkouts } = useRecentWorkouts(5);
  const { workouts: allWorkouts, isLoading: isLoadingAllWorkouts } = useWorkouts();
  const { activeWorkout, isLoading: isLoadingActiveWorkout } = useActiveWorkout();
  const { profile } = useCurrentProfile();
  const { startWorkout } = useStartWorkout();

  const [isStarting, setIsStarting] = useState(false);

  const handleStartWorkout = async () => {
    try {
      setIsStarting(true);
      const newWorkout = await startWorkout();
      // navigate({ to: `/workout/${newWorkout.id}` });
    } catch (error) {
      console.error("Failed to start workout:", error);
      setIsStarting(false);
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
      <div className="bg-black px-4 py-6 min-h-screen text-white flex flex-col items-center justify-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Nyx Fitness
          </h1>
          <p className="text-zinc-400">
            Track your workouts, monitor your progress.
          </p>
        </div>
        <Link to="/login">
          <Button size="lg" className="font-semibold">
            Get Started
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className=" px-4 py-6 min-h-screen text-white ">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn("flex flex-col gap-6")}
      >
        <HomeHeader
          userName={profile?.name ?? sessionData?.user.name ?? "User"}
          profilePicture={profile?.profilePicture ?? sessionData?.user.image ?? undefined}
        />
        {/* <WeeklyAttendance workouts={allWorkouts} isLoading={isLoadingAllWorkouts} /> */}
        <WeeklyAttendanceShowcase workouts={allWorkouts} isLoading={isLoadingAllWorkouts} />
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
