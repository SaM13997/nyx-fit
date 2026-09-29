import type { Exercise, FitnessLevel, StatsStatus } from "@/lib/types";
import { resolveTimeZone, weekStartKey } from "@/lib/weeks";
import {
  changesOf,
  isRecord,
  parseJson,
  rowFrom,
  rowInteger,
  rowNullableInteger,
  rowNullableText,
  rowNumber,
  rowText,
  rowsFromResult,
  type Queryable,
  type Statement,
} from "./db.server";
import { parseStoredExercises, toFitnessLevel } from "./rows.server";

// Rollups (workoutExercises, exerciseRecords, weeklyStats) hold every
// completed workout's contribution. They are derived data: the workouts table
// stays the source of truth and `profiles.statsVersion` says whether a
// user's rollups match the current formulas.
//
// Bump this whenever a formula, the exercise key or the week bucketing
// changes; each user is then rebuilt lazily, one bounded page per request.
export const CURRENT_STATS_VERSION = 1;

// Small enough to stay inside the Free plan's 10 ms Worker CPU budget
// (JSON parsing is the dominant cost) and to keep rows read per request low.
export const REBUILD_PAGE_SIZE = 40;

export const normalizeExerciseKey = (name: string): string => name.trim().toLowerCase();

export type WorkoutTotals = {
  totalVolume: number;
  totalSets: number;
  exerciseCount: number;
};

export type ContributionRow = {
  workoutId: string;
  exerciseKey: string;
  exerciseName: string;
  date: string;
  sets: number;
  reps: number;
  volume: number;
  maxWeight: number;
  maxWeightReps: number;
};

export const totalsOf = (exercises: readonly Exercise[]): WorkoutTotals => {
  let totalVolume = 0;
  let totalSets = 0;
  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      totalSets += 1;
      totalVolume += set.weight * set.reps;
    }
  }
  return { totalVolume, totalSets, exerciseCount: exercises.length };
};

// One row per normalised exercise name; exercises without sets are skipped.
// The heaviest set wins the max, the first one reached on ties.
export const contributionsOf = (
  workoutId: string,
  date: string,
  exercises: readonly Exercise[],
): ContributionRow[] => {
  const rows = new Map<string, ContributionRow>();
  for (const exercise of exercises) {
    if (exercise.sets.length === 0) continue;
    const exerciseKey = normalizeExerciseKey(exercise.name);
    let row = rows.get(exerciseKey);
    if (row === undefined) {
      row = {
        workoutId,
        exerciseKey,
        exerciseName: exercise.name,
        date,
        sets: 0,
        reps: 0,
        volume: 0,
        maxWeight: 0,
        maxWeightReps: 0,
      };
      rows.set(exerciseKey, row);
    }
    let hasMax = row.sets > 0;
    for (const set of exercise.sets) {
      row.sets += 1;
      row.reps += set.reps;
      row.volume += set.weight * set.reps;
      if (!hasMax || set.weight > row.maxWeight) {
        row.maxWeight = set.weight;
        row.maxWeightReps = set.reps;
        hasMax = true;
      }
    }
  }
  return Array.from(rows.values());
};

export type WeeklyDelta = {
  weekStart: string;
  workouts: number;
  exercises: number;
  sets: number;
  volume: number;
  durationSeconds: number;
};

type WorkoutForWeek = WorkoutTotals & { date: string; duration: number };

export const weeklyContributionOf = (workout: WorkoutForWeek, timeZone: string): WeeklyDelta => ({
  weekStart: weekStartKey(workout.date, timeZone),
  workouts: 1,
  exercises: workout.exerciseCount,
  sets: workout.totalSets,
  volume: workout.totalVolume,
  durationSeconds: workout.duration,
});

const negateWeekly = (delta: WeeklyDelta): WeeklyDelta => ({
  weekStart: delta.weekStart,
  workouts: -delta.workouts,
  exercises: -delta.exercises,
  sets: -delta.sets,
  volume: -delta.volume,
  durationSeconds: -delta.durationSeconds,
});

