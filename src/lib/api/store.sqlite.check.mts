import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import {
  deleteWeightForUser,
  getActiveWorkoutForUser,
  getExerciseStatsForUser,
  getProfileForUser,
  getWeightGoalForUser,
  getWorkoutForUser,
  getWorkoutSummaryForUser,
  listWeightEntriesForUser,
  listWorkoutsForUser,
  logWeightForUser,
  setWeightGoalForUser,
  startWorkoutForUser,
  updateWeightForUser,
  updateWorkoutForUser,
  upsertProfileForUser,
} from "./store.server.ts";
import {
  parseLogWeightInput,
  parseUpdateWeightInput,
  parseUpdateWorkoutInput,
} from "./parsers.ts";

const AUTH_SQL = readFileSync(
  join(import.meta.dir, "..", "..", "db", "migrations", "0001_auth.sql"),
  "utf8",
);
const APP_SQL = readFileSync(
  join(import.meta.dir, "..", "..", "db", "migrations", "0002_app.sql"),
  "utf8",
);

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const ISO_NOW = "2026-09-16T12:00:00.000Z";
const BASE_TIME = new Date(ISO_NOW);

const toQueryable = (database) => ({
  prepare: (query) => {
    const statement = database.prepare(query);
    const bound = (values) => ({
      bind: (...next) => bound([...values, ...next]),
      first: async () => {
        const row = statement.get(...values);
        return row === undefined || row === null ? null : row;
      },
      all: async () => ({ results: statement.all(...values) }),
      run: async () => ({ meta: { changes: statement.run(...values).changes } }),
    });
    return bound([]);
  },
});

const countRows = (database, sql, ...params) =>
  database.prepare(sql).get(...params)?.total ?? -1;

const insertUser = (database, id) => {
  database
    .prepare(
      'insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt") values (?, ?, ?, ?, ?, ?)',
    )
    .run(id, "Lifter", `${id}@example.com`, 1, ISO_NOW, ISO_NOW);
};

const insertWorkout = (database, userId, workout) => {
  database
    .prepare(
      'insert into "workouts" ("id", "userId", "date", "duration", "isActive", "exercises", "revision", "createdAt") values (?, ?, ?, ?, ?, ?, 1, ?)',
    )
    .run(
      workout.id,
      userId,
      workout.date,
      workout.duration,
      workout.isActive,
      JSON.stringify(workout.exercises ?? []),
      workout.date,
    );
};

const createStore = () => {
  const database = new Database(":memory:");
  database.exec("pragma foreign_keys = on");
  database.exec(AUTH_SQL);
  database.exec(APP_SQL);
  insertUser(database, USER_A);
  insertUser(database, USER_B);
  return { database, db: toQueryable(database) };
};

const expectAccepted = (outcome) => {
  assert.equal(outcome.ok, true, "expected the update to be accepted");
  return outcome.workout;
};

const checkOwnership = async () => {
  const { db } = createStore();
  const workout = await startWorkoutForUser(db, USER_A, ["chest"]);
  assert.notEqual(await getWorkoutForUser(db, USER_A, workout.id), null);
  assert.equal(await getWorkoutForUser(db, USER_B, workout.id), null);
  await assert.rejects(
    updateWorkoutForUser(db, USER_B, {
      id: workout.id,
      revision: workout.revision,
      updates: { notes: "hijacked" },
    }),
    /Workout not found/,
  );
  assert.equal((await getWorkoutForUser(db, USER_A, workout.id)).notes, undefined);
};

const checkSingleActiveWorkout = async () => {
  const { database, db } = createStore();
  const first = await startWorkoutForUser(db, USER_A, ["chest"]);
  const second = await startWorkoutForUser(db, USER_A, ["back"]);
  assert.equal(second.id, first.id);
  assert.deepEqual(second.bodyPartWorkedOut, ["chest"]);
  assert.equal(second.revision, 1);
  assert.equal(
    countRows(database, 'select count(*) as total from "workouts" where "isActive" = 1'),
    1,
  );

  const ended = expectAccepted(
    await updateWorkoutForUser(db, USER_A, {
      id: first.id,
      revision: first.revision,
      updates: { isActive: false, duration: 75 },
    }),
  );
  assert.equal(ended.isActive, false);

  const third = await startWorkoutForUser(db, USER_A, ["legs"]);
  assert.notEqual(third.id, first.id);
  assert.equal(third.isActive, true);
  assert.equal((await getActiveWorkoutForUser(db, USER_A)).id, third.id);
};

