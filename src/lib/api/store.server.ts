import type {
  Exercise,
  ExerciseStat,
  Gender,
  Profile,
  WeeklyExerciseData,
  WeightEntry,
  WeightGoal,
  WeightUnit,
  Workout,
  WorkoutSummary,
} from "@/lib/types";
import {
  isExternalImageUrl,
  isOwnedImageUrl,
  isSameOriginImageUrl,
  type ProfileUpdatesInput,
  type UpdateWeightInput,
  type UpdateWorkoutInput,
  type WorkoutUpdateOutcome,
  type WorkoutUpdatesInput,
} from "./parsers";

export type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<unknown>;
  all(): Promise<unknown>;
  run(): Promise<unknown>;
};

export type Queryable = {
  prepare(query: string): Statement;
};

export type ProviderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

const STORED_DATA_ERROR = "Stored data is invalid.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const rowText = (row: Record<string, unknown>, key: string): string => {
  const value = row[key];
  if (typeof value !== "string") throw new Error(STORED_DATA_ERROR);
  return value;
};

const rowNullableText = (row: Record<string, unknown>, key: string): string | null => {
  const value = row[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error(STORED_DATA_ERROR);
  return value;
};

const rowNullableTextOrUndefined = (
  row: Record<string, unknown>,
  key: string,
): string | undefined => rowNullableText(row, key) ?? undefined;

const rowNumber = (row: Record<string, unknown>, key: string): number => {
  const value = row[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(STORED_DATA_ERROR);
  return value;
};

const rowInteger = (row: Record<string, unknown>, key: string): number => {
  const value = rowNumber(row, key);
  if (!Number.isSafeInteger(value)) throw new Error(STORED_DATA_ERROR);
  return value;
};

const rowFlag = (row: Record<string, unknown>, key: string): boolean | undefined => {
  const value = row[key];
  if (value === null || value === undefined) return undefined;
  return value === 1 || value === true;
};

const rowFrom = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) throw new Error(STORED_DATA_ERROR);
  return value;
};

const changesOf = (result: unknown): number => {
  if (!isRecord(result) || !isRecord(result.meta)) return 0;
  const changes = result.meta.changes;
  return typeof changes === "number" ? changes : 0;
};

const isConstraintFailure = (error: unknown): boolean =>
  error instanceof Error && /constraint/i.test(error.message);

const isSingleActiveWorkoutConstraint = (error: unknown): boolean =>
  error instanceof Error && /unique constraint failed: workouts\.userId/i.test(error.message);

const normalizeNote = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.trim().length === 0 ? null : value;
};

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(STORED_DATA_ERROR);
  }
};

const parseStoredSets = (value: unknown): Exercise["sets"] => {
  if (!Array.isArray(value)) throw new Error(STORED_DATA_ERROR);
  return value.map((item) => {
    if (!isRecord(item)) throw new Error(STORED_DATA_ERROR);
    const weight = item.weight;
    const reps = item.reps;
    if (typeof weight !== "number" || typeof reps !== "number") throw new Error(STORED_DATA_ERROR);
    return { id: rowText(item, "id"), weight, reps };
  });
};

const parseStoredExercises = (value: unknown): Exercise[] => {
  if (typeof value !== "string") throw new Error(STORED_DATA_ERROR);
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) throw new Error(STORED_DATA_ERROR);
  return parsed.map((item) => {
    if (!isRecord(item)) throw new Error(STORED_DATA_ERROR);
    const category = item.category;
    return {
      id: rowText(item, "id"),
      name: rowText(item, "name"),
      sets: parseStoredSets(item.sets),
      ...(typeof category === "string" ? { category } : {}),
    };
  });
};

const parseStoredStringList = (value: unknown): string[] | null => {
  if (typeof value !== "string") return null;
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) throw new Error(STORED_DATA_ERROR);
  return parsed.map((item) => {
    if (typeof item !== "string") throw new Error(STORED_DATA_ERROR);
    return item;
  });
};

const toWeightUnit = (value: unknown): WeightUnit => {
  if (value === "lbs" || value === "kgs") return value;
  throw new Error(STORED_DATA_ERROR);
};