const mergeWeekly = (deltas: readonly WeeklyDelta[]): WeeklyDelta[] => {
  const merged = new Map<string, WeeklyDelta>();
  for (const delta of deltas) {
    const existing = merged.get(delta.weekStart);
    if (existing === undefined) {
      merged.set(delta.weekStart, { ...delta });
      continue;
    }
    existing.workouts += delta.workouts;
    existing.exercises += delta.exercises;
    existing.sets += delta.sets;
    existing.volume += delta.volume;
    existing.durationSeconds += delta.durationSeconds;
  }
  return Array.from(merged.values());
};

type RecordHolder = { maxWeight: number; maxWeightReps: number; workoutId: string; date: string };

type RecordDelta = {
  exerciseKey: string;
  exerciseName: string;
  sessions: number;
  sets: number;
  reps: number;
  volume: number;
  // Best contribution being added; null when the key is only losing rows.
  holder: RecordHolder | null;
  // Newest date among the contributions being added.
  lastDate: string | null;
};

// The lifetime record holder is the heaviest set; ties go to the earliest
// workout, then the smaller id, so incremental writes and rebuilds agree.
const beats = (candidate: RecordHolder, current: RecordHolder | null): boolean => {
  if (current === null) return true;
  if (candidate.maxWeight !== current.maxWeight) return candidate.maxWeight > current.maxWeight;
  if (candidate.date !== current.date) return candidate.date < current.date;
  return candidate.workoutId < current.workoutId;
};

const recordDeltasOf = (
  removed: readonly ContributionRow[],
  added: readonly ContributionRow[],
): RecordDelta[] => {
  const deltas = new Map<string, RecordDelta>();
  const deltaFor = (row: ContributionRow): RecordDelta => {
    let delta = deltas.get(row.exerciseKey);
    if (delta === undefined) {
      delta = {
        exerciseKey: row.exerciseKey,
        exerciseName: row.exerciseName,
        sessions: 0,
        sets: 0,
        reps: 0,
        volume: 0,
        holder: null,
        lastDate: null,
      };
      deltas.set(row.exerciseKey, delta);
    }
    return delta;
  };

  for (const row of removed) {
    const delta = deltaFor(row);
    delta.sessions -= 1;
    delta.sets -= row.sets;
    delta.reps -= row.reps;
    delta.volume -= row.volume;
  }
  for (const row of added) {
    const delta = deltaFor(row);
    // Name shown for a new record comes from the newest contribution.
    delta.exerciseName = row.exerciseName;
    delta.sessions += 1;
    delta.sets += row.sets;
    delta.reps += row.reps;
    delta.volume += row.volume;
    const candidate: RecordHolder = {
      maxWeight: row.maxWeight,
      maxWeightReps: row.maxWeightReps,
      workoutId: row.workoutId,
      date: row.date,
    };
    if (beats(candidate, delta.holder)) delta.holder = candidate;
    if (delta.lastDate === null || row.date > delta.lastDate) delta.lastDate = row.date;
  }
  return Array.from(deltas.values());
};

// Statements are guarded so that they do nothing unless the precondition the
// caller read still holds when the batch runs.
export type Guard = { sql: string; params: unknown[] };

export const workoutRevisionGuard = (
  userId: string,
  workoutId: string,
  revision: number,
): Guard => ({
  sql: 'exists (select 1 from "workouts" where "id" = ? and "userId" = ? and "revision" = ?)',
  params: [workoutId, userId, revision],
});

const rebuildGuard = (userId: string, cursor: string | null): Guard => ({
  sql: 'exists (select 1 from "profiles" where "userId" = ? and "statsVersion" < ? and "statsCursor" is ?)',
  params: [userId, CURRENT_STATS_VERSION, cursor],
});

