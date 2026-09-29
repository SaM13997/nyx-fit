import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import {
  deleteWeightForUser,
  getActiveWorkoutForUser,
  getProfileForUser,
  getWeightGoalForUser,
  getWorkoutForUser,
  listWeightEntriesForUser,
  logWeightForUser,
  startWorkoutForUser,
  updateWeightForUser,
  updateWorkoutForUser,
  upsertProfileForUser,
} from "./store.server.ts";
import {
  getExerciseHistoryForUser,
  getHomeSnapshotForUser,
  getStatsOverviewForUser,
  listWorkoutsPageForUser,
} from "./reads.server.ts";
import {
  CURRENT_STATS_VERSION,
  REBUILD_PAGE_SIZE,
  ensureStatsFresh,
  getStatsState,
  totalsOf,
} from "./rollups.server.ts";
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

const STATS_SQL = readFileSync(
  join(import.meta.dir, "..", "..", "db", "migrations", "0003_stats.sql"),
  "utf8",
);

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const ISO_NOW = "2026-09-16T12:00:00.000Z";
const BASE_TIME = new Date(ISO_NOW);

const isRowQuery = (query) => /^\s*select\b|\breturning\b/i.test(query);

// Mirrors the D1 surface the store uses. batch() runs its statements in one
// transaction and rolls everything back if any of them throws, like D1.
const toQueryable = (database, counters = { prepares: 0, batches: 0 }) => ({
  counters,
  prepare: (query) => {
    counters.prepares += 1;
    const statement = database.prepare(query);
    const bound = (values) => ({
      bind: (...next) => bound([...values, ...next]),
      first: async () => {
        const row = statement.get(...values);
        return row === undefined || row === null ? null : row;
      },
      all: async () => ({ results: statement.all(...values) }),
      run: async () => ({ meta: { changes: statement.run(...values).changes } }),
      exec: () => {
        if (isRowQuery(query)) {
          const results = statement.all(...values);
          return { results, meta: { changes: database.prepare("select changes() as c").get().c } };
        }
        return { results: [], meta: { changes: statement.run(...values).changes } };
      },
    });
    return bound([]);
  },
  batch: async (statements) => {
    counters.batches += 1;
    database.exec("begin");
    try {
      const results = statements.map((statement) => statement.exec());
      database.exec("commit");
      return results;
    } catch (error) {
      database.exec("rollback");
      throw error;
    }
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
  const exercises = workout.exercises ?? [];
  const totals = totalsOf(exercises);
  database
    .prepare(
      'insert into "workouts" ("id", "userId", "date", "duration", "isActive", "exercises", "bodyPartWorkedOut", "revision", "createdAt", "updatedAt", "totalVolume", "totalSets", "exerciseCount") values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)',
    )
    .run(
      workout.id,
      userId,
      workout.date,
      workout.duration,
      workout.isActive,
      JSON.stringify(exercises),
      workout.bodyParts === undefined ? null : JSON.stringify(workout.bodyParts),
      workout.createdAt ?? workout.date,
      workout.createdAt ?? workout.date,
      totals.totalVolume,
      totals.totalSets,
      totals.exerciseCount,
    );
};

const createStore = () => {
  const database = new Database(":memory:");
  database.exec("pragma foreign_keys = on");
  database.exec(AUTH_SQL);
  database.exec(APP_SQL);
  database.exec(STATS_SQL);
  insertUser(database, USER_A);
  insertUser(database, USER_B);
  const db = toQueryable(database);
  db.__database = database;
  return { database, db, counters: db.counters };
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

  const staleNoop = await updateWorkoutForUser(db, USER_A, {
    id: workout.id,
    revision: workout.revision,
    updates: {},
  });
  assert.deepEqual(staleNoop, { ok: false, reason: "conflict" });

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

const checkWeightGoalRead = async () => {
  const { database, db } = createStore();
  assert.equal(await getWeightGoalForUser(db, USER_A), null);
  database
    .prepare(
      'insert into "weightGoals" ("id", "userId", "targetWeight", "weeklyGoal", "startDate", "startWeight") values (?, ?, ?, ?, ?, ?)',
    )
    .run("goal-1", USER_A, 175, -1, "2026-09-01", 185);
  const goal = await getWeightGoalForUser(db, USER_A);
  assert.equal(goal.id, "goal-1");
  assert.equal(goal.targetWeight, 175);
  assert.equal(await getWeightGoalForUser(db, USER_B), null);
};

const checkReactivationConflict = async () => {
  const { database, db } = createStore();
  const first = await startWorkoutForUser(db, USER_A, ["chest"]);
  const ended = expectAccepted(
    await updateWorkoutForUser(db, USER_A, {
      id: first.id,
      revision: first.revision,
      updates: { isActive: false },
    }),
  );
  const second = await startWorkoutForUser(db, USER_A, ["back"]);
  assert.notEqual(second.id, first.id);

  const outcome = await updateWorkoutForUser(db, USER_A, {
    id: first.id,
    revision: ended.revision,
    updates: { isActive: true },
  });
  assert.deepEqual(outcome, { ok: false, reason: "active-exists" });
  assert.equal(
    countRows(
      database,
      'select count(*) as total from "workouts" where "userId" = ? and "isActive" = 1',
      USER_A,
    ),
    1,
  );
  assert.equal((await getWorkoutForUser(db, USER_A, first.id)).isActive, false);
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

const LA = "America/Los_Angeles";

const set = (id, weight, reps) => ({ id, weight, reps });

const setupProfile = async (db, userId, updates = {}) => {
  await upsertProfileForUser(
    db,
    userId,
    { name: "Lifter", email: `${userId}@example.com`, image: null },
    updates,
  );
  // New profiles start at statsVersion 0; the first read normally settles it.
  await rebuildAll(db, userId);
};

const rebuildAll = async (db, userId) => {
  const database = db.__database;
  database
    .prepare('update "profiles" set "statsVersion" = 0, "statsCursor" = null where "userId" = ?')
    .run(userId);
  let rounds = 0;
  for (;;) {
    rounds += 1;
    assert.ok(rounds < 100, "rebuild did not finish");
    const state = await getStatsState(db, userId);
    if ((await ensureStatsFresh(db, userId, state)) === "ready") return rounds;
  }
};

const dumpRollups = (database, userId) => ({
  contributions: database
    .prepare(
      'select "workoutId", "exerciseKey", "exerciseName", "date", "sets", "reps", "volume", "maxWeight", "maxWeightReps" from "workoutExercises" where "userId" = ? order by "workoutId", "exerciseKey"',
    )
    .all(userId),
  records: database
    .prepare('select * from "exerciseRecords" where "userId" = ? order by "exerciseKey"')
    .all(userId),
  weekly: database
    .prepare('select * from "weeklyStats" where "userId" = ? order by "weekStart"')
    .all(userId),
});

// The incremental write path must land exactly where a from-scratch rebuild
// does; this rebuilds in place and compares.
const assertMatchesRebuild = async (database, db, userId, label) => {
  const incremental = dumpRollups(database, userId);
  await rebuildAll(db, userId);
  assert.deepEqual(incremental, dumpRollups(database, userId), `rebuild differs: ${label}`);
};

const complete = async (db, userId, { exercises, date, duration = 3600 }) => {
  const started = await startWorkoutForUser(db, userId, ["chest"]);
  const edited = expectAccepted(
    await updateWorkoutForUser(db, userId, {
      id: started.id,
      revision: started.revision,
      updates: { exercises, ...(date === undefined ? {} : { date }) },
    }),
  );
  return expectAccepted(
    await updateWorkoutForUser(db, userId, {
      id: edited.id,
      revision: edited.revision,
      updates: { isActive: false, duration, endTime: ISO_NOW },
    }),
  );
};

const editWorkout = async (db, userId, id, updates) => {
  const current = await getWorkoutForUser(db, userId, id);
  return expectAccepted(
    await updateWorkoutForUser(db, userId, { id, revision: current.revision, updates }),
  );
};

const record = (database, userId, key) =>
  database
    .prepare('select * from "exerciseRecords" where "userId" = ? and "exerciseKey" = ?')
    .get(userId, key) ?? undefined;

const checkMigrationBackfill = async () => {
  const database = new Database(":memory:");
  database.exec("pragma foreign_keys = on");
  database.exec(AUTH_SQL);
  database.exec(APP_SQL);
  insertUser(database, USER_A);
  const legacy = [
    ["l1", [{ id: "e1", name: "Bench", sets: [set("s1", 135.5, 8), set("s2", 145, 5)] }, { id: "e2", name: "Row", sets: [] }]],
    ["l2", []],
    ["l3", [{ id: "e3", name: "Squat", sets: [set("s3", 225, 3)] }]],
  ];
  for (const [id, exercises] of legacy) {
    database
      .prepare(
        'insert into "workouts" ("id", "userId", "date", "duration", "isActive", "exercises", "revision", "createdAt") values (?, ?, ?, 60, 0, ?, 1, ?)',
      )
      .run(id, USER_A, ISO_NOW, JSON.stringify(exercises), `created-${id}`);
  }
  database.exec(STATS_SQL);
  for (const [id, exercises] of legacy) {
    const row = database.prepare('select * from "workouts" where "id" = ?').get(id);
    const totals = totalsOf(exercises);
    assert.equal(row.exerciseCount, totals.exerciseCount, id);
    assert.equal(row.totalSets, totals.totalSets, id);
    assert.equal(row.totalVolume, totals.totalVolume, id);
    assert.equal(row.updatedAt, `created-${id}`);
  }
  assert.equal(
    countRows(database, 'select count(*) as total from "workoutExercises"'),
    0,
  );
  const indexes = database
    .prepare("select name from sqlite_master where type = 'index' and tbl_name = 'workouts'")
    .all()
    .map((row) => row.name);
  assert.ok(indexes.includes("workouts_userId_date_created_idx"));
  assert.ok(!indexes.includes("workouts_userId_date_idx"));
};

const checkActiveEditsSkipRollups = async () => {
  const { database, db, counters } = createStore();
  await setupProfile(db, USER_A, { timeZone: LA });
  let workout = await startWorkoutForUser(db, USER_A, ["chest"]);
  const exercises = [{ id: "e1", name: "Bench", sets: [set("s1", 135, 8)] }];
  for (let index = 0; index < 4; index += 1) {
    exercises[0].sets.push(set(`s${index + 2}`, 135, 8));
    const preparesBefore = counters.prepares;
    const batchesBefore = counters.batches;
    const changesBefore = database.prepare("select total_changes() as c").get().c;
    workout = expectAccepted(
      await updateWorkoutForUser(db, USER_A, {
        id: workout.id,
        revision: workout.revision,
        updates: { exercises },
      }),
    );
    // Exactly one statement, no batch and one changed row: the workouts row.
    assert.equal(counters.prepares - preparesBefore, 1);
    assert.equal(counters.batches - batchesBefore, 0);
    assert.equal(database.prepare("select total_changes() as c").get().c - changesBefore, 1);
  }
  const stored = database.prepare('select * from "workouts" where "id" = ?').get(workout.id);
  assert.equal(stored.totalSets, 5);
  assert.equal(stored.totalVolume, 135 * 8 * 5);
  assert.equal(stored.exerciseCount, 1);
  assert.notEqual(stored.updatedAt, null);
  assert.deepEqual(dumpRollups(database, USER_A), { contributions: [], records: [], weekly: [] });
};

const checkIncrementalRollups = async () => {
  const { database, db } = createStore();
  await setupProfile(db, USER_A, { timeZone: LA });

  // 22:00 Sunday in Los Angeles is Monday in UTC: it must land in the
  // earlier local week.
  const w1 = await complete(db, USER_A, {
    date: "2026-09-14T05:00:00.000Z",
    duration: 3000,
    exercises: [
      { id: "e1", name: "Bench", sets: [set("s1", 135, 8), set("s2", 145, 5)] },
      { id: "e2", name: "Squat", sets: [set("s3", 225, 5)] },
    ],
  });
  const w2 = await complete(db, USER_A, {
    date: "2026-09-15T18:00:00.000Z",
    duration: 2000,
    exercises: [
      { id: "e3", name: "Bench", sets: [set("s4", 135, 8)] },
      { id: "e4", name: " bench ", sets: [set("s5", 155, 3)] },
    ],
  });
  const w3 = await complete(db, USER_A, {
    date: "2026-09-08T18:00:00.000Z",
    duration: 1000,
    exercises: [{ id: "e5", name: "Bench", sets: [set("s6", 145, 5)] }],
  });

  const bench = record(database, USER_A, "bench");
  assert.equal(bench.exerciseName, "Bench");
  assert.equal(bench.sessions, 3);
  assert.equal(bench.totalSets, 5);
  assert.equal(bench.totalReps, 29);
  assert.equal(bench.totalVolume, 135 * 8 + 145 * 5 + 135 * 8 + 155 * 3 + 145 * 5);
  assert.equal(bench.maxWeight, 155);
  assert.equal(bench.maxWeightReps, 3);
  assert.equal(bench.maxWeightWorkoutId, w2.id);
  assert.equal(bench.lastPerformedAt, "2026-09-15T18:00:00.000Z");
  assert.equal(record(database, USER_A, "squat").sessions, 1);
  assert.deepEqual(
    database
      .prepare('select "weekStart", "workouts", "exercises", "sets", "durationSeconds" from "weeklyStats" where "userId" = ? order by "weekStart"')
      .all(USER_A),
    [
      { weekStart: "2026-09-07", workouts: 2, exercises: 3, sets: 4, durationSeconds: 4000 },
      { weekStart: "2026-09-14", workouts: 1, exercises: 2, sets: 2, durationSeconds: 2000 },
    ],
  );
  await assertMatchesRebuild(database, db, USER_A, "initial completions");

  // Edit a completed workout: new sets, then a new date in another week.
  await editWorkout(db, USER_A, w2.id, {
    exercises: [{ id: "e3", name: "Bench", sets: [set("s4", 165, 1), set("s7", 100, 10)] }],
  });
  assert.equal(record(database, USER_A, "bench").maxWeight, 165);
  await assertMatchesRebuild(database, db, USER_A, "edit sets");

  await editWorkout(db, USER_A, w2.id, { date: "2026-09-01T18:00:00.000Z", duration: 2500 });
  assert.deepEqual(
    database
      .prepare('select "weekStart" from "weeklyStats" where "userId" = ? order by "weekStart"')
      .all(USER_A)
      .map((row) => row.weekStart),
    ["2026-08-31", "2026-09-07"],
  );
  await assertMatchesRebuild(database, db, USER_A, "edit date");

  // The workout that held the max drops the exercise: the record falls back
  // to the earliest of the remaining 145 lifts (w3, 09-08).
  await editWorkout(db, USER_A, w2.id, { exercises: [] });
  const fallback = record(database, USER_A, "bench");
  assert.equal(fallback.sessions, 2);
  assert.equal(fallback.maxWeight, 145);
  assert.equal(fallback.maxWeightWorkoutId, w3.id);
  assert.equal(fallback.lastPerformedAt, "2026-09-14T05:00:00.000Z");
  await assertMatchesRebuild(database, db, USER_A, "drop max exercise");

  // Reopening a completed workout removes its contribution.
  await editWorkout(db, USER_A, w1.id, { isActive: true });
  assert.equal(record(database, USER_A, "squat"), undefined);
  assert.equal(record(database, USER_A, "bench").sessions, 1);
  await assertMatchesRebuild(database, db, USER_A, "reopen");

  // Finishing it again restores the rollups.
  await editWorkout(db, USER_A, w1.id, { isActive: false });
  assert.equal(record(database, USER_A, "squat").sessions, 1);
  await assertMatchesRebuild(database, db, USER_A, "complete again");

  // Two devices edit the same completed workout from the same revision: one
  // wins, the loser's guarded rollup statements must change nothing.
  const base = await getWorkoutForUser(db, USER_A, w1.id);
  const outcomes = await Promise.all(
    [225, 315].map((weight) =>
      updateWorkoutForUser(db, USER_A, {
        id: w1.id,
        revision: base.revision,
        updates: { exercises: [{ id: "e9", name: "Squat", sets: [set("s9", weight, 1)] }] },
      }),
    ),
  );
  assert.deepEqual(outcomes.map((outcome) => outcome.ok).sort(), [false, true]);
  assert.equal(record(database, USER_A, "squat").sessions, 1);
  await assertMatchesRebuild(database, db, USER_A, "racing edits");
};

const checkPersonalRecordRecompute = async () => {
  const { database, db } = createStore();
  await setupProfile(db, USER_A);
  const older = await complete(db, USER_A, {
    date: "2026-09-01T10:00:00.000Z",
    exercises: [{ id: "e1", name: "Bench", sets: [set("s1", 225, 3)] }],
  });
  const newer = await complete(db, USER_A, {
    date: "2026-09-10T10:00:00.000Z",
    exercises: [{ id: "e2", name: "Bench", sets: [set("s2", 205, 5)] }],
  });
  assert.equal(record(database, USER_A, "bench").maxWeightWorkoutId, older.id);

  await editWorkout(db, USER_A, older.id, {
    exercises: [{ id: "e1", name: "Bench", sets: [set("s1", 185, 3)] }],
  });
  const afterLowering = record(database, USER_A, "bench");
  assert.equal(afterLowering.maxWeight, 205);
  assert.equal(afterLowering.maxWeightReps, 5);
  assert.equal(afterLowering.maxWeightWorkoutId, newer.id);
  assert.equal(afterLowering.maxWeightDate, "2026-09-10T10:00:00.000Z");
  await assertMatchesRebuild(database, db, USER_A, "lowered pr");

  // Raising it again takes the record back without a recompute scan.
  await editWorkout(db, USER_A, older.id, {
    exercises: [{ id: "e1", name: "Bench", sets: [set("s1", 245, 1)] }],
  });
  assert.equal(record(database, USER_A, "bench").maxWeightWorkoutId, older.id);
  await assertMatchesRebuild(database, db, USER_A, "raised pr");

  await editWorkout(db, USER_A, older.id, { exercises: [] });
  await editWorkout(db, USER_A, newer.id, { exercises: [] });
  assert.equal(record(database, USER_A, "bench"), undefined);
  assert.deepEqual(dumpRollups(database, USER_A).records, []);
};

const checkRebuildPaging = async () => {
  const { database, db } = createStore();
  await setupProfile(db, USER_A, { timeZone: LA });
  const total = REBUILD_PAGE_SIZE * 2 + 15;
  for (let index = 0; index < total; index += 1) {
    const date = new Date(Date.parse("2026-01-05T18:00:00.000Z") + index * 2 * 86_400_000);
    insertWorkout(database, USER_A, {
      id: `p${String(index).padStart(3, "0")}`,
      date: date.toISOString(),
      duration: 100,
      isActive: 0,
      exercises: [
        { id: `e${index}`, name: "Bench", sets: [set(`s${index}`, 100 + index, 5)] },
      ],
    });
  }
  // Same-instant workouts must not be skipped or doubled across a page edge.
  insertWorkout(database, USER_A, {
    id: "tie-a",
    date: "2026-01-05T18:00:00.000Z",
    createdAt: "2026-01-05T18:00:00.001Z",
    duration: 100,
    isActive: 0,
    exercises: [{ id: "ea", name: "Bench", sets: [set("sa", 50, 5)] }],
  });
  database
    .prepare('update "profiles" set "statsVersion" = 0, "statsCursor" = null where "userId" = ?')
    .run(USER_A);

  const state = await getStatsState(db, USER_A);
  assert.equal(await ensureStatsFresh(db, USER_A, state), "rebuilding");
  const midway = await getStatsState(db, USER_A);
  assert.equal(midway.statsVersion, 0);
  assert.notEqual(midway.statsCursor, null);

  // An edit to a completed workout mid-rebuild restarts it rather than
  // leaving the partial rollups to be trusted.
  await editWorkout(db, USER_A, "p000", { notes: "note", duration: 120 });
  assert.equal((await getStatsState(db, USER_A)).statsCursor, null);

  let rounds = 1;
  for (;;) {
    rounds += 1;
    assert.ok(rounds < 20);
    if ((await ensureStatsFresh(db, USER_A, await getStatsState(db, USER_A))) === "ready") break;
  }
  assert.equal(rounds, 1 + 3 + 0, "restart needs ceil(96 / 40) pages");
  const settled = await getStatsState(db, USER_A);
  assert.equal(settled.statsVersion, CURRENT_STATS_VERSION);
  assert.equal(settled.statsCursor, null);

  const bench = record(database, USER_A, "bench");
  assert.equal(bench.sessions, total + 1);
  assert.equal(bench.totalSets, total + 1);
  assert.equal(bench.maxWeight, 100 + total - 1);
  assert.equal(countRows(database, 'select count(*) as total from "workoutExercises"'), total + 1);
  const weeklyWorkouts = database
    .prepare('select sum("workouts") as total from "weeklyStats" where "userId" = ?')
    .get(USER_A).total;
  assert.equal(weeklyWorkouts, total + 1);

  // Once settled, incremental writes take over and still agree.
  await editWorkout(db, USER_A, "p001", {
    exercises: [{ id: "e1", name: "Bench", sets: [set("s1", 300, 1)] }],
  });
  assert.equal(record(database, USER_A, "bench").maxWeight, 300);
  await assertMatchesRebuild(database, db, USER_A, "after paged rebuild");

  // Another user's data is untouched by this user's rebuild.
  assert.deepEqual(dumpRollups(database, USER_B), { contributions: [], records: [], weekly: [] });
};

const checkProfileTimeZoneAndGoal = async () => {
  const { database, db } = createStore();
  const provider = { name: "Sam", email: "sam@example.com", image: null };
  const created = await upsertProfileForUser(db, USER_A, provider, {
    fitnessLevel: "advanced",
    timeZone: "Europe/Berlin",
  });
  assert.equal(created.timeZone, "Europe/Berlin");
  assert.equal(created.weeklyWorkoutGoal, undefined);

  await rebuildAll(db, USER_A);
  const kept = await upsertProfileForUser(db, USER_A, provider, {
    timeZone: "Asia/Tokyo",
    weeklyWorkoutGoal: 6,
  });
  assert.equal(kept.timeZone, "Europe/Berlin", "the first zone learned sticks");
  assert.equal(kept.weeklyWorkoutGoal, 6);
  assert.equal((await getStatsState(db, USER_A)).statsVersion, CURRENT_STATS_VERSION);

  // Learning a zone after rollups were built with UTC weeks invalidates them.
  await upsertProfileForUser(db, USER_B, { ...provider, email: "b@example.com" }, {});
  await rebuildAll(db, USER_B);
  await upsertProfileForUser(db, USER_B, { ...provider, email: "b@example.com" }, {
    timeZone: "America/New_York",
  });
  assert.equal((await getStatsState(db, USER_B)).statsVersion, 0);
  assert.equal(
    database.prepare('select "timeZone" from "profiles" where "userId" = ?').get(USER_B).timeZone,
    "America/New_York",
  );
};

const seedHistory = (database) => {
  insertWorkout(database, USER_A, {
    id: "w1",
    date: "2026-09-16T09:00:00.000Z",
    duration: 100,
    isActive: 0,
    bodyParts: ["chest", "arms:Triceps"],
    exercises: [
      { id: "e1", name: "Bench", sets: [set("s1", 135, 8), set("s2", 145, 5)] },
      { id: "e2", name: "Row", sets: [set("s3", 95, 10)] },
    ],
  });
  insertWorkout(database, USER_A, {
    id: "w2",
    date: "2026-09-15T09:00:00.000Z",
    duration: 200,
    isActive: 0,
    bodyParts: ["back"],
    exercises: [{ id: "e3", name: "Bench", sets: [set("s4", 135, 8)] }],
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
    bodyParts: ["legs:Quads"],
    exercises: [{ id: "e4", name: "Bench", sets: [set("s5", 155, 3)] }],
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
    exercises: [{ id: "e5", name: "Squat", sets: [set("s6", 315, 1)] }],
  });
};

const checkStatsOverview = async () => {
  const { database, db } = createStore();
  seedHistory(database);
  await upsertProfileForUser(db, USER_A, { name: "L", email: "l@example.com" }, { weeklyWorkoutGoal: 3 });

  // Rollups are rebuilt lazily on the first read.
  const first = await getStatsOverviewForUser(db, USER_A, BASE_TIME);
  assert.equal(first.status, "ready");
  assert.equal(first.totalWorkouts, 5);
  assert.equal(first.averageDuration, 300);
  assert.equal(first.totalExercises, 4);
  assert.equal(first.totalSets, 5);
  assert.equal(first.workoutsThisWeek, 3);
  assert.equal(first.workoutsThisMonth, 4);
  assert.equal(first.weeklyWorkoutGoal, 3);
  // Week of 09-14 has 3 workouts (goal met); 09-07 has 1; 08-31 none, 08-24 has 1.
  assert.deepEqual(first.streak, { current: 1, longest: 1 });
  assert.deepEqual(
    first.weeklyStats.map((week) => [week.weekStart, week.workouts]),
    [["2026-08-24", 1], ["2026-09-07", 1], ["2026-09-14", 3]],
  );
  assert.deepEqual(
    first.exercises.map((exercise) => exercise.exerciseName),
    ["Bench", "Row"],
  );
  const bench = first.exercises[0];
  assert.equal(bench.sessions, 3);
  assert.equal(bench.totalSets, 4);
  assert.equal(bench.totalReps, 24);
  assert.equal(bench.totalVolume, 135 * 8 + 145 * 5 + 135 * 8 + 155 * 3);
  assert.equal(bench.maxWeight, 155);
  assert.equal(bench.maxWeightReps, 3);
  assert.equal(bench.lastPerformedAt, "2026-09-16T09:00:00.000Z");
  assert.deepEqual(first.bodyPartFrequency, [
    { bodyPart: "arms:Triceps", sessions: 1 },
    { bodyPart: "back", sessions: 1 },
    { bodyPart: "chest", sessions: 1 },
    { bodyPart: "legs:Quads", sessions: 1 },
  ]);

  const empty = await getStatsOverviewForUser(db, USER_B, BASE_TIME);
  assert.equal(empty.totalWorkouts, 0);
  assert.equal(empty.averageDuration, 0);
  assert.deepEqual(empty.streak, { current: 0, longest: 0 });
  assert.deepEqual(empty.exercises, []);

  const history = await getExerciseHistoryForUser(db, USER_A, "Bench", BASE_TIME);
  assert.equal(history.exerciseKey, "bench");
  assert.deepEqual(history.weeks, [
    { weekStart: "2026-09-07", sets: 1, reps: 3, volume: 465, maxWeight: 155 },
    { weekStart: "2026-09-14", sets: 3, reps: 21, volume: 135 * 8 + 145 * 5 + 135 * 8, maxWeight: 145 },
  ]);
  assert.deepEqual((await getExerciseHistoryForUser(db, USER_B, "bench", BASE_TIME)).weeks, []);

  for (let week = 0; week < 13; week += 1) {
    const date = new Date(BASE_TIME.getTime() - (12 - week) * 7 * 86400000);
    insertWorkout(database, USER_B, {
      id: `history-${week}`,
      date: date.toISOString(),
      duration: 60,
      isActive: 0,
      exercises: [{ id: `ex-${week}`, name: "Deadlift", sets: [set(`set-${week}`, 225, 5)] }],
    });
  }
  await upsertProfileForUser(db, USER_B, { name: "B", email: "b@example.com" }, {});
  const deadlift = await getStatsOverviewForUser(db, USER_B, BASE_TIME);
  assert.equal(deadlift.exercises[0].totalSets, 13);
  const deadliftHistory = await getExerciseHistoryForUser(db, USER_B, "deadlift", BASE_TIME);
  assert.equal(deadliftHistory.weeks.length, 12);
  assert.equal(deadliftHistory.weeks[0].weekStart, "2026-06-29");
};

const checkHomeSnapshot = async () => {
  const { database, db } = createStore();
  seedHistory(database);
  // 9 weeks back: outside the 8-week window but inside the rollups.
  insertWorkout(database, USER_A, {
    id: "old",
    date: "2026-07-13T09:00:00.000Z",
    duration: 50,
    isActive: 0,
    bodyParts: ["shoulders"],
    exercises: [{ id: "eo", name: "Press", sets: [set("so", 95, 5)] }],
  });
  await upsertProfileForUser(db, USER_A, { name: "L", email: "l@example.com" }, { fitnessLevel: "pro" });
  await logWeightForUser(db, USER_A, { date: "2026-09-10T09:00:00.000Z", weight: 180 });
  await logWeightForUser(db, USER_A, { date: "2026-07-10T09:00:00.000Z", weight: 190 });

  const snapshot = await getHomeSnapshotForUser(db, USER_A, BASE_TIME);
  assert.equal(snapshot.status, "ready");
  assert.equal(snapshot.activeWorkout.id, "w6");
  assert.deepEqual(
    snapshot.recentWorkouts.map((workout) => workout.id),
    ["w1", "w2", "w3", "w4", "w5"],
  );
  const [top] = snapshot.recentWorkouts;
  assert.deepEqual(Object.keys(top).sort(), [
    "bodyPartWorkedOut",
    "date",
    "duration",
    "exerciseCount",
    "id",
    "isActive",
    "totalSets",
    "totalVolume",
  ]);
  assert.equal(top.exerciseCount, 2);
  assert.equal(top.totalSets, 3);

  assert.equal(snapshot.latestWorkout.workout.id, "w1");
  assert.equal(snapshot.latestWorkout.workout.exercises.length, 2);
  assert.deepEqual(
    snapshot.latestWorkout.exercises.map((entry) => [entry.exerciseKey, entry.isPersonalRecord]),
    // w4 lifted 155 on 09-07 and still holds the record for bench.
    [["bench", false], ["row", true]],
  );

  assert.equal(snapshot.weeklyWorkoutGoal, 5, "pro default goal");
  assert.deepEqual(snapshot.streak, { current: 0, longest: 0 });
  assert.deepEqual(
    snapshot.weeklyStats.map((week) => week.weekStart),
    ["2026-07-13", "2026-08-24", "2026-09-07", "2026-09-14"],
  );
  assert.deepEqual(snapshot.weights.map((entry) => entry.weight), [180]);
  assert.equal(snapshot.weightGoal, null);

  const parts = snapshot.leastRecentBodyParts;
  assert.equal(parts.length, 8);
  assert.deepEqual(
    parts.slice(0, 4).map((entry) => [entry.bodyPart, entry.lastWorkedAt]),
    [["shoulders", null], ["cardio", null], ["abs", null], ["full_body", null]],
  );
  assert.equal(
    parts.find((entry) => entry.bodyPart === "chest").lastWorkedAt,
    "2026-09-16T09:00:00.000Z",
  );

  const nobody = await getHomeSnapshotForUser(db, USER_B, BASE_TIME);
  assert.equal(nobody.activeWorkout, null);
  assert.equal(nobody.latestWorkout, null);
  assert.deepEqual(nobody.recentWorkouts, []);
  assert.deepEqual(nobody.weeklyStats, []);
  assert.equal(nobody.weeklyWorkoutGoal, 3);
};

const checkWorkoutListPagination = async () => {
  const { database, db } = createStore();
  // Six workouts share one instant; createdAt and id break the tie.
  for (let index = 0; index < 6; index += 1) {
    insertWorkout(database, USER_A, {
      id: `tie-${index}`,
      date: "2026-09-10T09:00:00.000Z",
      createdAt: `2026-09-10T09:00:00.00${index % 3}Z`,
      duration: 60,
      isActive: 0,
      exercises: [{ id: `e${index}`, name: "Bench", sets: [set(`s${index}`, 100, 5)] }],
    });
  }
  insertWorkout(database, USER_A, { id: "newest", date: "2026-09-12T09:00:00.000Z", duration: 60, isActive: 0 });
  insertWorkout(database, USER_A, { id: "oldest", date: "2026-09-01T09:00:00.000Z", duration: 60, isActive: 0 });
  insertWorkout(database, USER_B, { id: "other", date: "2026-09-11T09:00:00.000Z", duration: 60, isActive: 0 });

  const expected = [
    "newest",
    "tie-5", "tie-2", "tie-4", "tie-1", "tie-3", "tie-0",
    "oldest",
  ];
  const seen = [];
  let cursor;
  let pages = 0;
  do {
    const page = await listWorkoutsPageForUser(db, USER_A, { cursor, limit: 3 });
    assert.ok(page.items.length <= 3);
    seen.push(...page.items.map((item) => item.id));
    cursor = page.nextCursor ?? undefined;
    pages += 1;
    assert.ok(pages < 10);
  } while (cursor !== undefined);
  assert.deepEqual(seen, expected);
  assert.equal(pages, 3);

  const all = await listWorkoutsPageForUser(db, USER_A, {});
  assert.equal(all.items.length, 8);
  assert.equal(all.nextCursor, null);
  const exact = await listWorkoutsPageForUser(db, USER_A, { limit: 8 });
  assert.equal(exact.nextCursor, null);
  assert.deepEqual(
    (await listWorkoutsPageForUser(db, USER_B, {})).items.map((item) => item.id),
    ["other"],
  );
  assert.equal("exercises" in all.items[0], false);
};

const CHECKS = [
  ["ownership scoping", checkOwnership],
  ["single active workout", checkSingleActiveWorkout],
  ["revision conflicts", checkRevisionConflicts],
  ["reactivation conflict", checkReactivationConflict],
  ["note clearing", checkNoteClearing],
  ["weight entries", checkWeightEntries],
  ["weight goal read", checkWeightGoalRead],
  ["profiles", checkProfiles],
  ["profile upsert race", checkProfileUpsertRace],
  ["profile time zone and goal", checkProfileTimeZoneAndGoal],
  ["migration backfill", checkMigrationBackfill],
  ["active edits skip rollups", checkActiveEditsSkipRollups],
  ["incremental rollups match rebuild", checkIncrementalRollups],
  ["personal record recompute", checkPersonalRecordRecompute],
  ["paged rebuild", checkRebuildPaging],
  ["stats overview", checkStatsOverview],
  ["home snapshot", checkHomeSnapshot],
  ["workout list pagination", checkWorkoutListPagination],
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
