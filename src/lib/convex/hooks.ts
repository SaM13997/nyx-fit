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

// ============== Stats Hooks ==============

export const useExerciseStats = (options?: { enabled?: boolean }) => {
  const stats = useQuery(
    api.workoutStats.getExerciseStats,
    options?.enabled === false ? "skip" : {}
  );
  return {
    stats: stats ?? [],
    isLoading: stats === undefined,
  };
};

export const useExerciseStatByName = (
  exerciseName: string,
  options?: { enabled?: boolean }
) => {
  const stat = useQuery(
    api.workoutStats.getExerciseStatByName,
    options?.enabled === false ? "skip" : { exerciseName }
  );
  return {
    stat,
    isLoading: stat === undefined,
  };
};

export const useWorkoutSummary = (options?: { enabled?: boolean }) => {
  const summary = useQuery(
    api.workoutStats.getWorkoutSummary,
    options?.enabled === false ? "skip" : {}
  );
  return {
    summary,
    isLoading: summary === undefined,
  };
};

export const useExerciseProgression = (
  exerciseName: string,
  weeks?: number,
  options?: { enabled?: boolean }
) => {
  const progression = useQuery(
    api.workoutStats.getExerciseProgression,
    options?.enabled === false ? "skip" : { exerciseName, weeks }
  );
  return {
    progression,
    isLoading: progression === undefined,
  };
};

export const useUpdateExerciseStats = () => {
  const updateExerciseStats = useMutation(
    api.workoutStats.updateExerciseStatsOnSet
  );
  return {
    updateExerciseStats,
  };
};

export const useRecalculateStats = () => {
  const recalculateStats = useMutation(api.workoutStats.recalculateAllStats);
  return {
    recalculateStats,
  };
};