const toGender = (value: unknown): Gender | undefined => {
  if (value === null || value === undefined) return undefined;
  if (value === "male" || value === "female") return value;
  throw new Error(STORED_DATA_ERROR);
};

const toFitnessLevel = (value: unknown): Profile["fitnessLevel"] => {
  if (value === null || value === undefined) return undefined;
  if (value === "beginner" || value === "intermediary" || value === "advanced" || value === "pro") {
    return value;
  }
  throw new Error(STORED_DATA_ERROR);
};

const rowsFromResult = (result: unknown): unknown[] => {
  const rows = isRecord(result) ? result.results : null;
  if (!Array.isArray(rows)) throw new Error(STORED_DATA_ERROR);
  return rows;
};

const toWorkout = (value: unknown): Workout => {
  const row = rowFrom(value);
  const startTime = rowNullableTextOrUndefined(row, "startTime");
  const endTime = rowNullableTextOrUndefined(row, "endTime");
  const notes = rowNullableTextOrUndefined(row, "notes");
  const isActive = rowFlag(row, "isActive");
  const bodyPartWorkedOut = parseStoredStringList(row.bodyPartWorkedOut);
  return {
    id: rowText(row, "id"),
    date: rowText(row, "date"),
    duration: rowNumber(row, "duration"),
    exercises: parseStoredExercises(row.exercises),
    revision: rowInteger(row, "revision"),
    ...(startTime === undefined ? {} : { startTime }),
    ...(endTime === undefined ? {} : { endTime }),
    ...(isActive === undefined ? {} : { isActive }),
    ...(bodyPartWorkedOut === null ? {} : { bodyPartWorkedOut }),
    ...(notes === undefined ? {} : { notes }),
  };
};

const toWeightEntry = (value: unknown): WeightEntry => {
  const row = rowFrom(value);
  const note = rowNullableTextOrUndefined(row, "note");
  const photoUrl = rowNullableTextOrUndefined(row, "photoUrl");
  return {
    id: rowText(row, "id"),
    date: rowText(row, "date"),
    weight: rowNumber(row, "weight"),
    ...(note === undefined ? {} : { note }),
    ...(photoUrl === undefined ? {} : { photoUrl }),
  };
};

const toWeightGoal = (value: unknown): WeightGoal => {
  const row = rowFrom(value);
  return {
    id: rowText(row, "id"),
    targetWeight: rowNumber(row, "targetWeight"),
    weeklyGoal: rowNumber(row, "weeklyGoal"),
    startDate: rowText(row, "startDate"),
    startWeight: rowNumber(row, "startWeight"),
  };
};

const toProfile = (value: unknown): Profile => {
  const row = rowFrom(value);
  const gender = toGender(row.gender);
  const fitnessLevel = toFitnessLevel(row.fitnessLevel);
  const profilePicture = rowNullableTextOrUndefined(row, "profilePicture");
  return {
    id: rowText(row, "id"),
    name: rowText(row, "name"),
    email: rowText(row, "email"),
    notificationsEnabled: rowFlag(row, "notificationsEnabled") ?? true,
    weightUnit: toWeightUnit(row.weightUnit),
    createdAt: rowText(row, "createdAt"),
    ...(gender === undefined ? {} : { gender }),
    ...(fitnessLevel === undefined ? {} : { fitnessLevel }),
    ...(profilePicture === undefined ? {} : { profilePicture }),
  };
};

const newId = (): string => crypto.randomUUID();
const nowIso = (): string => new Date().toISOString();

export const getProfileForUser = async (
  db: Queryable,
  userId: string,
): Promise<Profile | null> => {
  const row = await db
    .prepare('select * from "profiles" where "userId" = ? limit 1')
    .bind(userId)
    .first();
  return row === null || row === undefined ? null : toProfile(row);
};

