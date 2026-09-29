import type {
  Gender,
  Profile,
  WeightEntry,
  WeightGoal,
  WeightUnit,
  Workout,
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
import {
  STORED_DATA_ERROR,
  changesOf,
  nowIso,
  rowFlag,
  rowFrom,
  rowInteger,
  rowNullableInteger,
  rowNullableTextOrUndefined,
  rowNumber,
  rowText,
  rowsFromResult,
  type Queryable,
  type Statement,
} from "./db.server";
import {
  buildContributionStatements,
  contributionsOf,
  isStatsStale,
  readContributionRows,
  statsTimeZone,
  toStatsState,
  totalsOf,
  weeklyContributionOf,
  workoutRevisionGuard,
  STATS_STATE_SQL,
} from "./rollups.server";
import { toFitnessLevel, toWorkout } from "./rows.server";

export type { Queryable, Statement };

export type ProviderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
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

const toWeightUnit = (value: unknown): WeightUnit => {
  if (value === "lbs" || value === "kgs") return value;
  throw new Error(STORED_DATA_ERROR);
};

const toGender = (value: unknown): Gender | undefined => {
  if (value === null || value === undefined) return undefined;
  if (value === "male" || value === "female") return value;
  throw new Error(STORED_DATA_ERROR);
};

export const toWeightEntry = (value: unknown): WeightEntry => {
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

export const toWeightGoal = (value: unknown): WeightGoal => {
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
  const weeklyWorkoutGoal = rowNullableInteger(row, "weeklyWorkoutGoal");
  const timeZone = rowNullableTextOrUndefined(row, "timeZone");
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
    ...(weeklyWorkoutGoal === null ? {} : { weeklyWorkoutGoal }),
    ...(timeZone === undefined ? {} : { timeZone }),
  };
};

const newId = (): string => crypto.randomUUID();

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
  if (updates.weeklyWorkoutGoal !== undefined) {
    addOptional("weeklyWorkoutGoal", updates.weeklyWorkoutGoal);
  }
  if (updates.timeZone !== undefined) {
    // The first zone we learn sticks. Rollups built before it was known used
    // UTC weeks, so learning any other zone sends them back to be rebuilt.
    insertFields.push("timeZone");
    insertValues.push(updates.timeZone);
    const learned =
      `"profiles"."timeZone" is null and excluded."timeZone" <> 'UTC'`;
    assignments.push(
      `"timeZone" = coalesce("profiles"."timeZone", excluded."timeZone")`,
      `"statsVersion" = case when ${learned} then 0 else "profiles"."statsVersion" end`,
      `"statsCursor" = case when ${learned} then null else "profiles"."statsCursor" end`,
    );
  }
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
        'insert into "workouts" ("id", "userId", "date", "duration", "startTime", "isActive", "exercises", "bodyPartWorkedOut", "revision", "createdAt", "updatedAt") ' +
          'values (?, ?, ?, 0, ?, 1, \'[]\', ?, 1, ?, ?) ' +
          'on conflict ("userId") where "isActive" = 1 do nothing returning *',
      )
      .bind(
        newId(),
        userId,
        now,
        now,
        bodyPartWorkedOut === undefined ? null : JSON.stringify(bodyPartWorkedOut),
        now,
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

type WorkoutUpdateBuild = {
  fields: string[];
  values: unknown[];
  hasChanges: boolean;
};

// Summary columns follow the exercises blob and updatedAt follows every
// write, so list and home reads never need to open the blob.
const buildWorkoutUpdate = (updates: WorkoutUpdatesInput, now: string): WorkoutUpdateBuild => {
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
    const totals = totalsOf(updates.exercises);
    fields.push('"exercises" = ?', '"totalVolume" = ?', '"totalSets" = ?', '"exerciseCount" = ?');
    values.push(
      JSON.stringify(updates.exercises),
      totals.totalVolume,
      totals.totalSets,
      totals.exerciseCount,
    );
  }
  if (updates.bodyPartWorkedOut !== undefined) {
    fields.push('"bodyPartWorkedOut" = ?');
    values.push(JSON.stringify(updates.bodyPartWorkedOut));
  }
  if (updates.notes !== undefined) {
    fields.push('"notes" = ?');
    values.push(normalizeNote(updates.notes) ?? null);
  }
  const hasChanges = values.length > 0;
  fields.push('"updatedAt" = ?');
  values.push(now);
  return { fields, values, hasChanges };
};

const updateFailure = (error: unknown): WorkoutUpdateOutcome => {
  if (isSingleActiveWorkoutConstraint(error)) return { ok: false, reason: "active-exists" };
  if (isConstraintFailure(error)) return { ok: false, reason: "conflict" };
  throw error;
};

