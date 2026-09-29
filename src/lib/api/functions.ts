import { createServerFn } from "@tanstack/react-start";
import type {
  ExerciseHistory,
  HomeSnapshot,
  Profile,
  StatsOverview,
  WeightEntry,
  WeightGoal,
  Workout,
  WorkoutPage,
} from "@/lib/types";
import {
  parseDeleteWeightInput,
  parseGetExerciseHistoryInput,
  parseGetWeightsInput,
  parseGetWorkoutInput,
  parseListWorkoutsInput,
  parseLogWeightInput,
  parseStartWorkoutInput,
  parseUpdateWeightInput,
  parseUpdateWorkoutInput,
  parseUpsertProfileInput,
  type WorkoutUpdateOutcome,
} from "./parsers";

export type { WorkoutUpdateOutcome };

export const getCurrentProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<Profile | null> => {
    const { withUserContext } = await import("./context.server");
    const { getProfileForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) => getProfileForUser(db, userId));
  },
);

export const upsertCurrentProfile = createServerFn({ method: "POST" })
  .validator(parseUpsertProfileInput)
  .handler(async ({ data }): Promise<Profile> => {
    const { withUserMutationContext } = await import("./context.server");
    const { upsertProfileForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId, user }) =>
      upsertProfileForUser(db, userId, user, data.updates),
    );
  });

export const listWorkouts = createServerFn({ method: "GET" })
  .validator(parseListWorkoutsInput)
  .handler(async ({ data }): Promise<WorkoutPage> => {
    const { withUserContext } = await import("./context.server");
    const { listWorkoutsPageForUser } = await import("./reads.server");
    return withUserContext(({ db, userId }) => listWorkoutsPageForUser(db, userId, data));
  });

export const getActiveWorkout = createServerFn({ method: "GET" }).handler(
  async (): Promise<Workout | null> => {
    const { withUserContext } = await import("./context.server");
    const { getActiveWorkoutForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) => getActiveWorkoutForUser(db, userId));
  },
);

export const getWorkout = createServerFn({ method: "GET" })
  .validator(parseGetWorkoutInput)
  .handler(async ({ data }): Promise<Workout | null> => {
    const { withUserContext } = await import("./context.server");
    const { getWorkoutForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) => getWorkoutForUser(db, userId, data.id));
  });

export const startWorkout = createServerFn({ method: "POST" })
  .validator(parseStartWorkoutInput)
  .handler(async ({ data }): Promise<Workout> => {
    const { withUserMutationContext } = await import("./context.server");
    const { startWorkoutForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId }) =>
      startWorkoutForUser(db, userId, data.bodyPartWorkedOut),
    );
  });

export const updateWorkout = createServerFn({ method: "POST" })
  .validator(parseUpdateWorkoutInput)
  .handler(async ({ data }): Promise<WorkoutUpdateOutcome> => {
    const { withUserMutationContext } = await import("./context.server");
    const { updateWorkoutForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId }) => updateWorkoutForUser(db, userId, data));
  });

export const getWeights = createServerFn({ method: "GET" })
  .validator(parseGetWeightsInput)
  .handler(async ({ data }): Promise<WeightEntry[]> => {
    const { withUserContext } = await import("./context.server");
    const { listWeightEntriesForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) =>
      listWeightEntriesForUser(db, userId, data.limit ?? 100),
    );
  });

export const logWeight = createServerFn({ method: "POST" })
  .validator(parseLogWeightInput)
  .handler(async ({ data }): Promise<WeightEntry> => {
    const { withUserMutationContext } = await import("./context.server");
    const { logWeightForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId }) => logWeightForUser(db, userId, data));
  });

export const updateWeight = createServerFn({ method: "POST" })
  .validator(parseUpdateWeightInput)
  .handler(async ({ data }): Promise<WeightEntry> => {
    const { withUserMutationContext } = await import("./context.server");
    const { updateWeightForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId }) => updateWeightForUser(db, userId, data));
  });

export const deleteWeight = createServerFn({ method: "POST" })
  .validator(parseDeleteWeightInput)
  .handler(async ({ data }): Promise<{ id: string }> => {
    const { withUserMutationContext } = await import("./context.server");
    const { deleteWeightForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId }) => deleteWeightForUser(db, userId, data.id));
  });

export const getWeightGoal = createServerFn({ method: "GET" }).handler(
  async (): Promise<WeightGoal | null> => {
    const { withUserContext } = await import("./context.server");
    const { getWeightGoalForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) => getWeightGoalForUser(db, userId));
  },
);

export const getHomeSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomeSnapshot> => {
    const { withUserContext } = await import("./context.server");
    const { getHomeSnapshotForUser } = await import("./reads.server");
    return withUserContext(({ db, userId }) => getHomeSnapshotForUser(db, userId));
  },
);

export const getStatsOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<StatsOverview> => {
    const { withUserContext } = await import("./context.server");
    const { getStatsOverviewForUser } = await import("./reads.server");
    return withUserContext(({ db, userId }) => getStatsOverviewForUser(db, userId));
  },
);

export const getExerciseHistory = createServerFn({ method: "GET" })
  .validator(parseGetExerciseHistoryInput)
  .handler(async ({ data }): Promise<ExerciseHistory> => {
    const { withUserContext } = await import("./context.server");
    const { getExerciseHistoryForUser } = await import("./reads.server");
    return withUserContext(({ db, userId }) =>
      getExerciseHistoryForUser(db, userId, data.exerciseKey),
    );
  });