export const upsertProfileForUser = async (
  db: Queryable,
  userId: string,
  provider: ProviderUser,
  updates: ProfileUpdatesInput,
): Promise<Profile> => {
  const providerName =
    (provider.name?.trim() ?? "") || (provider.email?.trim() ?? "") || "User";
  const providerEmail = provider.email?.trim() ?? "";
  const providerImage = provider.image?.trim() ?? "";

  const requestedPicture = updates.profilePicture;
  if (
    requestedPicture !== undefined &&
    isSameOriginImageUrl(requestedPicture) &&
    !isOwnedImageUrl(requestedPicture, userId)
  ) {
    throw new Error("Profile picture does not belong to this account.");
  }

  const providerPicture = isExternalImageUrl(providerImage) ? providerImage : null;
  const insertFields = ["id", "userId", "name", "email", "createdAt"];
  const insertValues: unknown[] = [
    newId(),
    userId,
    updates.name ?? providerName,
    providerEmail,
    nowIso(),
  ];
  const assignments: string[] = [];

  const addOptional = (column: string, value: unknown): void => {
    insertFields.push(column);
    insertValues.push(value);
    assignments.push(`"${column}" = excluded."${column}"`);
  };

  if (updates.name !== undefined) assignments.push('"name" = excluded."name"');
  if (providerEmail.length > 0) assignments.push('"email" = excluded."email"');
  if (updates.gender !== undefined) addOptional("gender", updates.gender);
  if (updates.fitnessLevel !== undefined) addOptional("fitnessLevel", updates.fitnessLevel);
  if (updates.notificationsEnabled !== undefined) {
    addOptional("notificationsEnabled", updates.notificationsEnabled ? 1 : 0);
  }
  if (updates.weightUnit !== undefined) addOptional("weightUnit", updates.weightUnit);
  if (requestedPicture !== undefined) {
    addOptional("profilePicture", requestedPicture);
  } else if (providerPicture !== null) {
    insertFields.push("profilePicture");
    insertValues.push(providerPicture);
    assignments.push(
      `"profilePicture" = case when coalesce("profilePicture", '') = '' then excluded."profilePicture" else "profilePicture" end`,
    );
  }

  const placeholders = insertFields.map(() => "?").join(", ");
  const columns = insertFields.map((column) => `"${column}"`).join(", ");
  const conflict =
    assignments.length === 0
      ? 'on conflict ("userId") do nothing '
      : `on conflict ("userId") do update set ${assignments.join(", ")} `;
  const saved = await db
    .prepare(
      `insert into "profiles" (${columns}) values (${placeholders}) ${conflict}returning *`,
    )
    .bind(...insertValues)
    .first();

  if (saved !== null && saved !== undefined) return toProfile(saved);

  const existing = await getProfileForUser(db, userId);
  if (existing === null) throw new Error("Unable to save this profile right now.");
  return existing;
};

export const listWorkoutsForUser = async (
  db: Queryable,
  userId: string,
): Promise<Workout[]> => {
  const result = await db
    .prepare(
      'select * from "workouts" where "userId" = ? order by "date" desc, "createdAt" desc',
    )
    .bind(userId)
    .all();
  return rowsFromResult(result).map(toWorkout);
};

export const getWorkoutForUser = async (
  db: Queryable,
  userId: string,
  id: string,
): Promise<Workout | null> => {
  const row = await db
    .prepare('select * from "workouts" where "id" = ? and "userId" = ? limit 1')
    .bind(id, userId)
    .first();
  return row === null || row === undefined ? null : toWorkout(row);
};

export const getActiveWorkoutForUser = async (
  db: Queryable,
  userId: string,
): Promise<Workout | null> => {
  const row = await db
    .prepare(
      'select * from "workouts" where "userId" = ? and "isActive" = 1 order by "createdAt" desc limit 1',
    )
    .bind(userId)
    .first();
  return row === null || row === undefined ? null : toWorkout(row);
};