const checkRevisionConflicts = async () => {
  const { db } = createStore();
  const workout = await startWorkoutForUser(db, USER_A);
  const accepted = expectAccepted(
    await updateWorkoutForUser(db, USER_A, {
      id: workout.id,
      revision: workout.revision,
      updates: {
        duration: 90,
        exercises: [{ id: "ex-1", name: "Bench", sets: [{ id: "set-1", weight: 135, reps: 8 }] }],
      },
    }),
  );
  assert.equal(accepted.revision, 2);
  assert.equal(accepted.duration, 90);

  const noop = expectAccepted(
    await updateWorkoutForUser(db, USER_A, {
      id: workout.id,
      revision: accepted.revision,
      updates: {},
    }),
  );
  assert.equal(noop.revision, accepted.revision);
  assert.equal(noop.duration, 90);

  const stale = await updateWorkoutForUser(db, USER_A, {
    id: workout.id,
    revision: workout.revision,
    updates: { duration: 999 },
  });
  assert.deepEqual(stale, { ok: false, reason: "conflict" });

  const fresh = await getWorkoutForUser(db, USER_A, workout.id);
  assert.equal(fresh.duration, 90);
  assert.equal(fresh.revision, 2);
  assert.equal(fresh.exercises[0].sets[0].reps, 8);
};

const checkNoteClearing = async () => {
  const { database, db } = createStore();
  const entry = await logWeightForUser(
    db,
    USER_A,
    parseLogWeightInput({ date: ISO_NOW, weight: 181.5, note: "morning" }),
  );
  assert.equal(entry.note, "morning");

  const clearInput = parseUpdateWeightInput({ id: entry.id, note: "" });
  assert.equal(clearInput.note, null);
  const cleared = await updateWeightForUser(db, USER_A, clearInput);
  assert.equal(cleared.note, undefined);
  assert.deepEqual(
    database.prepare('select "note" from "weightEntries" where "id" = ?').get(entry.id),
    { note: null },
  );

  const renoteInput = parseUpdateWeightInput({ id: entry.id, note: "  evening  " });
  assert.equal(renoteInput.note, "evening");
  const renoted = await updateWeightForUser(db, USER_A, renoteInput);
  assert.equal(renoted.note, "evening");

  const untouched = await updateWeightForUser(db, USER_A, { id: entry.id, weight: 180 });
  assert.equal(untouched.note, "evening");

  const noteOmitted = parseUpdateWeightInput({ id: entry.id, weight: 179 });
  assert.equal("note" in noteOmitted, false);

  const workout = await startWorkoutForUser(db, USER_A);
  const noted = expectAccepted(
    await updateWorkoutForUser(
      db,
      USER_A,
      parseUpdateWorkoutInput({
        id: workout.id,
        revision: workout.revision,
        updates: { notes: "felt strong" },
      }),
    ),
  );
  assert.equal(noted.notes, "felt strong");

  const workoutCleared = expectAccepted(
    await updateWorkoutForUser(
      db,
      USER_A,
      parseUpdateWorkoutInput({
        id: workout.id,
        revision: noted.revision,
        updates: { notes: "" },
      }),
    ),
  );
  assert.equal(workoutCleared.notes, undefined);
  assert.deepEqual(
    database.prepare('select "notes" from "workouts" where "id" = ?').get(workout.id),
    { notes: null },
  );
};

const checkWeightEntries = async () => {
  const { db } = createStore();
  await assert.rejects(
    logWeightForUser(db, USER_A, {
      date: "2026-09-16T09:00:00.000Z",
      weight: 180,
      photoUrl: `/api/images/${USER_B}/photo.png`,
    }),
    /Photo does not belong to this account/,
  );

  const older = await logWeightForUser(db, USER_A, {
    date: "2026-09-10T09:00:00.000Z",
    weight: 184,
    note: "older",
  });
  const newer = await logWeightForUser(db, USER_A, {
    date: "2026-09-16T09:00:00.000Z",
    weight: 181.5,
    photoUrl: `/api/images/${USER_A}/photo.png`,
  });

  const listed = await listWeightEntriesForUser(db, USER_A, 10);
  assert.deepEqual(
    listed.map((item) => item.id),
    [newer.id, older.id],
  );
  assert.equal(listed[0].photoUrl, `/api/images/${USER_A}/photo.png`);
  assert.deepEqual(await listWeightEntriesForUser(db, USER_B, 10), []);

  const edited = await updateWeightForUser(db, USER_A, { id: older.id, weight: 183 });
  assert.equal(edited.weight, 183);
  await assert.rejects(
    updateWeightForUser(db, USER_B, { id: older.id, weight: 100 }),
    /Weight entry not found/,
  );
  await assert.rejects(deleteWeightForUser(db, USER_B, older.id), /Weight entry not found/);
  assert.deepEqual(await deleteWeightForUser(db, USER_A, older.id), { id: older.id });
};