const insertContributions = (
  db: Queryable,
  userId: string,
  rows: readonly ContributionRow[],
  guard: Guard,
): Statement =>
  db
    .prepare(
      'insert into "workoutExercises" ("userId", "workoutId", "exerciseKey", "exerciseName", "date", "sets", "reps", "volume", "maxWeight", "maxWeightReps") ' +
        "select ?, json_extract(j.value, '$.workoutId'), json_extract(j.value, '$.exerciseKey'), json_extract(j.value, '$.exerciseName'), json_extract(j.value, '$.date'), " +
        "json_extract(j.value, '$.sets'), json_extract(j.value, '$.reps'), json_extract(j.value, '$.volume'), json_extract(j.value, '$.maxWeight'), json_extract(j.value, '$.maxWeightReps') " +
        `from json_each(?) as j where ${guard.sql}`,
    )
    .bind(userId, JSON.stringify(rows), ...guard.params);

const RECORD_TABLE = '"exerciseRecords"';
const BEATS_SQL =
  `(excluded."maxWeightWorkoutId" is not null and (excluded."maxWeight" > ${RECORD_TABLE}."maxWeight" ` +
  `or (excluded."maxWeight" = ${RECORD_TABLE}."maxWeight" and (${RECORD_TABLE}."maxWeightWorkoutId" is null ` +
  `or (excluded."maxWeightDate", excluded."maxWeightWorkoutId") < (${RECORD_TABLE}."maxWeightDate", ${RECORD_TABLE}."maxWeightWorkoutId")))))`;

const upsertRecordDeltas = (
  db: Queryable,
  userId: string,
  deltas: readonly RecordDelta[],
  guard: Guard,
): Statement => {
  const payload = deltas.map((delta) => ({
    k: delta.exerciseKey,
    n: delta.exerciseName,
    sessions: delta.sessions,
    sets: delta.sets,
    reps: delta.reps,
    volume: delta.volume,
    m: delta.holder?.maxWeight ?? 0,
    mr: delta.holder?.maxWeightReps ?? 0,
    wid: delta.holder?.workoutId ?? null,
    d: delta.holder?.date ?? null,
    last: delta.lastDate,
  }));
  const keep = (column: string, next: string): string =>
    `"${column}" = case when ${BEATS_SQL} then ${next} else ${RECORD_TABLE}."${column}" end`;
  return db
    .prepare(
      `insert into ${RECORD_TABLE} ("userId", "exerciseKey", "exerciseName", "sessions", "totalSets", "totalReps", "totalVolume", "maxWeight", "maxWeightReps", "maxWeightWorkoutId", "maxWeightDate", "lastPerformedAt") ` +
        "select ?, json_extract(j.value, '$.k'), json_extract(j.value, '$.n'), json_extract(j.value, '$.sessions'), json_extract(j.value, '$.sets'), json_extract(j.value, '$.reps'), json_extract(j.value, '$.volume'), " +
        "json_extract(j.value, '$.m'), json_extract(j.value, '$.mr'), json_extract(j.value, '$.wid'), json_extract(j.value, '$.d'), coalesce(json_extract(j.value, '$.last'), '') " +
        `from json_each(?) as j where ${guard.sql} ` +
        'on conflict ("userId", "exerciseKey") do update set ' +
        `"sessions" = ${RECORD_TABLE}."sessions" + excluded."sessions", ` +
        `"totalSets" = ${RECORD_TABLE}."totalSets" + excluded."totalSets", ` +
        `"totalReps" = ${RECORD_TABLE}."totalReps" + excluded."totalReps", ` +
        `"totalVolume" = ${RECORD_TABLE}."totalVolume" + excluded."totalVolume", ` +
        `${keep("maxWeightReps", 'excluded."maxWeightReps"')}, ` +
        `${keep("maxWeightWorkoutId", 'excluded."maxWeightWorkoutId"')}, ` +
        `${keep("maxWeightDate", 'excluded."maxWeightDate"')}, ` +
        `${keep("maxWeight", 'excluded."maxWeight"')}, ` +
        `"lastPerformedAt" = case when excluded."lastPerformedAt" > ${RECORD_TABLE}."lastPerformedAt" then excluded."lastPerformedAt" else ${RECORD_TABLE}."lastPerformedAt" end`,
    )
    .bind(userId, JSON.stringify(payload), ...guard.params);
};

