/**
 * Typed Convex hooks for client-side data access
 */
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const useRecentWorkouts = (limit?: number) => {
  const workouts = useQuery(api.workouts.listRecentWorkouts, { limit });
  return {
    workouts: workouts ?? [],
    isLoading: workouts === undefined,
  };
};

export const useWorkouts = () => {
  const workouts = useQuery(api.workouts.listWorkouts);
  return {
    workouts: workouts ?? [],
    isLoading: workouts === undefined,
  };
};

export const useActiveWorkout = () => {
  const workout = useQuery(api.workouts.getActiveWorkout);
  return {
    activeWorkout: workout,
    isLoading: workout === undefined,
  };
};

export const useCurrentProfile = () => {
  const profile = useQuery(api.profiles.getCurrentProfile);
  return {
    profile,
    isLoading: profile === undefined,
  };
};

export const useStartWorkout = () => {
  const startWorkout = useMutation(api.workouts.startWorkout);
  return {
    startWorkout,
  };
};