const checkWeightGoals = async () => {
  const { database, db } = createStore();
  const created = await setWeightGoalForUser(db, USER_A, {
    targetWeight: 175,
    weeklyGoal: -1,
    startDate: "2026-09-01",
    startWeight: 185,
  });
  const updated = await setWeightGoalForUser(db, USER_A, {
    targetWeight: 170,
    weeklyGoal: -1.5,
    startDate: "2026-09-02",
    startWeight: 184.5,
  });
  assert.equal(updated.id, created.id);
  assert.equal(updated.targetWeight, 170);
  assert.equal(
    countRows(database, 'select count(*) as total from "weightGoals" where "userId" = ?', USER_A),
    1,
  );
  assert.equal(await getWeightGoalForUser(db, USER_B), null);
};

const checkProfiles = async () => {
  const { db } = createStore();
  const created = await upsertProfileForUser(
    db,
    USER_A,
    { name: "Sam", email: "sam@example.com", image: "https://lh3.googleusercontent.com/a/one" },
    { fitnessLevel: "beginner", weightUnit: "kgs" },
  );
  assert.equal(created.email, "sam@example.com");
  assert.equal(created.profilePicture, "https://lh3.googleusercontent.com/a/one");
  assert.equal(created.notificationsEnabled, true);
  assert.equal(created.weightUnit, "kgs");
  assert.equal(created.fitnessLevel, "beginner");

  const updated = await upsertProfileForUser(
    db,
    USER_A,
    { name: "Sam", email: "new@example.com", image: null },
    { name: "Samantha", notificationsEnabled: false },
  );
  assert.equal(updated.email, "new@example.com");
  assert.equal(updated.name, "Samantha");
  assert.equal(updated.notificationsEnabled, false);
  assert.equal(updated.profilePicture, "https://lh3.googleusercontent.com/a/one");

  await assert.rejects(
    upsertProfileForUser(
      db,
      USER_A,
      { name: "Sam", email: "new@example.com", image: null },
      { profilePicture: `/api/images/${USER_B}/photo.png` },
    ),
    /Profile picture does not belong to this account/,
  );
  assert.equal(await getProfileForUser(db, USER_B), null);
};

const checkProfileUpsertRace = async () => {
  const { database, db } = createStore();
  const provider = { name: "Sam", email: "sam@example.com", image: null };
  const [first, second] = await Promise.all([
    upsertProfileForUser(db, USER_A, provider, { name: "Sam" }),
    upsertProfileForUser(db, USER_A, provider, { weightUnit: "kgs" }),
  ]);
  assert.equal(first.id, second.id);
  assert.equal(
    countRows(database, 'select count(*) as total from "profiles" where "userId" = ?', USER_A),
    1,
  );
  const stored = await getProfileForUser(db, USER_A);
  assert.equal(stored.name, "Sam");
  assert.equal(stored.weightUnit, "kgs");
};

const checkSummaryFold = async () => {
  const { database, db } = createStore();
  insertWorkout(database, USER_A, {
    id: "w1",
    date: "2026-09-16T09:00:00.000Z",
    duration: 100,
    isActive: 0,
    exercises: [
      {
        id: "e1",
        name: "Bench",
        sets: [
          { id: "s1", weight: 135, reps: 8 },
          { id: "s2", weight: 145, reps: 5 },
        ],
      },
      { id: "e2", name: "Row", sets: [{ id: "s3", weight: 95, reps: 10 }] },
    ],
  });
  insertWorkout(database, USER_A, {
    id: "w2",
    date: "2026-09-15T09:00:00.000Z",
    duration: 200,
    isActive: 0,
    exercises: [{ id: "e3", name: "Bench", sets: [{ id: "s4", weight: 135, reps: 8 }] }],
  });
  insertWorkout(database, USER_A, {
    id: "w3",
    date: "2026-09-14T09:00:00.000Z",
    duration: 300,
    isActive: 0,
  });
  insertWorkout(database, USER_A, {
    id: "w4",
    date: "2026-09-07T09:00:00.000Z",
    duration: 400,
    isActive: 0,
    exercises: [{ id: "e4", name: "Bench", sets: [{ id: "s5", weight: 155, reps: 3 }] }],
  });
  insertWorkout(database, USER_A, {
    id: "w5",
    date: "2026-08-30T09:00:00.000Z",
    duration: 500,
    isActive: 0,
  });
  insertWorkout(database, USER_A, {
    id: "w6",
    date: "2026-09-16T10:00:00.000Z",
    duration: 999,
    isActive: 1,
  });

  assert.deepEqual(await getWorkoutSummaryForUser(db, USER_A, BASE_TIME), {
    totalWorkouts: 5,
    averageDuration: 300,
    totalExercises: 4,
    totalSets: 5,
    currentStreak: 3,
    longestStreak: 3,
    workoutsThisWeek: 3,
    workoutsThisMonth: 4,
  });

  assert.deepEqual(
    (await listWorkoutsForUser(db, USER_A)).map((workout) => workout.id),
    ["w6", "w1", "w2", "w3", "w4", "w5"],
  );
  assert.deepEqual(await listWorkoutsForUser(db, USER_B), []);
  assert.deepEqual(await getWorkoutSummaryForUser(db, USER_B, BASE_TIME), {
    totalWorkouts: 0,
    averageDuration: 0,
    totalExercises: 0,
    totalSets: 0,
    currentStreak: 0,
    longestStreak: 0,
    workoutsThisWeek: 0,
    workoutsThisMonth: 0,
  });
};