export const startWorkoutForUser = async (
  db: Queryable,
  userId: string,
  bodyPartWorkedOut?: string[],
): Promise<Workout> => {
  const now = nowIso();
  let inserted: unknown = null;
  try {
    inserted = await db
      .prepare(
        'insert into "workouts" ("id", "userId", "date", "duration", "startTime", "isActive", "exercises", "bodyPartWorkedOut", "revision", "createdAt") ' +
          'values (?, ?, ?, 0, ?, 1, \'[]\', ?, 1, ?) ' +
          'on conflict ("userId") where "isActive" = 1 do nothing returning *',
      )
      .bind(
        newId(),
        userId,
        now,
        now,
        bodyPartWorkedOut === undefined ? null : JSON.stringify(bodyPartWorkedOut),
        now,
      )
      .first();
  } catch (error) {
    if (!isConstraintFailure(error)) throw error;
    inserted = null;
  }

  if (inserted === null || inserted === undefined) {
    const existing = await getActiveWorkoutForUser(db, userId);
    if (existing === null) throw new Error("Unable to start a workout right now.");
    return existing;
  }
  return toWorkout(inserted);
};

const buildWorkoutUpdate = (
  updates: WorkoutUpdatesInput,
): { fields: string[]; values: unknown[] } => {
  const fields = ['"revision" = "revision" + 1'];
  const values: unknown[] = [];
  if (updates.date !== undefined) {
    fields.push('"date" = ?');
    values.push(updates.date);
  }
  if (updates.duration !== undefined) {
    fields.push('"duration" = ?');
    values.push(updates.duration);
  }
  if (updates.startTime !== undefined) {
    fields.push('"startTime" = ?');
    values.push(updates.startTime);
  }
  if (updates.endTime !== undefined) {
    fields.push('"endTime" = ?');
    values.push(updates.endTime);
  }
  if (updates.isActive !== undefined) {
    fields.push('"isActive" = ?');
    values.push(updates.isActive ? 1 : 0);
  }
  if (updates.exercises !== undefined) {
    fields.push('"exercises" = ?');
    values.push(JSON.stringify(updates.exercises));
  }
  if (updates.bodyPartWorkedOut !== undefined) {
    fields.push('"bodyPartWorkedOut" = ?');
    values.push(JSON.stringify(updates.bodyPartWorkedOut));
  }
  if (updates.notes !== undefined) {
    fields.push('"notes" = ?');
    values.push(normalizeNote(updates.notes) ?? null);
  }
  return { fields, values };
};

export const updateWorkoutForUser = async (
  db: Queryable,
  userId: string,
  input: UpdateWorkoutInput,
): Promise<WorkoutUpdateOutcome> => {
  const { fields, values } = buildWorkoutUpdate(input.updates);
  if (values.length === 0) {
    const current = await getWorkoutForUser(db, userId, input.id);
    if (current === null) throw new Error("Workout not found");
    if (current.revision !== input.revision) return { ok: false, reason: "conflict" };
    return { ok: true, workout: current };
  }

  let updated: unknown = null;
  try {
    updated = await db
      .prepare(
        `update "workouts" set ${fields.join(", ")} where "id" = ? and "userId" = ? and "revision" = ? returning *`,
      )
      .bind(...values, input.id, userId, input.revision)
      .first();
  } catch (error) {
    if (isSingleActiveWorkoutConstraint(error)) {
      return { ok: false, reason: "active-exists" };
    }
    if (isConstraintFailure(error)) return { ok: false, reason: "conflict" };
    throw error;
  }

  if (updated !== null && updated !== undefined) {
    return { ok: true, workout: toWorkout(updated) };
  }

  const existing = await getWorkoutForUser(db, userId, input.id);
  if (existing === null) throw new Error("Workout not found");
  return { ok: false, reason: "conflict" };
};

export const listWeightEntriesForUser = async (
  db: Queryable,
  userId: string,
  limit: number,
): Promise<WeightEntry[]> => {
  const result = await db
    .prepare(
      'select * from "weightEntries" where "userId" = ? order by "date" desc, "createdAt" desc limit ?',
    )
    .bind(userId, limit)
    .all();
  return rowsFromResult(result).map(toWeightEntry);
};

const assertOwnedPhoto = (userId: string, photoUrl: string): void => {
  if (!isOwnedImageUrl(photoUrl, userId)) {
    throw new Error("Photo does not belong to this account.");
  }
};

