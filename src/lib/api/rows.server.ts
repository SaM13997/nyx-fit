import type { Exercise, FitnessLevel, Workout, WorkoutListItem } from "@/lib/types";
import {
  STORED_DATA_ERROR,
  isRecord,
  parseJson,
  rowFlag,
  rowFrom,
  rowInteger,
  rowNullableTextOrUndefined,
  rowNumber,
  rowText,
} from "./db.server";

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

export const parseStoredExercises = (value: unknown): Exercise[] => {
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

export const parseStoredStringList = (value: unknown): string[] | null => {
  if (typeof value !== "string") return null;
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) throw new Error(STORED_DATA_ERROR);
  return parsed.map((item) => {
    if (typeof item !== "string") throw new Error(STORED_DATA_ERROR);
    return item;
  });
};

export const toFitnessLevel = (value: unknown): FitnessLevel | undefined => {
  if (value === null || value === undefined) return undefined;
  if (value === "beginner" || value === "intermediary" || value === "advanced" || value === "pro") {
    return value;
  }
  throw new Error(STORED_DATA_ERROR);
};

export const toWorkout = (value: unknown): Workout => {
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

// Columns a list item needs: everything except the exercises blob.
export const WORKOUT_LIST_COLUMNS =
  '"id", "date", "createdAt", "duration", "isActive", "exerciseCount", "totalSets", "totalVolume", "bodyPartWorkedOut"';

export const toWorkoutListItem = (value: unknown): WorkoutListItem => {
  const row = rowFrom(value);
  const isActive = rowFlag(row, "isActive");
  const bodyPartWorkedOut = parseStoredStringList(row.bodyPartWorkedOut);
  return {
    id: rowText(row, "id"),
    date: rowText(row, "date"),
    duration: rowNumber(row, "duration"),
    exerciseCount: rowInteger(row, "exerciseCount"),
    totalSets: rowInteger(row, "totalSets"),
    totalVolume: rowNumber(row, "totalVolume"),
    ...(isActive === undefined ? {} : { isActive }),
    ...(bodyPartWorkedOut === null ? {} : { bodyPartWorkedOut }),
  };
};
