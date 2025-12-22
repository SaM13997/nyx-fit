/**
 * Typed Convex hooks for client-side data access
 */
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const useRecentWorkouts = (limit?: number, options?: { enabled?: boolean }) => {
  const workouts = useQuery(
    api.workouts.listRecentWorkouts,
    options?.enabled === false ? "skip" : { limit }
  );
  return {
    workouts: workouts ?? [],
    isLoading: workouts === undefined,
  };
};

export const useWorkouts = (options?: { enabled?: boolean }) => {
  const workouts = useQuery(
    api.workouts.listWorkouts,
    options?.enabled === false ? "skip" : {}
  );
  return {
    workouts: workouts ?? [],
    isLoading: workouts === undefined,
  };
};

export const useActiveWorkout = (options?: { enabled?: boolean }) => {
  const workout = useQuery(
    api.workouts.getActiveWorkout,
    options?.enabled === false ? "skip" : {}
  );
  return {
    activeWorkout: workout ?? null,
    isLoading: workout === undefined,
  };
};

export const useCurrentProfile = (options?: { enabled?: boolean }) => {
  const profile = useQuery(
    api.profiles.getCurrentProfile,
    options?.enabled === false ? "skip" : {}
  );
  return {
    profile,
    isLoading: profile === undefined,
  };
};

export const useUpsertCurrentProfile = () => {
  const upsertCurrentProfile = useMutation(api.profiles.upsertCurrentProfile);
  return {
    upsertCurrentProfile,
  };
};

export const useStartWorkout = () => {
  const startWorkout = useMutation(api.workouts.startWorkout);
  return {
    startWorkout,
  };
};