export const logWeightForUser = async (
  db: Queryable,
  userId: string,
  input: { date: string; weight: number; note?: string; photoUrl?: string },
): Promise<WeightEntry> => {
  if (input.photoUrl !== undefined) assertOwnedPhoto(userId, input.photoUrl);
  const inserted = await db
    .prepare(
      'insert into "weightEntries" ("id", "userId", "date", "weight", "note", "photoUrl", "createdAt") ' +
        "values (?, ?, ?, ?, ?, ?, ?) returning *",
    )
    .bind(
      newId(),
      userId,
      input.date,
      input.weight,
      normalizeNote(input.note) ?? null,
      input.photoUrl ?? null,
      nowIso(),
    )
    .first();
  return toWeightEntry(inserted);
};

export const updateWeightForUser = async (
  db: Queryable,
  userId: string,
  input: UpdateWeightInput,
): Promise<WeightEntry> => {
  if (input.photoUrl !== undefined) assertOwnedPhoto(userId, input.photoUrl);
  const fields: string[] = [];
  const values: unknown[] = [];
  if (input.weight !== undefined) {
    fields.push('"weight" = ?');
    values.push(input.weight);
  }
  if (input.date !== undefined) {
    fields.push('"date" = ?');
    values.push(input.date);
  }
  if (input.note !== undefined) {
    fields.push('"note" = ?');
    values.push(normalizeNote(input.note) ?? null);
  }
  if (input.photoUrl !== undefined) {
    fields.push('"photoUrl" = ?');
    values.push(input.photoUrl);
  }

  if (fields.length === 0) {
    const current = await db
      .prepare('select * from "weightEntries" where "id" = ? and "userId" = ? limit 1')
      .bind(input.id, userId)
      .first();
    if (current === null || current === undefined) throw new Error("Weight entry not found");
    return toWeightEntry(current);
  }

  const updated = await db
    .prepare(
      `update "weightEntries" set ${fields.join(", ")} where "id" = ? and "userId" = ? returning *`,
    )
    .bind(...values, input.id, userId)
    .first();
  if (updated === null || updated === undefined) throw new Error("Weight entry not found");
  return toWeightEntry(updated);
};

export const deleteWeightForUser = async (
  db: Queryable,
  userId: string,
  id: string,
): Promise<{ id: string }> => {
  const result = await db
    .prepare('delete from "weightEntries" where "id" = ? and "userId" = ?')
    .bind(id, userId)
    .run();
  if (changesOf(result) === 0) throw new Error("Weight entry not found");
  return { id };
};

export const getWeightGoalForUser = async (
  db: Queryable,
  userId: string,
): Promise<WeightGoal | null> => {
  const row = await db
    .prepare('select * from "weightGoals" where "userId" = ? limit 1')
    .bind(userId)
    .first();
  return row === null || row === undefined ? null : toWeightGoal(row);
};

const getWeekStart = (date: Date): string => {
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setUTCDate(diff);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString().split("T")[0];
};

const completedWorkoutsForUser = async (
  db: Queryable,
  userId: string,
): Promise<Workout[]> => {
  const result = await db
    .prepare(
      'select * from "workouts" where "userId" = ? and "isActive" = 0 order by "date" asc, "createdAt" asc',
    )
    .bind(userId)
    .all();
  return rowsFromResult(result).map(toWorkout);
};

