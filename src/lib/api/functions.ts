import { createServerFn } from "@tanstack/react-start";
import type {
  ExerciseStat,
  Profile,
  WeightEntry,
  WeightGoal,
  Workout,
  WorkoutSummary,
} from "@/lib/types";
import {
  parseDeleteWeightInput,
  parseGetWeightsInput,
  parseGetWorkoutInput,
  parseLogWeightInput,
  parseSetWeightGoalInput,
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
  .inputValidator(parseUpsertProfileInput)
  .handler(async ({ data }): Promise<Profile> => {
    const { withUserMutationContext } = await import("./context.server");
    const { upsertProfileForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId, user }) =>
      upsertProfileForUser(db, userId, user, data.updates),
    );
  });

export const listWorkouts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Workout[]> => {
    const { withUserContext } = await import("./context.server");
    const { listWorkoutsForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) => listWorkoutsForUser(db, userId));
  },
);

export const getActiveWorkout = createServerFn({ method: "GET" }).handler(
  async (): Promise<Workout | null> => {
    const { withUserContext } = await import("./context.server");
    const { getActiveWorkoutForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) => getActiveWorkoutForUser(db, userId));
  },
);

export const getWorkout = createServerFn({ method: "GET" })
  .inputValidator(parseGetWorkoutInput)
  .handler(async ({ data }): Promise<Workout | null> => {
    const { withUserContext } = await import("./context.server");
    const { getWorkoutForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) => getWorkoutForUser(db, userId, data.id));
  });

export const startWorkout = createServerFn({ method: "POST" })
  .inputValidator(parseStartWorkoutInput)
  .handler(async ({ data }): Promise<Workout> => {
    const { withUserMutationContext } = await import("./context.server");
    const { startWorkoutForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId }) =>
      startWorkoutForUser(db, userId, data.bodyPartWorkedOut),
    );
  });

export const updateWorkout = createServerFn({ method: "POST" })
  .inputValidator(parseUpdateWorkoutInput)
  .handler(async ({ data }): Promise<WorkoutUpdateOutcome> => {
    const { withUserMutationContext } = await import("./context.server");
    const { updateWorkoutForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId }) => updateWorkoutForUser(db, userId, data));
  });

export const getWeights = createServerFn({ method: "GET" })
  .inputValidator(parseGetWeightsInput)
  .handler(async ({ data }): Promise<WeightEntry[]> => {
    const { withUserContext } = await import("./context.server");
    const { listWeightEntriesForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) =>
      listWeightEntriesForUser(db, userId, data.limit ?? 100),
    );
  });

export const logWeight = createServerFn({ method: "POST" })
  .inputValidator(parseLogWeightInput)
  .handler(async ({ data }): Promise<WeightEntry> => {
    const { withUserMutationContext } = await import("./context.server");
    const { logWeightForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId }) => logWeightForUser(db, userId, data));
  });

export const updateWeight = createServerFn({ method: "POST" })
  .inputValidator(parseUpdateWeightInput)
  .handler(async ({ data }): Promise<WeightEntry> => {
    const { withUserMutationContext } = await import("./context.server");
    const { updateWeightForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId }) => updateWeightForUser(db, userId, data));
  });

export const deleteWeight = createServerFn({ method: "POST" })
  .inputValidator(parseDeleteWeightInput)
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

export const setWeightGoal = createServerFn({ method: "POST" })
  .inputValidator(parseSetWeightGoalInput)
  .handler(async ({ data }): Promise<WeightGoal> => {
    const { withUserMutationContext } = await import("./context.server");
    const { setWeightGoalForUser } = await import("./store.server");
    return withUserMutationContext(({ db, userId }) => setWeightGoalForUser(db, userId, data));
  });

export const getWorkoutSummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<WorkoutSummary> => {
    const { withUserContext } = await import("./context.server");
    const { getWorkoutSummaryForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) => getWorkoutSummaryForUser(db, userId));
  },
);

export const getExerciseStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<ExerciseStat[]> => {
    const { withUserContext } = await import("./context.server");
    const { getExerciseStatsForUser } = await import("./store.server");
    return withUserContext(({ db, userId }) => getExerciseStatsForUser(db, userId));
  },
);