const upsertWeeklyDeltas = (
  db: Queryable,
  userId: string,
  deltas: readonly WeeklyDelta[],
  guard: Guard,
): Statement =>
  db
    .prepare(
      'insert into "weeklyStats" ("userId", "weekStart", "workouts", "exercises", "sets", "volume", "durationSeconds") ' +
        "select ?, json_extract(j.value, '$.weekStart'), json_extract(j.value, '$.workouts'), json_extract(j.value, '$.exercises'), json_extract(j.value, '$.sets'), json_extract(j.value, '$.volume'), json_extract(j.value, '$.durationSeconds') " +
        `from json_each(?) as j where ${guard.sql} ` +
        'on conflict ("userId", "weekStart") do update set ' +
        '"workouts" = "weeklyStats"."workouts" + excluded."workouts", ' +
        '"exercises" = "weeklyStats"."exercises" + excluded."exercises", ' +
        '"sets" = "weeklyStats"."sets" + excluded."sets", ' +
        '"volume" = "weeklyStats"."volume" + excluded."volume", ' +
        '"durationSeconds" = "weeklyStats"."durationSeconds" + excluded."durationSeconds"',
    )
    .bind(userId, JSON.stringify(deltas), ...guard.params);

export type WorkoutContributionChange = {
  workoutId: string;
  removed: readonly ContributionRow[];
  added: readonly ContributionRow[];
  weeklyRemoved: WeeklyDelta | null;
  weeklyAdded: WeeklyDelta | null;
};

// Statements that swap one workout's old contribution for its new one.
// Callers put them in the same batch as the workouts UPDATE, before it, with
// a guard on the workout's current revision.
export const buildContributionStatements = (
  db: Queryable,
  userId: string,
  guard: Guard,
  change: WorkoutContributionChange,
): Statement[] => {
  const statements: Statement[] = [];

  if (change.removed.length > 0) {
    statements.push(
      db
        .prepare(`delete from "workoutExercises" where "workoutId" = ? and "userId" = ? and ${guard.sql}`)
        .bind(change.workoutId, userId, ...guard.params),
    );
  }
  if (change.added.length > 0) {
    statements.push(insertContributions(db, userId, change.added, guard));
  }

  const recordDeltas = recordDeltasOf(change.removed, change.added);
  if (recordDeltas.length > 0) {
    const touched = JSON.stringify(recordDeltas.map((delta) => delta.exerciseKey));
    statements.push(upsertRecordDeltas(db, userId, recordDeltas, guard));

    // A workout that held a lifetime max may have lost or lowered it:
    // recompute from that exercise's own rows via the (userId, exerciseKey,
    // date) index.
    const shrunk = JSON.stringify(change.removed.map((row) => row.exerciseKey));
    if (change.removed.length > 0) {
      statements.push(
        db
          .prepare(
            'update "exerciseRecords" set ("maxWeight", "maxWeightReps", "maxWeightWorkoutId", "maxWeightDate") = (' +
              'select w."maxWeight", w."maxWeightReps", w."workoutId", w."date" from "workoutExercises" as w ' +
              'where w."userId" = "exerciseRecords"."userId" and w."exerciseKey" = "exerciseRecords"."exerciseKey" ' +
              'order by w."maxWeight" desc, w."date" asc, w."workoutId" asc limit 1) ' +
              'where "userId" = ? and "maxWeightWorkoutId" = ? and "sessions" > 0 ' +
              `and "exerciseKey" in (select value from json_each(?)) and ${guard.sql}`,
          )
          .bind(userId, change.workoutId, shrunk, ...guard.params),
      );
    }
    statements.push(
      db
        .prepare(
          'update "exerciseRecords" set "lastPerformedAt" = coalesce((' +
            'select max(w."date") from "workoutExercises" as w ' +
            'where w."userId" = "exerciseRecords"."userId" and w."exerciseKey" = "exerciseRecords"."exerciseKey"), "lastPerformedAt") ' +
            `where "userId" = ? and "exerciseKey" in (select value from json_each(?)) and ${guard.sql}`,
        )
        .bind(userId, touched, ...guard.params),
    );
    statements.push(
      db
        .prepare(
          'delete from "exerciseRecords" where "userId" = ? and "sessions" <= 0 ' +
            'and "exerciseKey" in (select value from json_each(?))',
        )
        .bind(userId, touched),
    );
  }

  const weekly = mergeWeekly([
    ...(change.weeklyRemoved === null ? [] : [negateWeekly(change.weeklyRemoved)]),
    ...(change.weeklyAdded === null ? [] : [change.weeklyAdded]),
  ]).filter(
    (delta) =>
      delta.workouts !== 0 ||
      delta.exercises !== 0 ||
      delta.sets !== 0 ||
      delta.volume !== 0 ||
      delta.durationSeconds !== 0,
  );
  if (weekly.length > 0) {
    statements.push(upsertWeeklyDeltas(db, userId, weekly, guard));
    statements.push(
      db
        .prepare(
          'delete from "weeklyStats" where "userId" = ? and "workouts" <= 0 ' +
            'and "weekStart" in (select value from json_each(?))',
        )
        .bind(userId, JSON.stringify(weekly.map((delta) => delta.weekStart))),
    );
  }

  return statements;
};