const checkExerciseStats = async () => {
  const { database, db } = createStore();
  insertWorkout(database, USER_A, {
    id: "w1",
    date: "2026-09-16T09:00:00.000Z",
    duration: 100,
    isActive: 0,
    exercises: [
      {
        id: "e1",
        name: "Bench",
        category: "chest",
        sets: [
          { id: "s1", weight: 135, reps: 8 },
          { id: "s2", weight: 145, reps: 5 },
        ],
      },
    ],
  });
  insertWorkout(database, USER_A, {
    id: "w2",
    date: "2026-09-15T09:00:00.000Z",
    duration: 200,
    isActive: 0,
    exercises: [{ id: "e2", name: "Bench", sets: [{ id: "s3", weight: 135, reps: 8 }] }],
  });
  insertWorkout(database, USER_A, {
    id: "w3",
    date: "2026-09-07T09:00:00.000Z",
    duration: 300,
    isActive: 0,
    exercises: [{ id: "e3", name: "Bench", sets: [{ id: "s4", weight: 155, reps: 3 }] }],
  });
  insertWorkout(database, USER_A, {
    id: "w4",
    date: "2026-09-16T10:00:00.000Z",
    duration: 999,
    isActive: 1,
    exercises: [{ id: "e4", name: "Squat", sets: [{ id: "s5", weight: 315, reps: 1 }] }],
  });

  const stats = await getExerciseStatsForUser(db, USER_A);
  assert.deepEqual(
    stats.map((stat) => stat.exerciseName),
    ["Bench"],
  );
  const bench = stats[0];
  assert.equal(bench.id, "Bench");
  assert.equal(bench.totalSets, 4);
  assert.equal(bench.totalReps, 24);
  assert.equal(bench.totalVolume, 135 * 8 + 145 * 5 + 135 * 8 + 155 * 3);
  assert.equal(bench.maxWeight, 155);
  assert.equal(bench.maxWeightReps, 3);
  assert.equal(bench.lastPerformedAt, "2026-09-16T09:00:00.000Z");
  assert.deepEqual(
    bench.weeklyHistory.map((week) => week.weekStart),
    ["2026-09-07", "2026-09-14"],
  );
  assert.deepEqual(bench.weeklyHistory[1], {
    weekStart: "2026-09-14",
    sets: 3,
    reps: 21,
    volume: 135 * 8 + 145 * 5 + 135 * 8,
    maxWeight: 145,
  });
  assert.deepEqual(await getExerciseStatsForUser(db, USER_B), []);

  for (let week = 0; week < 13; week += 1) {
    const date = new Date(BASE_TIME.getTime() - (12 - week) * 7 * 86400000);
    insertWorkout(database, USER_B, {
      id: `history-${week}`,
      date: date.toISOString(),
      duration: 60,
      isActive: 0,
      exercises: [
        { id: `ex-${week}`, name: "Deadlift", sets: [{ id: `set-${week}`, weight: 225, reps: 5 }] },
      ],
    });
  }
  const history = await getExerciseStatsForUser(db, USER_B);
  assert.equal(history.length, 1);
  assert.equal(history[0].totalSets, 13);
  assert.equal(history[0].weeklyHistory.length, 12);
  assert.equal(history[0].weeklyHistory[0].weekStart, "2026-06-29");
};

const CHECKS = [
  ["ownership scoping", checkOwnership],
  ["single active workout", checkSingleActiveWorkout],
  ["revision conflicts", checkRevisionConflicts],
  ["note clearing", checkNoteClearing],
  ["weight entries", checkWeightEntries],
  ["weight goals", checkWeightGoals],
  ["profiles", checkProfiles],
  ["profile upsert race", checkProfileUpsertRace],
  ["summary fold", checkSummaryFold],
  ["exercise stats", checkExerciseStats],
];

let failures = 0;
for (const [name, run] of CHECKS) {
  try {
    await run();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`fail - ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  console.error(`${failures} store check(s) failed`);
  process.exit(1);
}
console.log(`${CHECKS.length} store checks passed`);
