import { resolveWeeklyGoal } from "@/lib/goals";
import { bodyPartFrequency, leastRecentBodyParts } from "@/lib/stats";
import { computeWeeklyStreaks } from "@/lib/streaks";
import type {
  ExerciseHistory,
  ExerciseRecord,
  HomeSnapshot,
  LatestWorkout,
  StatsOverview,
  WeeklyExerciseData,
  WeeklyStat,
  WorkoutCursor,
  WorkoutExerciseEntry,
  WorkoutListItem,
  WorkoutPage,
} from "@/lib/types";
import {
  addDaysToKey,
  localDateKey,
  weekStartKey,
  weekStartOfKey,
  zonedMidnightIso,
} from "@/lib/weeks";
import {
  rowFlag,
  rowFrom,
  rowInteger,
  rowNumber,
  rowText,
  rowsFromResult,
  type Queryable,
} from "./db.server";
import type { ListWorkoutsInput } from "./parsers";
import {
  ensureStatsFresh,
  getStatsState,
  normalizeExerciseKey,
  statsTimeZone,
} from "./rollups.server";
import { WORKOUT_LIST_COLUMNS, parseStoredStringList, toWorkout, toWorkoutListItem } from "./rows.server";
import { toWeightEntry, toWeightGoal } from "./store.server";

const DAY_MS = 86_400_000;
const DEFAULT_PAGE_SIZE = 20;
// Home shows the last 8 local weeks: the current one plus seven before it.
const RECENT_WEEKS = 8;
const HOME_WEEKLY_STATS_WEEKS = 26;
// Streaks on the home snapshot are exact up to this many weeks; the stats
// overview reads the whole history.
const HOME_STREAK_WEEKS = 52;
const STATS_WEEKLY_STATS_ROWS = 12;
const HISTORY_WEEKS = 12;
const HOME_WEIGHT_DAYS = 30;
const HOME_WEIGHT_ROWS = 60;

const toWeeklyStat = (value: unknown): WeeklyStat => {
  const row = rowFrom(value);
  return {
    weekStart: rowText(row, "weekStart"),
    workouts: rowInteger(row, "workouts"),
    exercises: rowInteger(row, "exercises"),
    sets: rowInteger(row, "sets"),
    volume: rowNumber(row, "volume"),
    durationSeconds: rowNumber(row, "durationSeconds"),
  };
};

const toExerciseRecord = (value: unknown): ExerciseRecord => {
  const row = rowFrom(value);
  return {
    exerciseKey: rowText(row, "exerciseKey"),
    exerciseName: rowText(row, "exerciseName"),
    sessions: rowInteger(row, "sessions"),
    totalSets: rowInteger(row, "totalSets"),
    totalReps: rowInteger(row, "totalReps"),
    totalVolume: rowNumber(row, "totalVolume"),
    maxWeight: rowNumber(row, "maxWeight"),
    maxWeightReps: rowInteger(row, "maxWeightReps"),
    lastPerformedAt: rowText(row, "lastPerformedAt"),
  };
};

const toWorkoutExerciseEntry = (value: unknown): WorkoutExerciseEntry => {
  const row = rowFrom(value);
  return {
    exerciseKey: rowText(row, "exerciseKey"),
    exerciseName: rowText(row, "exerciseName"),
    sets: rowInteger(row, "sets"),
    reps: rowInteger(row, "reps"),
    volume: rowNumber(row, "volume"),
    maxWeight: rowNumber(row, "maxWeight"),
    maxWeightReps: rowInteger(row, "maxWeightReps"),
    isPersonalRecord: rowFlag(row, "isPersonalRecord") ?? false,
  };
};

const NEWEST_FIRST = 'order by "date" desc, "createdAt" desc, "id" desc';

// Keyset pagination on (date, createdAt, id), newest first. Equal dates page
// correctly because createdAt and id complete the sort key; the composite
// workouts index makes every page read exactly its rows.
export const listWorkoutsPageForUser = async (
  db: Queryable,
  userId: string,
  input: ListWorkoutsInput = {},
): Promise<WorkoutPage> => {
  const limit = input.limit ?? DEFAULT_PAGE_SIZE;
  const cursor = input.cursor;
  const statement =
    cursor === undefined
      ? db
          .prepare(
            `select ${WORKOUT_LIST_COLUMNS} from "workouts" where "userId" = ? ${NEWEST_FIRST} limit ?`,
          )
          .bind(userId, limit + 1)
      : db
          .prepare(
            `select ${WORKOUT_LIST_COLUMNS} from "workouts" where "userId" = ? and "date" <= ? ` +
              `and ("date", "createdAt", "id") < (?, ?, ?) ${NEWEST_FIRST} limit ?`,
          )
          .bind(userId, cursor.date, cursor.date, cursor.createdAt, cursor.id, limit + 1);
  const rows = rowsFromResult(await statement.all());
  const pageRows = rows.slice(0, limit);
  const last = pageRows[pageRows.length - 1];
  let nextCursor: WorkoutCursor | null = null;
  if (rows.length > limit && last !== undefined) {
    const row = rowFrom(last);
    nextCursor = {
      date: rowText(row, "date"),
      createdAt: rowText(row, "createdAt"),
      id: rowText(row, "id"),
    };
  }
  return { items: pageRows.map(toWorkoutListItem), nextCursor };
};