const readUpdatedWorkout = (result: unknown): WorkoutUpdateOutcome => {
  const row = rowsFromResult(result)[0];
  if (row === undefined) return { ok: false, reason: "conflict" };
  return { ok: true, workout: toWorkout(row) };
};

export const updateWorkoutForUser = async (
  db: Queryable,
  userId: string,
  input: UpdateWorkoutInput,
): Promise<WorkoutUpdateOutcome> => {
  const { fields, values, hasChanges } = buildWorkoutUpdate(input.updates, nowIso());
  if (!hasChanges) {
    const current = await getWorkoutForUser(db, userId, input.id);
    if (current === null) throw new Error("Workout not found");
    if (current.revision !== input.revision) return { ok: false, reason: "conflict" };
    return { ok: true, workout: current };
  }

  const updateStatement = (extraWhere: string): Statement =>
    db
      .prepare(
        `update "workouts" set ${fields.join(", ")} where "id" = ? and "userId" = ? and "revision" = ?${extraWhere} returning *`,
      )
      .bind(...values, input.id, userId, input.revision);

  // Hot path: an edit that keeps an active workout active writes exactly the
  // workouts row. Rollups only track completed workouts, so nothing else is
  // read or written. A miss (completed, missing or stale) takes the slow path.
  if (input.updates.isActive === undefined) {
    let fast: unknown = null;
    try {
      fast = await updateStatement(' and "isActive" = 1').first();
    } catch (error) {
      return updateFailure(error);
    }
    if (fast !== null && fast !== undefined) return { ok: true, workout: toWorkout(fast) };
  }

  const [workoutResult, contributionResult, stateResult] = await db.batch([
    db
      .prepare('select * from "workouts" where "id" = ? and "userId" = ? limit 1')
      .bind(input.id, userId),
    db
      .prepare('select * from "workoutExercises" where "workoutId" = ? and "userId" = ?')
      .bind(input.id, userId),
    db.prepare(STATS_STATE_SQL).bind(userId),
  ]);
  const currentRow = rowsFromResult(workoutResult)[0];
  if (currentRow === undefined) throw new Error("Workout not found");
  const current = toWorkout(currentRow);
  if (current.revision !== input.revision) return { ok: false, reason: "conflict" };

  const wasCompleted = current.isActive === false;
  const isCompleted = (input.updates.isActive ?? current.isActive) === false;
  const statements: Statement[] = [];

  if (wasCompleted || isCompleted) {
    // Completing, editing or reopening a completed workout: swap its old
    // contribution for the new one in the same transaction as the UPDATE.
    // The contribution statements run first, each guarded on the workout
    // still being at the revision read above; the revision-guarded UPDATE
    // goes last, so if another request got in between, all of them are
    // no-ops and the outcome is a conflict.
    const guard = workoutRevisionGuard(userId, input.id, input.revision);
    const state = toStatsState(rowsFromResult(stateResult)[0] ?? null);
    if (isStatsStale(state)) {
      // Rollups are mid-rebuild and would miss this change: restart it.
      statements.push(
        db
          .prepare(`update "profiles" set "statsCursor" = null where "userId" = ? and ${guard.sql}`)
          .bind(userId, ...guard.params),
      );
    } else {
      const timeZone = statsTimeZone(state);
      const previous = rowFrom(currentRow);
      const exercises = input.updates.exercises ?? current.exercises;
      const date = input.updates.date ?? current.date;
      const duration = input.updates.duration ?? current.duration;
      statements.push(
        ...buildContributionStatements(db, userId, guard, {
          workoutId: input.id,
          removed: wasCompleted ? readContributionRows(contributionResult) : [],
          added: isCompleted ? contributionsOf(input.id, date, exercises) : [],
          weeklyRemoved: wasCompleted
            ? weeklyContributionOf(
                {
                  date: current.date,
                  duration: current.duration,
                  exerciseCount: rowInteger(previous, "exerciseCount"),
                  totalSets: rowInteger(previous, "totalSets"),
                  totalVolume: rowNumber(previous, "totalVolume"),
                },
                timeZone,
              )
            : null,
          weeklyAdded: isCompleted
            ? weeklyContributionOf({ date, duration, ...totalsOf(exercises) }, timeZone)
            : null,
        }),
      );
    }
  }

  statements.push(updateStatement(""));

  try {
    const results = await db.batch(statements);
    return readUpdatedWorkout(results[results.length - 1]);
  } catch (error) {
    return updateFailure(error);
  }
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