export const readContributionRows = (result: unknown): ContributionRow[] =>
  rowsFromResult(result).map((value) => {
    const row = rowFrom(value);
    return {
      workoutId: rowText(row, "workoutId"),
      exerciseKey: rowText(row, "exerciseKey"),
      exerciseName: rowText(row, "exerciseName"),
      date: rowText(row, "date"),
      sets: rowInteger(row, "sets"),
      reps: rowInteger(row, "reps"),
      volume: rowNumber(row, "volume"),
      maxWeight: rowNumber(row, "maxWeight"),
      maxWeightReps: rowInteger(row, "maxWeightReps"),
    };
  });

export type StatsState = {
  timeZone: string | null;
  statsVersion: number;
  statsCursor: string | null;
  weeklyWorkoutGoal: number | null;
  fitnessLevel: FitnessLevel | undefined;
};

export const STATS_STATE_SQL =
  'select "timeZone", "statsVersion", "statsCursor", "weeklyWorkoutGoal", "fitnessLevel" from "profiles" where "userId" = ? limit 1';

export const toStatsState = (value: unknown): StatsState | null => {
  if (value === null || value === undefined) return null;
  const row = rowFrom(value);
  return {
    timeZone: rowNullableText(row, "timeZone"),
    statsVersion: rowInteger(row, "statsVersion"),
    statsCursor: rowNullableText(row, "statsCursor"),
    weeklyWorkoutGoal: rowNullableInteger(row, "weeklyWorkoutGoal"),
    fitnessLevel: toFitnessLevel(row.fitnessLevel),
  };
};

export const getStatsState = async (db: Queryable, userId: string): Promise<StatsState | null> =>
  toStatsState(await db.prepare(STATS_STATE_SQL).bind(userId).first());

export const statsTimeZone = (state: StatsState | null): string => resolveTimeZone(state?.timeZone);

export const isStatsStale = (state: StatsState | null): boolean =>
  state !== null && state.statsVersion < CURRENT_STATS_VERSION;

type RebuildCursor = { date: string; createdAt: string; id: string };