const LATEST_COMPLETED_ID_SQL =
  `select "id" from "workouts" where "userId" = ? and "isActive" = 0 ${NEWEST_FIRST} limit 1`;

// One session lookup and two D1 round trips (profile, then a batch) feed the
// whole home screen. Only the newest completed workout carries its exercises;
// everything else comes from summary columns and rollups.
export const getHomeSnapshotForUser = async (
  db: Queryable,
  userId: string,
  now: Date = new Date(),
): Promise<HomeSnapshot> => {
  const state = await getStatsState(db, userId);
  const status = await ensureStatsFresh(db, userId, state);
  const timeZone = statsTimeZone(state);
  const goal = resolveWeeklyGoal(state?.weeklyWorkoutGoal, state?.fitnessLevel);

  const currentWeek = weekStartKey(now, timeZone);
  const recentFrom = zonedMidnightIso(addDaysToKey(currentWeek, -(RECENT_WEEKS - 1) * 7), timeZone);
  const streakFrom = addDaysToKey(currentWeek, -(HOME_STREAK_WEEKS - 1) * 7);
  const statsFrom = addDaysToKey(currentWeek, -(HOME_WEEKLY_STATS_WEEKS - 1) * 7);
  const weightsFrom = new Date(now.getTime() - HOME_WEIGHT_DAYS * DAY_MS).toISOString();

  const [active, recent, latest, latestExercises, weekly, weights, weightGoal] = await db.batch([
    db
      .prepare('select * from "workouts" where "userId" = ? and "isActive" = 1 limit 1')
      .bind(userId),
    db
      .prepare(
        `select ${WORKOUT_LIST_COLUMNS} from "workouts" where "userId" = ? and "isActive" = 0 and "date" >= ? ${NEWEST_FIRST}`,
      )
      .bind(userId, recentFrom),
    db
      .prepare(
        `select * from "workouts" where "userId" = ? and "isActive" = 0 ${NEWEST_FIRST} limit 1`,
      )
      .bind(userId),
    db
      .prepare(
        'select we."exerciseKey", we."exerciseName", we."sets", we."reps", we."volume", we."maxWeight", we."maxWeightReps", ' +
          '(r."maxWeightWorkoutId" = we."workoutId" and we."maxWeight" > 0) as "isPersonalRecord" ' +
          'from "workoutExercises" as we ' +
          'left join "exerciseRecords" as r on r."userId" = we."userId" and r."exerciseKey" = we."exerciseKey" ' +
          `where we."userId" = ? and we."workoutId" = (${LATEST_COMPLETED_ID_SQL}) order by we."exerciseKey"`,
      )
      .bind(userId, userId),
    db
      .prepare(
        'select "weekStart", "workouts", "exercises", "sets", "volume", "durationSeconds" from "weeklyStats" ' +
          'where "userId" = ? and "weekStart" >= ? order by "weekStart"',
      )
      .bind(userId, streakFrom),
    db
      .prepare(
        'select * from "weightEntries" where "userId" = ? and "date" >= ? order by "date" desc, "createdAt" desc limit ?',
      )
      .bind(userId, weightsFrom, HOME_WEIGHT_ROWS),
    db.prepare('select * from "weightGoals" where "userId" = ? limit 1').bind(userId),
  ]);

  const activeRow = rowsFromResult(active)[0];
  const latestRow = rowsFromResult(latest)[0];
  const recentWorkouts: WorkoutListItem[] = rowsFromResult(recent).map(toWorkoutListItem);
  const weeklyRows = rowsFromResult(weekly).map(toWeeklyStat);
  const weightGoalRow = rowsFromResult(weightGoal)[0];

  const latestWorkout: LatestWorkout | null =
    latestRow === undefined
      ? null
      : {
          workout: toWorkout(latestRow),
          exercises: rowsFromResult(latestExercises).map(toWorkoutExerciseEntry),
        };

  return {
    status,
    activeWorkout: activeRow === undefined ? null : toWorkout(activeRow),
    recentWorkouts,
    latestWorkout,
    weeklyStats: weeklyRows.filter((week) => week.weekStart >= statsFrom),
    weeklyWorkoutGoal: goal,
    streak: computeWeeklyStreaks(weeklyRows, goal, currentWeek),
    weights: rowsFromResult(weights).map(toWeightEntry),
    weightGoal: weightGoalRow === undefined ? null : toWeightGoal(weightGoalRow),
    leastRecentBodyParts: leastRecentBodyParts(recentWorkouts),
  };
};

