create table "profiles" (
  "id" text not null primary key,
  "userId" text not null unique references "user" ("id") on delete cascade,
  "name" text not null,
  "email" text not null,
  "gender" text,
  "fitnessLevel" text,
  "profilePicture" text,
  "notificationsEnabled" integer not null default 1,
  "weightUnit" text not null default 'lbs',
  "createdAt" text not null
);

create index "profiles_userId_idx" on "profiles" ("userId");

create table "workouts" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "date" text not null,
  "duration" real not null,
  "startTime" text,
  "endTime" text,
  "isActive" integer,
  "exercises" text not null default '[]',
  "bodyPartWorkedOut" text,
  "notes" text,
  "revision" integer not null default 1,
  "createdAt" text not null
);

create index "workouts_userId_date_idx" on "workouts" ("userId", "date");

create unique index "workouts_one_active_idx" on "workouts" ("userId") where "isActive" = 1;

create table "weightEntries" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "date" text not null,
  "weight" real not null,
  "note" text,
  "photoUrl" text,
  "createdAt" text not null
);

create index "weightEntries_userId_date_idx" on "weightEntries" ("userId", "date");

create table "weightGoals" (
  "id" text not null primary key,
  "userId" text not null unique references "user" ("id") on delete cascade,
  "targetWeight" real not null,
  "weeklyGoal" real not null,
  "startDate" text not null,
  "startWeight" real not null
);
