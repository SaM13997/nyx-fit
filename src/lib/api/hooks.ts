import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import type {
  Exercise,
  FitnessLevel,
  Gender,
  Profile,
  WeightEntry,
  WeightUnit,
  Workout,
} from "@/lib/types";
import {
  deleteWeight,
  getActiveWorkout,
  getCurrentProfile,
  getExerciseStats,
  getWeightGoal,
  getWeights,
  getWorkout,
  getWorkoutSummary,
  listWorkouts,
  logWeight,
  startWorkout,
  updateWeight,
  updateWorkout,
  upsertCurrentProfile,
} from "./functions";

const REFETCH_INTERVAL_MS = 60_000;

export type WorkoutUpdates = {
  date?: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  exercises?: Exercise[];
  bodyPartWorkedOut?: string[];
  notes?: string;
};

export type ProfileUpdates = {
  name?: string;
  gender?: Gender;
  profilePicture?: string;
  fitnessLevel?: FitnessLevel;
  notificationsEnabled?: boolean;
  weightUnit?: WeightUnit;
};

export type UpdateWorkoutRequest = {
  id: string;
  revision: number;
  updates: WorkoutUpdates;
};

const apiQueryKeys = {
  user: (userId: string) => ["api", userId] as const,
  profile: (userId: string | null) => ["api", userId, "profile"] as const,
  workoutsRoot: (userId: string | null) => ["api", userId, "workouts"] as const,
  workoutList: (userId: string | null) =>
    ["api", userId, "workouts", "list"] as const,
  activeWorkout: (userId: string | null) =>
    ["api", userId, "workouts", "active"] as const,
  workoutDetail: (userId: string | null, id: string) =>
    ["api", userId, "workouts", "detail", id] as const,
  weightsRoot: (userId: string | null) => ["api", userId, "weights"] as const,
  weightsList: (userId: string | null, limit?: number) =>
    ["api", userId, "weights", "list", limit ?? null] as const,
  weightGoal: (userId: string | null) =>
    ["api", userId, "weights", "goal"] as const,
  statsRoot: (userId: string | null) => ["api", userId, "stats"] as const,
  workoutSummary: (userId: string | null) =>
    ["api", userId, "stats", "summary"] as const,
  exerciseStats: (userId: string | null) =>
    ["api", userId, "stats", "exercises"] as const,
};

const useApiSession = () => {
  const { data, isPending } = authClient.useSession();
  const userId = data?.user?.id ?? null;
  const userIdRef = useRef<string | null>(userId);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  return { userId, isSessionPending: isPending, userIdRef };
};

const useSessionScopedEnabled = (enabled?: boolean) => {
  const { userId, isSessionPending } = useApiSession();
  return {
    userId,
    isSessionPending,
    enabled: enabled !== false && userId !== null,
  };
};

const isPublishableScope = (
  scopedUserId: string | null,
  latestUserId: string | null,
): scopedUserId is string =>
  scopedUserId !== null && scopedUserId === latestUserId;

export const useApiUserCache = () => {
  const queryClient = useQueryClient();
  const { userId } = useApiSession();
  const previousUserIdRef = useRef<string | null>(userId);

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = userId;

    if (previousUserId === null || previousUserId === userId) return;
    queryClient.removeQueries({ queryKey: apiQueryKeys.user(previousUserId) });
  }, [queryClient, userId]);
};

