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

export const useUploadUrl = () => {
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  return {
    generateUploadUrl,
  };
};

export const useStorageUrl = (storageId?: string) => {
  const url = useQuery(
    api.profiles.getStorageUrl,
    storageId ? { storageId } : "skip"
  );
  return {
    url,
    isLoading: storageId ? url === undefined : false,
  };
};

export const useStartWorkout = () => {
  const startWorkout = useMutation(api.workouts.startWorkout);
  return {
    startWorkout,
  };
};

export const useWeights = (limit?: number, options?: { enabled?: boolean }) => {
  const weights = useQuery(
    api.weights.getWeights,
    options?.enabled === false ? "skip" : { limit }
  );
  return {
    weights: weights ?? [],
    isLoading: weights === undefined,
  };
};

export const useLogWeight = () => {
  const logWeight = useMutation(api.weights.logWeight);
  return {
    logWeight,
  };
};

export const useUpdateWeight = () => {
  const updateWeight = useMutation(api.weights.updateWeight);
  return {
    updateWeight,
  };
};

export const useDeleteWeight = () => {
  const deleteWeight = useMutation(api.weights.deleteWeight);
  return {
    deleteWeight,
  };
};

export const useWeightGoal = (options?: { enabled?: boolean }) => {
  const goal = useQuery(
    api.weights.getWeightGoal,
    options?.enabled === false ? "skip" : {}
  );
  return {
    goal,
    isLoading: goal === undefined,
  };
};

export const useSetWeightGoal = () => {
  const setWeightGoal = useMutation(api.weights.setWeightGoal);
  return {
    setWeightGoal,
  };
};
