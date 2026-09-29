import { useEffect, useMemo, useRef } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { getClientTimeZone } from "@/lib/weeks";
import type {
  Exercise,
  FitnessLevel,
  Gender,
  HomeSnapshot,
  Profile,
  WeightEntry,
  WeightUnit,
  Workout,
  WorkoutCursor,
} from "@/lib/types";
import {
  deleteWeight,
  getActiveWorkout,
  getCurrentProfile,
  getExerciseHistory,
  getHomeSnapshot,
  getStatsOverview,
  getWeightGoal,
  getWeights,
  getWorkout,
  listWorkouts,
  logWeight,
  startWorkout,
  updateWeight,
  updateWorkout,
  upsertCurrentProfile,
} from "./functions";

// Snapshot, stats and list data only change when the user completes or edits
// a finished workout (or logs weight), and those mutations invalidate them
// explicitly. There is no polling; staleness only bounds focus refetches.
const AGGREGATE_STALE_MS = 5 * 60_000;
// While a user's rollups rebuild in the background, ask again shortly.
const REBUILD_POLL_MS = 1_500;

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
  weeklyWorkoutGoal?: number;
  timeZone?: string;
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
  homeSnapshot: (userId: string | null) => ["api", userId, "home"] as const,
  statsRoot: (userId: string | null) => ["api", userId, "stats"] as const,
  statsOverview: (userId: string | null) =>
    ["api", userId, "stats", "overview"] as const,
  exerciseHistory: (userId: string | null, exerciseKey: string) =>
    ["api", userId, "stats", "exercise", exerciseKey] as const,
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

// Weekly stats bucket workouts by the lifter's local week, so an existing
// profile without a zone gets the device's zone once per session.
const useTimeZoneSync = () => {
  const { profile } = useCurrentProfile();
  const { userId } = useApiSession();
  const { upsertCurrentProfile } = useUpsertCurrentProfile();
  const syncedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (userId === null || profile === null || profile.timeZone !== undefined) return;
    if (syncedForRef.current === userId) return;
    const timeZone = getClientTimeZone();
    if (timeZone === undefined) return;
    syncedForRef.current = userId;
    upsertCurrentProfile({ updates: { timeZone } }).catch(() => {
      // Try again on the next mount; stats stay on UTC weeks meanwhile.
      syncedForRef.current = null;
    });
  }, [profile, userId, upsertCurrentProfile]);
};