const parseRebuildCursor = (text: string | null): RebuildCursor | null => {
  if (text === null) return null;
  let parsed: unknown;
  try {
    parsed = parseJson(text);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  const { date, createdAt, id } = parsed;
  if (typeof date !== "string" || typeof createdAt !== "string" || typeof id !== "string") {
    return null;
  }
  return { date, createdAt, id };
};

// Rebuilds one bounded page of a user's rollups from `workouts`.
//
// Completed workouts are folded in (date, createdAt, id) order; the cursor
// lives on the profile so the work can span requests. Every statement is
// guarded on the profile still holding the cursor this page started from, so
// a concurrent write that restarts the rebuild (cursor -> null) or a second
// request racing on the same page cannot double count.
export const advanceStatsRebuild = async (
  db: Queryable,
  userId: string,
  state: StatsState,
): Promise<StatsStatus> => {
  if (!isStatsStale(state)) return "ready";

  const timeZone = statsTimeZone(state);
  const cursor = parseRebuildCursor(state.statsCursor);
  const startCursor = state.statsCursor;
  const columns =
    '"id", "date", "createdAt", "duration", "exercises", "totalSets", "totalVolume", "exerciseCount"';
  const page =
    cursor === null
      ? db
          .prepare(
            `select ${columns} from "workouts" where "userId" = ? and "isActive" = 0 order by "date", "createdAt", "id" limit ?`,
          )
          .bind(userId, REBUILD_PAGE_SIZE)
      : db
          .prepare(
            `select ${columns} from "workouts" where "userId" = ? and "isActive" = 0 and "date" >= ? ` +
              'and ("date", "createdAt", "id") > (?, ?, ?) order by "date", "createdAt", "id" limit ?',
          )
          .bind(userId, cursor.date, cursor.date, cursor.createdAt, cursor.id, REBUILD_PAGE_SIZE);
  const rows = rowsFromResult(await page.all());

  const contributions: ContributionRow[] = [];
  const weekly: WeeklyDelta[] = [];
  let last: RebuildCursor | null = cursor;
  for (const value of rows) {
    const row = rowFrom(value);
    const id = rowText(row, "id");
    const date = rowText(row, "date");
    const createdAt = rowText(row, "createdAt");
    contributions.push(
      ...contributionsOf(id, date, parseStoredExercises(row.exercises)),
    );
    weekly.push(
      weeklyContributionOf(
        {
          date,
          duration: rowNumber(row, "duration"),
          exerciseCount: rowInteger(row, "exerciseCount"),
          totalSets: rowInteger(row, "totalSets"),
          totalVolume: rowNumber(row, "totalVolume"),
        },
        timeZone,
      ),
    );
    last = { date, createdAt, id };
  }

  const done = rows.length < REBUILD_PAGE_SIZE;
  const guard = rebuildGuard(userId, startCursor);
  const statements: Statement[] = [];

  if (cursor === null) {
    for (const table of ["workoutExercises", "exerciseRecords", "weeklyStats"]) {
      statements.push(
        db
          .prepare(`delete from "${table}" where "userId" = ? and ${guard.sql}`)
          .bind(userId, ...guard.params),
      );
    }
  }
  if (contributions.length > 0) {
    statements.push(insertContributions(db, userId, contributions, guard));
    statements.push(upsertRecordDeltas(db, userId, recordDeltasOf([], contributions), guard));
  }
  const weeklyDeltas = mergeWeekly(weekly);
  if (weeklyDeltas.length > 0) {
    statements.push(upsertWeeklyDeltas(db, userId, weeklyDeltas, guard));
  }
  statements.push(
    db
      .prepare(
        'update "profiles" set "statsCursor" = ?, "statsVersion" = ? ' +
          'where "userId" = ? and "statsVersion" < ? and "statsCursor" is ?',
      )
      .bind(
        done || last === null ? null : JSON.stringify(last),
        done ? CURRENT_STATS_VERSION : state.statsVersion,
        userId,
        CURRENT_STATS_VERSION,
        startCursor,
      ),
  );

  const results = await db.batch(statements);
  const applied = changesOf(results[results.length - 1]) > 0;
  return done && applied ? "ready" : "rebuilding";
};

// Reads only need to know whether rollups can be trusted; this advances the
// rebuild by one page when they cannot.
export const ensureStatsFresh = async (
  db: Queryable,
  userId: string,
  state: StatsState | null,
): Promise<StatsStatus> => {
  if (state === null || !isStatsStale(state)) return "ready";
  return advanceStatsRebuild(db, userId, state);
};
