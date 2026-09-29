-- Denormalised workout summaries, per-exercise contributions and rollups.
--
-- Write model: `workouts` keeps the exercises JSON blob as the source of
-- truth. Its summary columns are refreshed on every write. The three rollup
-- tables below are maintained only when a workout becomes completed, or when
-- a completed workout is edited, and can always be rebuilt from `workouts`
-- (see `profiles.statsVersion` / `statsCursor`).

alter table "workouts" add column "totalVolume" real not null default 0;
alter table "workouts" add column "totalSets" integer not null default 0;
alter table "workouts" add column "exerciseCount" integer not null default 0;
alter table "workouts" add column "updatedAt" text;

-- Backfill in SQL so no Worker CPU is spent on it.
update "workouts" set
  "exerciseCount" = json_array_length("workouts"."exercises"),
  "totalSets" = coalesce((
    select count(*)
    from json_each("workouts"."exercises") as "e", json_each("e"."value", '$.sets') as "s"
  ), 0),
  "totalVolume" = coalesce((
    select sum(json_extract("s"."value", '$.weight') * json_extract("s"."value", '$.reps'))
    from json_each("workouts"."exercises") as "e", json_each("e"."value", '$.sets') as "s"
  ), 0),
  "updatedAt" = "createdAt";

-- Covers the newest-first keyset scan (date, createdAt, id) used by the list
-- and by the "latest completed workout" lookups.
create index "workouts_userId_date_created_idx" on "workouts" ("userId", "date", "createdAt", "id");
drop index "workouts_userId_date_idx";

alter table "profiles" add column "weeklyWorkoutGoal" integer;
alter table "profiles" add column "timeZone" text;
-- Rollups are (re)built lazily in bounded pages when this is behind
-- CURRENT_STATS_VERSION in store code; existing users start at 0.
alter table "profiles" add column "statsVersion" integer not null default 0;
alter table "profiles" add column "statsCursor" text;

create table "workoutExercises" (
  "workoutId" text not null references "workouts" ("id") on delete cascade,
  "exerciseKey" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "exerciseName" text not null,
  "date" text not null,
  "sets" integer not null,
  "reps" integer not null,
  "volume" real not null,
  "maxWeight" real not null,
  "maxWeightReps" integer not null,
  primary key ("workoutId", "exerciseKey")
) without rowid;

create index "workoutExercises_user_exercise_date_idx"
  on "workoutExercises" ("userId", "exerciseKey", "date");

create table "exerciseRecords" (
  "userId" text not null references "user" ("id") on delete cascade,
  "exerciseKey" text not null,
  "exerciseName" text not null,
  "sessions" integer not null default 0,
  "totalSets" integer not null default 0,
  "totalReps" integer not null default 0,
  "totalVolume" real not null default 0,
  "maxWeight" real not null default 0,
  "maxWeightReps" integer not null default 0,
  "maxWeightWorkoutId" text,
  "maxWeightDate" text,
  "lastPerformedAt" text not null,
  primary key ("userId", "exerciseKey")
) without rowid;

create table "weeklyStats" (
  "userId" text not null references "user" ("id") on delete cascade,
  "weekStart" text not null,
  "workouts" integer not null default 0,
  "exercises" integer not null default 0,
  "sets" integer not null default 0,
  "volume" real not null default 0,
  "durationSeconds" real not null default 0,
  primary key ("userId", "weekStart")
) without rowid;