export const useApiUserCache = () => {
  const queryClient = useQueryClient();
  const { userId } = useApiSession();
  const previousUserIdRef = useRef<string | null>(userId);
  useTimeZoneSync();

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

const firstPageParam = (): WorkoutCursor | undefined => undefined;

// Newest-first workout history, one cursor page at a time.
export const useWorkouts = (options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useInfiniteQuery({
    queryKey: apiQueryKeys.workoutList(userId),
    queryFn: ({ pageParam }) =>
      listWorkouts({ data: pageParam === undefined ? {} : { cursor: pageParam } }),
    initialPageParam: firstPageParam(),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: AGGREGATE_STALE_MS,
  });
  const workouts = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  return {
    workouts,
    isLoading: isSessionPending || (enabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};

export const useWorkout = (id: string, options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const queryClient = useQueryClient();
  const detailEnabled = enabled && id.length > 0;

  // Start from a full copy already in the active or home-snapshot caches so
  // opening that workout renders on the first frame. (The paginated list
  // only holds summaries, which cannot seed the detail view.)
  const findCachedWorkout = () => {
    const active = queryClient.getQueryState<Workout | null>(
      apiQueryKeys.activeWorkout(userId),
    );
    if (active?.data?.id === id) return active;
    const snapshot = queryClient.getQueryState<HomeSnapshot>(
      apiQueryKeys.homeSnapshot(userId),
    );
    const latest = snapshot?.data?.latestWorkout?.workout;
    return latest?.id === id && snapshot
      ? { data: latest, dataUpdatedAt: snapshot.dataUpdatedAt }
      : undefined;
  };

  const query = useQuery({
    queryKey: apiQueryKeys.workoutDetail(userId, id),
    queryFn: () => getWorkout({ data: { id } }),
    initialData: () => findCachedWorkout()?.data ?? undefined,
    initialDataUpdatedAt: () => findCachedWorkout()?.dataUpdatedAt,
    enabled: detailEnabled,
  });

  return {
    workout: query.data ?? null,
    isLoading: isSessionPending || (detailEnabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

// Refetches on focus and reconnect (so a workout edited on another device
// shows up) but never on a timer.
export const useActiveWorkout = (options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useQuery({
    queryKey: apiQueryKeys.activeWorkout(userId),
    queryFn: () => getActiveWorkout(),
    enabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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

export const useHomeSnapshot = (options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useQuery({
    queryKey: apiQueryKeys.homeSnapshot(userId),
    queryFn: () => getHomeSnapshot(),
    enabled,
    staleTime: AGGREGATE_STALE_MS,
    refetchInterval: (state) =>
      state.state.data?.status === "rebuilding" ? REBUILD_POLL_MS : false,
  });

  return {
    snapshot: query.data ?? null,
    isLoading: isSessionPending || (enabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useStatsOverview = (options?: { enabled?: boolean }) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const query = useQuery({
    queryKey: apiQueryKeys.statsOverview(userId),
    queryFn: () => getStatsOverview(),
    enabled,
    staleTime: AGGREGATE_STALE_MS,
    refetchInterval: (state) =>
      state.state.data?.status === "rebuilding" ? REBUILD_POLL_MS : false,
  });

  return {
    overview: query.data ?? null,
    isLoading: isSessionPending || (enabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

// Weekly history for one exercise; only fetched once a chart asks for it.
export const useExerciseHistory = (
  exerciseKey: string | null,
  options?: { enabled?: boolean },
) => {
  const { userId, isSessionPending, enabled } = useSessionScopedEnabled(
    options?.enabled,
  );
  const historyEnabled = enabled && exerciseKey !== null;
  const query = useQuery({
    queryKey: apiQueryKeys.exerciseHistory(userId, exerciseKey ?? ""),
    queryFn: () => getExerciseHistory({ data: { exerciseKey: exerciseKey ?? "" } }),
    enabled: historyEnabled,
    staleTime: AGGREGATE_STALE_MS,
  });

  return {
    history: query.data ?? null,
    isLoading: isSessionPending || (historyEnabled && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
};

const patchSnapshotActiveWorkout = (
  queryClient: QueryClient,
  userId: string,
  activeWorkout: Workout | null,
) => {
  queryClient.setQueryData<HomeSnapshot>(
    apiQueryKeys.homeSnapshot(userId),
    (snapshot) => (snapshot === undefined ? snapshot : { ...snapshot, activeWorkout }),
  );
};

// A workout completed, or a completed one changed: everything derived from
// finished workouts is out of date.
const invalidateWorkoutAggregates = (queryClient: QueryClient, userId: string) => {
  void queryClient.invalidateQueries({ queryKey: apiQueryKeys.homeSnapshot(userId) });
  void queryClient.invalidateQueries({ queryKey: apiQueryKeys.statsRoot(userId) });
  void queryClient.invalidateQueries({ queryKey: apiQueryKeys.workoutList(userId) });
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
        const { weeklyWorkoutGoal, fitnessLevel, timeZone } = input.updates;
        if (
          weeklyWorkoutGoal !== undefined ||
          fitnessLevel !== undefined ||
          timeZone !== undefined
        ) {
          // The goal (or its level-based default) and week bucketing feed
          // streaks and weekly stats.
          void queryClient.invalidateQueries({
            queryKey: apiQueryKeys.homeSnapshot(scopedUserId),
          });
          void queryClient.invalidateQueries({
            queryKey: apiQueryKeys.statsRoot(scopedUserId),
          });
        }
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
        patchSnapshotActiveWorkout(queryClient, scopedUserId, workout);
        void queryClient.invalidateQueries({
          queryKey: apiQueryKeys.workoutList(scopedUserId),
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
            // Set edits on the active workout only touch its own caches.
            queryClient.setQueryData(
              apiQueryKeys.activeWorkout(scopedUserId),
              result.workout,
            );
            patchSnapshotActiveWorkout(queryClient, scopedUserId, result.workout);
            // Reopening a completed workout removes it from every aggregate.
            if (input.updates.isActive === true) {
              invalidateWorkoutAggregates(queryClient, scopedUserId);
            }
          } else {
            if (input.updates.isActive === false) {
              queryClient.setQueryData(
                apiQueryKeys.activeWorkout(scopedUserId),
                null,
              );
              patchSnapshotActiveWorkout(queryClient, scopedUserId, null);
            }
            // Completed now, or an already completed workout was edited.
            invalidateWorkoutAggregates(queryClient, scopedUserId);
          }
        } else {
          void queryClient.invalidateQueries({
            queryKey: apiQueryKeys.workoutsRoot(scopedUserId),
          });
          void queryClient.invalidateQueries({
            queryKey: apiQueryKeys.homeSnapshot(scopedUserId),
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
        void queryClient.invalidateQueries({
          queryKey: apiQueryKeys.homeSnapshot(scopedUserId),
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
        void queryClient.invalidateQueries({
          queryKey: apiQueryKeys.homeSnapshot(scopedUserId),
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
        void queryClient.invalidateQueries({
          queryKey: apiQueryKeys.homeSnapshot(scopedUserId),
        });
      }

      return result;
    },
  });

  return { deleteWeight: mutation.mutateAsync, isPending: mutation.isPending };
};