export const getWorkoutSummaryForUser = async (
  db: Queryable,
  userId: string,
  now: Date = new Date(),
): Promise<WorkoutSummary> => {
  const workouts = await completedWorkoutsForUser(db, userId);

  if (workouts.length === 0) {
    return {
      totalWorkouts: 0,
      averageDuration: 0,
      totalExercises: 0,
      totalSets: 0,
      currentStreak: 0,
      longestStreak: 0,
      workoutsThisWeek: 0,
      workoutsThisMonth: 0,
    };
  }

  let totalExercises = 0;
  let totalSets = 0;
  for (const workout of workouts) {
    totalExercises += workout.exercises.length;
    for (const exercise of workout.exercises) {
      totalSets += exercise.sets.length;
    }
  }

  const totalDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0);
  const averageDuration = Math.round(totalDuration / workouts.length);

  const workoutDates = new Set(workouts.map((workout) => workout.date.split("T")[0]));
  const sortedDates = Array.from(workoutDates).sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
  const hasRecentWorkout = workoutDates.has(today) || workoutDates.has(yesterday);

  for (let i = 1; i < sortedDates.length; i++) {
    const previous = new Date(sortedDates[i - 1]);
    const current = new Date(sortedDates[i]);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / 86400000);

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  if (hasRecentWorkout && sortedDates.length > 0) {
    currentStreak = 1;
    for (let i = sortedDates.length - 1; i > 0; i--) {
      const current = new Date(sortedDates[i]);
      const previous = new Date(sortedDates[i - 1]);
      const diffDays = Math.round((current.getTime() - previous.getTime()) / 86400000);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  const weekStart = getWeekStart(now);
  const monthStart = new Date(now);
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartDate = monthStart.toISOString().split("T")[0];

  const workoutsThisWeek = workouts.filter(
    (workout) => workout.date.split("T")[0] >= weekStart,
  ).length;
  const workoutsThisMonth = workouts.filter(
    (workout) => workout.date.split("T")[0] >= monthStartDate,
  ).length;

  return {
    totalWorkouts: workouts.length,
    averageDuration,
    totalExercises,
    totalSets,
    currentStreak,
    longestStreak,
    workoutsThisWeek,
    workoutsThisMonth,
  };
};

type ExerciseStatAccumulator = {
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  maxWeight: number;
  maxWeightReps: number;
  lastPerformedAt: string;
  weeks: Map<string, WeeklyExerciseData>;
};

export const getExerciseStatsForUser = async (
  db: Queryable,
  userId: string,
): Promise<ExerciseStat[]> => {
  const workouts = await completedWorkoutsForUser(db, userId);
  const accumulators = new Map<string, ExerciseStatAccumulator>();

  for (const workout of workouts) {
    const weekStart = getWeekStart(new Date(workout.date));
    for (const exercise of workout.exercises) {
      let accumulator = accumulators.get(exercise.name);
      if (accumulator === undefined) {
        accumulator = {
          totalSets: 0,
          totalReps: 0,
          totalVolume: 0,
          maxWeight: 0,
          maxWeightReps: 0,
          lastPerformedAt: workout.date,
          weeks: new Map(),
        };
        accumulators.set(exercise.name, accumulator);
      }
      if (workout.date > accumulator.lastPerformedAt) {
        accumulator.lastPerformedAt = workout.date;
      }

      for (const set of exercise.sets) {
        const volume = set.weight * set.reps;
        accumulator.totalSets++;
        accumulator.totalReps += set.reps;
        accumulator.totalVolume += volume;
        if (set.weight > accumulator.maxWeight) {
          accumulator.maxWeight = set.weight;
          accumulator.maxWeightReps = set.reps;
        }

        let week = accumulator.weeks.get(weekStart);
        if (week === undefined) {
          week = { weekStart, sets: 0, reps: 0, volume: 0, maxWeight: 0 };
          accumulator.weeks.set(weekStart, week);
        }
        week.sets++;
        week.reps += set.reps;
        week.volume += volume;
        week.maxWeight = Math.max(week.maxWeight, set.weight);
      }
    }
  }

  return Array.from(accumulators.entries())
    .map(([exerciseName, accumulator]) => ({
      id: exerciseName,
      exerciseName,
      totalSets: accumulator.totalSets,
      totalReps: accumulator.totalReps,
      totalVolume: accumulator.totalVolume,
      maxWeight: accumulator.maxWeight,
      maxWeightReps: accumulator.maxWeightReps,
      lastPerformedAt: accumulator.lastPerformedAt,
      weeklyHistory: Array.from(accumulator.weeks.values())
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
        .slice(-12),
    }))
    .sort((a, b) =>
      a.lastPerformedAt === b.lastPerformedAt
        ? a.exerciseName.localeCompare(b.exerciseName)
        : b.lastPerformedAt.localeCompare(a.lastPerformedAt),
    );
};