export const useCurrentProfile = (options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useQuery({
    queryKey: apiQueryKeys.profile(userId),
    queryFn: () => getCurrentProfile(),
    enabled,
  });

  return {
    profile: query.data ?? null,
    isLoading: isSessionPending || (enabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useWorkouts = (options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useQuery({
    queryKey: apiQueryKeys.workoutList(userId),
    queryFn: () => listWorkouts(),
    enabled,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  return {
    workouts: query.data ?? [],
    isLoading: isSessionPending || (enabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useWorkout = (id: string, options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const detailEnabled = enabled && id.length > 0;
  const query = useQuery({
    queryKey: apiQueryKeys.workoutDetail(userId, id),
    queryFn: () => getWorkout({ data: { id } }),
    enabled: detailEnabled,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  return {
    workout: query.data ?? null,
    isLoading: isSessionPending || (detailEnabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useActiveWorkout = (options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useQuery({
    queryKey: apiQueryKeys.activeWorkout(userId),
    queryFn: () => getActiveWorkout(),
    enabled,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  return {
    activeWorkout: query.data ?? null,
    isLoading: isSessionPending || (enabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useWeights = (
  limit?: number,
  options?: { enabled?: boolean },
) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useQuery({
    queryKey: apiQueryKeys.weightsList(userId, limit),
    queryFn: () => getWeights({ data: { limit } }),
    enabled,
  });

  return {
    weights: query.data ?? [],
    isLoading: isSessionPending || (enabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useWeightGoal = (options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useQuery({
    queryKey: apiQueryKeys.weightGoal(userId),
    queryFn: () => getWeightGoal(),
    enabled,
  });

  return {
    goal: query.data ?? null,
    isLoading: isSessionPending || (enabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useWorkoutSummary = (options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useQuery({
    queryKey: apiQueryKeys.workoutSummary(userId),
    queryFn: () => getWorkoutSummary(),
    enabled,
  });

  return {
    summary: query.data ?? null,
    isLoading: isSessionPending || (enabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useExerciseStats = (options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useQuery({
    queryKey: apiQueryKeys.exerciseStats(userId),
    queryFn: () => getExerciseStats(),
    enabled,
  });

  return {
    stats: query.data ?? [],
    isLoading: isSessionPending || (enabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useUpsertCurrentProfile = () => {
  const queryClient = useQueryClient();
  const { userIdRef } = useApiSession();

  const mutation = useMutation({
    mutationFn: async (input: { updates: ProfileUpdates }): Promise<Profile> => {
      const scopedUserId = userIdRef.current;
      const profile = await upsertCurrentProfile({ data: input });

      if (isPublishableScope(scopedUserId, userIdRef.current)) {
        await queryClient.cancelQueries({
          queryKey: apiQueryKeys.profile(scopedUserId),
        });
        queryClient.setQueryData(apiQueryKeys.profile(scopedUserId), profile);
        void queryClient.invalidateQueries({
          queryKey: apiQueryKeys.profile(scopedUserId),
        });
      }

      return profile;
    },
  });

  return { upsertCurrentProfile: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useStartWorkout = () => {
  const queryClient = useQueryClient();
  const { userIdRef } = useApiSession();

  const mutation = useMutation({
    mutationFn: async (input: {
      bodyPartWorkedOut?: string[];
    }): Promise<Workout> => {
      const scopedUserId = userIdRef.current;
      const workout = await startWorkout({ data: input });

      if (isPublishableScope(scopedUserId, userIdRef.current)) {
        await queryClient.cancelQueries({
          queryKey: apiQueryKeys.activeWorkout(scopedUserId),
        });
        queryClient.setQueryData(
          apiQueryKeys.workoutDetail(scopedUserId, workout.id),
          workout,
        );
        queryClient.setQueryData(
          apiQueryKeys.activeWorkout(scopedUserId),
          workout,
        );
        void queryClient.invalidateQueries({
          queryKey: apiQueryKeys.workoutList(scopedUserId),
        });
        void queryClient.invalidateQueries({
          queryKey: apiQueryKeys.statsRoot(scopedUserId),
        });
      }

      return workout;
    },
  });

  return { startWorkout: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();
  const { userIdRef } = useApiSession();

  const mutation = useMutation({
    mutationFn: async (input: UpdateWorkoutRequest) => {
      const scopedUserId = userIdRef.current;
      const result = await updateWorkout({ data: input });

      if (isPublishableScope(scopedUserId, userIdRef.current)) {
        if (result.ok) {
          await queryClient.cancelQueries({
            queryKey: apiQueryKeys.workoutDetail(
              scopedUserId,
              result.workout.id,
            ),
          });
          await queryClient.cancelQueries({
            queryKey: apiQueryKeys.activeWorkout(scopedUserId),
          });
          queryClient.setQueryData(
            apiQueryKeys.workoutDetail(scopedUserId, result.workout.id),
            result.workout,
          );

          if (result.workout.isActive === true) {
            queryClient.setQueryData(
              apiQueryKeys.activeWorkout(scopedUserId),
              result.workout,
            );
          } else if (input.updates.isActive === false) {
            queryClient.setQueryData(
              apiQueryKeys.activeWorkout(scopedUserId),
              null,
            );
          } else {
            void queryClient.invalidateQueries({
              queryKey: apiQueryKeys.activeWorkout(scopedUserId),
            });
          }

          void queryClient.invalidateQueries({
            queryKey: apiQueryKeys.workoutList(scopedUserId),
          });
          void queryClient.invalidateQueries({
            queryKey: apiQueryKeys.statsRoot(scopedUserId),
          });
        } else {
          void queryClient.invalidateQueries({
            queryKey: apiQueryKeys.workoutsRoot(scopedUserId),
          });
          void queryClient.invalidateQueries({
            queryKey: apiQueryKeys.statsRoot(scopedUserId),
          });
        }
      }

      return result;
    },
  });

  return { updateWorkout: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useLogWeight = () => {
  const queryClient = useQueryClient();
  const { userIdRef } = useApiSession();

  const mutation = useMutation({
    mutationFn: async (input: {
      date: string;
      weight: number;
      note?: string;
      photoUrl?: string;
    }): Promise<WeightEntry> => {
      const scopedUserId = userIdRef.current;
      const entry = await logWeight({ data: input });

      if (isPublishableScope(scopedUserId, userIdRef.current)) {
        void queryClient.invalidateQueries({
          queryKey: apiQueryKeys.weightsRoot(scopedUserId),
        });
      }

      return entry;
    },
  });

  return { logWeight: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useUpdateWeight = () => {
  const queryClient = useQueryClient();
  const { userIdRef } = useApiSession();

  const mutation = useMutation({
    mutationFn: async (input: {
      id: string;
      weight?: number;
      date?: string;
      note?: string;
      photoUrl?: string;
    }): Promise<WeightEntry> => {
      const scopedUserId = userIdRef.current;
      const entry = await updateWeight({ data: input });

      if (isPublishableScope(scopedUserId, userIdRef.current)) {
        void queryClient.invalidateQueries({
          queryKey: apiQueryKeys.weightsRoot(scopedUserId),
        });
      }

      return entry;
    },
  });

  return { updateWeight: mutation.mutateAsync, isPending: mutation.isPending };
};

export const useDeleteWeight = () => {
  const queryClient = useQueryClient();
  const { userIdRef } = useApiSession();

  const mutation = useMutation({
    mutationFn: async (input: { id: string }): Promise<{ id: string }> => {
      const scopedUserId = userIdRef.current;
      const result = await deleteWeight({ data: input });

      if (isPublishableScope(scopedUserId, userIdRef.current)) {
        void queryClient.invalidateQueries({
          queryKey: apiQueryKeys.weightsRoot(scopedUserId),
        });
      }

      return result;
    },
  });

  return { deleteWeight: mutation.mutateAsync, isPending: mutation.isPending };
};