export const getStatsOverviewForUser = async (
  db: Queryable,
  userId: string,
  now: Date = new Date(),
): Promise<StatsOverview> => {
  const state = await getStatsState(db, userId);
  const status = await ensureStatsFresh(db, userId, state);
  const timeZone = statsTimeZone(state);
  const goal = resolveWeeklyGoal(state?.weeklyWorkoutGoal, state?.fitnessLevel);

  const today = localDateKey(now, timeZone);
  const currentWeek = weekStartOfKey(today);
  const recentFrom = zonedMidnightIso(addDaysToKey(currentWeek, -(RECENT_WEEKS - 1) * 7), timeZone);
  const monthStart = zonedMidnightIso(`${today.slice(0, 8)}01`, timeZone);

  const [weekly, records, recent] = await db.batch([
    db
      .prepare(
        'select "weekStart", "workouts", "exercises", "sets", "volume", "durationSeconds" from "weeklyStats" ' +
          'where "userId" = ? order by "weekStart"',
      )
      .bind(userId),
    db
      .prepare(
        'select "exerciseKey", "exerciseName", "sessions", "totalSets", "totalReps", "totalVolume", "maxWeight", "maxWeightReps", "lastPerformedAt" ' +
          'from "exerciseRecords" where "userId" = ? order by "lastPerformedAt" desc, "exerciseKey"',
      )
      .bind(userId),
    db
      .prepare(
        'select "date", "bodyPartWorkedOut" from "workouts" where "userId" = ? and "isActive" = 0 and "date" >= ?',
      )
      .bind(userId, recentFrom),
  ]);

  const weeks = rowsFromResult(weekly).map(toWeeklyStat);
  let totalWorkouts = 0;
  let totalExercises = 0;
  let totalSets = 0;
  let totalDuration = 0;
  for (const week of weeks) {
    totalWorkouts += week.workouts;
    totalExercises += week.exercises;
    totalSets += week.sets;
    totalDuration += week.durationSeconds;
  }

  const recentRows = rowsFromResult(recent).map((value) => {
    const row = rowFrom(value);
    const bodyPartWorkedOut = parseStoredStringList(row.bodyPartWorkedOut);
    return {
      date: rowText(row, "date"),
      ...(bodyPartWorkedOut === null ? {} : { bodyPartWorkedOut }),
    };
  });

  return {
    status,
    totalWorkouts,
    averageDuration: totalWorkouts === 0 ? 0 : Math.round(totalDuration / totalWorkouts),
    totalExercises,
    totalSets,
    workoutsThisWeek: weeks.find((week) => week.weekStart === currentWeek)?.workouts ?? 0,
    workoutsThisMonth: recentRows.filter((workout) => workout.date >= monthStart).length,
    weeklyWorkoutGoal: goal,
    streak: computeWeeklyStreaks(weeks, goal, currentWeek),
    weeklyStats: weeks.slice(-STATS_WEEKLY_STATS_ROWS),
    exercises: rowsFromResult(records).map(toExerciseRecord),
    bodyPartFrequency: bodyPartFrequency(recentRows, now, RECENT_WEEKS),
  };
};

// Weekly history for one exercise, read lazily (a chart opening) from its own
// rows through the (userId, exerciseKey, date) index.
export const getExerciseHistoryForUser = async (
  db: Queryable,
  userId: string,
  exerciseKey: string,
  now: Date = new Date(),
): Promise<ExerciseHistory> => {
  const state = await getStatsState(db, userId);
  const timeZone = statsTimeZone(state);
  const key = normalizeExerciseKey(exerciseKey);
  const from = zonedMidnightIso(
    addDaysToKey(weekStartKey(now, timeZone), -(HISTORY_WEEKS - 1) * 7),
    timeZone,
  );
  const result = await db
    .prepare(
      'select "date", "sets", "reps", "volume", "maxWeight" from "workoutExercises" ' +
        'where "userId" = ? and "exerciseKey" = ? and "date" >= ? order by "date"',
    )
    .bind(userId, key, from)
    .all();

  const weeks = new Map<string, WeeklyExerciseData>();
  for (const value of rowsFromResult(result)) {
    const row = rowFrom(value);
    const weekStart = weekStartKey(rowText(row, "date"), timeZone);
    let week = weeks.get(weekStart);
    if (week === undefined) {
      week = { weekStart, sets: 0, reps: 0, volume: 0, maxWeight: 0 };
      weeks.set(weekStart, week);
    }
    week.sets += rowInteger(row, "sets");
    week.reps += rowInteger(row, "reps");
    week.volume += rowNumber(row, "volume");
    week.maxWeight = Math.max(week.maxWeight, rowNumber(row, "maxWeight"));
  }
  return { exerciseKey: key, weeks: Array.from(weeks.values()) };
};
