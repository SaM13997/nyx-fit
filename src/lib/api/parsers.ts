import type {
  Exercise,
  FitnessLevel,
  Gender,
  WeightUnit,
  Workout,
  WorkoutSet,
} from "@/lib/types";

export type ProfileUpdatesInput = {
  name?: string;
  gender?: Gender;
  profilePicture?: string;
  fitnessLevel?: FitnessLevel;
  notificationsEnabled?: boolean;
  weightUnit?: WeightUnit;
};

export type UpsertProfileInput = { updates: ProfileUpdatesInput };

export type WorkoutUpdatesInput = {
  date?: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  exercises?: Exercise[];
  bodyPartWorkedOut?: string[];
  notes?: string | null;
};

export type UpdateWorkoutInput = {
  id: string;
  revision: number;
  updates: WorkoutUpdatesInput;
};

export type StartWorkoutInput = { bodyPartWorkedOut?: string[] };
export type GetWorkoutInput = { id: string };
export type GetWeightsInput = { limit?: number };
export type DeleteWeightInput = { id: string };

export type LogWeightInput = {
  date: string;
  weight: number;
  note?: string;
  photoUrl?: string;
};

export type UpdateWeightInput = {
  id: string;
  weight?: number;
  date?: string;
  note?: string | null;
  photoUrl?: string;
};

export type WorkoutUpdateOutcome =
  | { ok: true; workout: Workout }
  | { ok: false; reason: "conflict" | "active-exists" };

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const IMAGE_URL_PATTERN = /^\/api\/images\/([A-Za-z0-9_-]{1,64})\/([A-Za-z0-9_-]{1,64})\.(png|jpg|webp|gif)$/;

const MAX_BODY_PARTS = 50;
const MAX_EXERCISES = 100;
const MAX_SETS_PER_EXERCISE = 200;
const MAX_TEXT_LENGTH = 2000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown, field: string, maxLength = MAX_TEXT_LENGTH): string => {
  if (typeof value !== "string") {
    throw new Error(`${field} must be text.`);
  }
  if (value.length === 0 || value.length > maxLength) {
    throw new Error(`${field} is not a valid value.`);
  }
  return value;
};

const readOptionalString = (
  value: unknown,
  field: string,
  maxLength = MAX_TEXT_LENGTH,
): string | undefined => {
  if (value === undefined) return undefined;
  return readString(value, field, maxLength);
};

const readNote = (value: unknown, field: string): string | null | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > MAX_TEXT_LENGTH) {
    throw new Error(`${field} must be text.`);
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const readFiniteNumber = (
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a number.`);
  }
  if (value < minimum || value > maximum) {
    throw new Error(`${field} is outside the supported range.`);
  }
  return value;
};

const readOptionalFiniteNumber = (
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number | undefined => {
  if (value === undefined) return undefined;
  return readFiniteNumber(value, field, minimum, maximum);
};

const readInteger = (
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`${field} must be a whole number.`);
  }
  if (value < minimum || value > maximum) {
    throw new Error(`${field} is outside the supported range.`);
  }
  return value;
};

const readTimestamp = (value: unknown, field: string): string => {
  const text = readString(value, field, 40);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${field} must be a valid date.`);
  }
  return text;
};

const readOptionalTimestamp = (value: unknown, field: string): string | undefined => {
  if (value === undefined) return undefined;
  return readTimestamp(value, field);
};

const readId = (value: unknown): string => {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    throw new Error("Identifier is not valid.");
  }
  return value;
};

const readEnum = <const T extends readonly string[]>(
  value: unknown,
  field: string,
  allowed: T,
): T[number] => {
  if (typeof value !== "string") {
    throw new Error(`${field} is not a supported value.`);
  }
  const match = allowed.find((option) => option === value);
  if (match === undefined) {
    throw new Error(`${field} is not a supported value.`);
  }
  return match;
};

const readStringList = (
  value: unknown,
  field: string,
  maxItems: number,
  maxLength: number,
): string[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be a list.`);
  }
  if (value.length > maxItems) {
    throw new Error(`${field} has too many entries.`);
  }
  return value.map((item) => readString(item, field, maxLength));
};

const readSet = (value: unknown): WorkoutSet => {
  if (!isRecord(value)) {
    throw new Error("Each set must be an object.");
  }
  return {
    id: readId(value.id),
    weight: readFiniteNumber(value.weight, "Set weight", 0, 100000),
    reps: readInteger(value.reps, "Set reps", 0, 10000),
  };
};

const readExercise = (value: unknown): Exercise => {
  if (!isRecord(value)) {
    throw new Error("Each exercise must be an object.");
  }
  const sets = value.sets;
  if (!Array.isArray(sets) || sets.length > MAX_SETS_PER_EXERCISE) {
    throw new Error("Exercise sets are not valid.");
  }
  const category = readOptionalString(value.category, "Exercise category", 60);
  return {
    id: readId(value.id),
    name: readString(value.name, "Exercise name", 120),
    sets: sets.map(readSet),
    ...(category === undefined ? {} : { category }),
  };
};

export const isSameOriginImageUrl = (value: string): boolean =>
  IMAGE_URL_PATTERN.test(value);

export const isExternalImageUrl = (value: string): boolean => {
  if (!value.startsWith("https://") || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname.length > 0;
  } catch {
    return false;
  }
};

export const imageKeyFromUrl = (value: string): string | null => {
  const match = IMAGE_URL_PATTERN.exec(value);
  if (!match) return null;
  return `${match[1]}/${match[2]}.${match[3]}`;
};

export const isOwnedImageUrl = (value: string, userId: string): boolean => {
  const key = imageKeyFromUrl(value);
  return key !== null && key.startsWith(`${userId}/`);
};

const readImageUrl = (value: unknown, field: string): string => {
  const text = readString(value, field, 2048);
  if (!isSameOriginImageUrl(text) && !isExternalImageUrl(text)) {
    throw new Error(`${field} must be an image URL.`);
  }
  return text;
};

const readPhotoUrl = (value: unknown, field: string): string => {
  const text = readString(value, field, 2048);
  if (!isSameOriginImageUrl(text)) {
    throw new Error(`${field} must be an uploaded image.`);
  }
  return text;
};

const readProfileUpdates = (value: unknown): ProfileUpdatesInput => {
  if (!isRecord(value)) {
    throw new Error("Profile updates must be an object.");
  }
  const name = value.name === undefined ? undefined : readString(value.name, "Display name", 80).trim();
  if (name !== undefined && name.length === 0) {
    throw new Error("Display name is required.");
  }
  const updates: ProfileUpdatesInput = {};
  if (name !== undefined) updates.name = name;
  if (value.gender !== undefined) {
    updates.gender = readEnum(value.gender, "Gender", ["male", "female"] as const);
  }
  if (value.fitnessLevel !== undefined) {
    updates.fitnessLevel = readEnum(value.fitnessLevel, "Training experience", [
      "beginner",
      "intermediary",
      "advanced",
      "pro",
    ] as const);
  }
  if (value.profilePicture !== undefined) {
    updates.profilePicture = readImageUrl(value.profilePicture, "Profile picture");
  }
  if (value.notificationsEnabled !== undefined) {
    if (typeof value.notificationsEnabled !== "boolean") {
      throw new Error("Notifications preference must be true or false.");
    }
    updates.notificationsEnabled = value.notificationsEnabled;
  }
  if (value.weightUnit !== undefined) {
    updates.weightUnit = readEnum(value.weightUnit, "Weight unit", ["lbs", "kgs"] as const);
  }
  return updates;
};

const readWorkoutUpdates = (value: unknown): WorkoutUpdatesInput => {
  if (!isRecord(value)) {
    throw new Error("Workout updates must be an object.");
  }
  const updates: WorkoutUpdatesInput = {};
  const date = readOptionalTimestamp(value.date, "Workout date");
  if (date !== undefined) updates.date = date;
  const duration = readOptionalFiniteNumber(value.duration, "Workout duration", 0, 86400);
  if (duration !== undefined) updates.duration = duration;
  const startTime = readOptionalTimestamp(value.startTime, "Start time");
  if (startTime !== undefined) updates.startTime = startTime;
  const endTime = readOptionalTimestamp(value.endTime, "End time");
  if (endTime !== undefined) updates.endTime = endTime;
  if (value.isActive !== undefined) {
    if (typeof value.isActive !== "boolean") {
      throw new Error("Workout status must be true or false.");
    }
    updates.isActive = value.isActive;
  }
  if (value.exercises !== undefined) {
    if (!Array.isArray(value.exercises) || value.exercises.length > MAX_EXERCISES) {
      throw new Error("Workout exercises are not valid.");
    }
    updates.exercises = value.exercises.map(readExercise);
  }
  if (value.bodyPartWorkedOut !== undefined) {
    updates.bodyPartWorkedOut = readStringList(
      value.bodyPartWorkedOut,
      "Body parts",
      MAX_BODY_PARTS,
      40,
    );
  }
  const notes = readNote(value.notes, "Notes");
  if (notes !== undefined) updates.notes = notes;
  return updates;
};

export const parseUpsertProfileInput = (input: unknown): UpsertProfileInput => {
  if (!isRecord(input)) {
    throw new Error("Profile updates must be an object.");
  }
  return { updates: readProfileUpdates(input.updates) };
};

export const parseStartWorkoutInput = (input: unknown): StartWorkoutInput => {
  if (input === undefined || input === null) return {};
  if (!isRecord(input)) {
    throw new Error("Workout input must be an object.");
  }
  if (input.bodyPartWorkedOut === undefined) return {};
  return {
    bodyPartWorkedOut: readStringList(input.bodyPartWorkedOut, "Body parts", MAX_BODY_PARTS, 40),
  };
};

export const parseGetWorkoutInput = (input: unknown): GetWorkoutInput => {
  if (!isRecord(input)) {
    throw new Error("Workout identifier is required.");
  }
  return { id: readId(input.id) };
};

export const parseUpdateWorkoutInput = (input: unknown): UpdateWorkoutInput => {
  if (!isRecord(input)) {
    throw new Error("Workout update is required.");
  }
  return {
    id: readId(input.id),
    revision: readInteger(input.revision, "Workout revision", 1, Number.MAX_SAFE_INTEGER),
    updates: readWorkoutUpdates(input.updates),
  };
};

export const parseGetWeightsInput = (input: unknown): GetWeightsInput => {
  if (input === undefined || input === null) return {};
  if (!isRecord(input)) {
    throw new Error("Weight list input must be an object.");
  }
  if (input.limit === undefined) return {};
  return { limit: readInteger(input.limit, "Limit", 1, 500) };
};

export const parseLogWeightInput = (input: unknown): LogWeightInput => {
  if (!isRecord(input)) {
    throw new Error("Weight entry is required.");
  }
  const note = readNote(input.note, "Note");
  const photoUrl = input.photoUrl === undefined ? undefined : readPhotoUrl(input.photoUrl, "Photo");
  return {
    date: readTimestamp(input.date, "Date"),
    weight: readFiniteNumber(input.weight, "Weight", 0, 100000),
    ...(note === undefined || note === null ? {} : { note }),
    ...(photoUrl === undefined ? {} : { photoUrl }),
  };
};

export const parseUpdateWeightInput = (input: unknown): UpdateWeightInput => {
  if (!isRecord(input)) {
    throw new Error("Weight update is required.");
  }
  const weight = readOptionalFiniteNumber(input.weight, "Weight", 0, 100000);
  const date = readOptionalTimestamp(input.date, "Date");
  const note = readNote(input.note, "Note");
  const photoUrl = input.photoUrl === undefined ? undefined : readPhotoUrl(input.photoUrl, "Photo");
  return {
    id: readId(input.id),
    ...(weight === undefined ? {} : { weight }),
    ...(date === undefined ? {} : { date }),
    ...(note === undefined ? {} : { note }),
    ...(photoUrl === undefined ? {} : { photoUrl }),
  };
};

export const parseDeleteWeightInput = (input: unknown): DeleteWeightInput => {
  if (!isRecord(input)) {
    throw new Error("Weight identifier is required.");
  }
  return { id: readId(input.id) };
};
