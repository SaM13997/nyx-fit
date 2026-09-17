import { describe, expect, it } from "vitest";
import {
  imageKeyFromUrl,
  isExternalImageUrl,
  isOwnedImageUrl,
  parseDeleteWeightInput,
  parseGetWeightsInput,
  parseGetWorkoutInput,
  parseLogWeightInput,
  parseSetWeightGoalInput,
  parseStartWorkoutInput,
  parseUpdateWeightInput,
  parseUpdateWorkoutInput,
  parseUpsertProfileInput,
} from "./parsers";

const WORKOUT_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const USER_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("workout input parsing", () => {
  it("accepts a valid workout identifier", () => {
    expect(parseGetWorkoutInput({ id: WORKOUT_ID })).toEqual({ id: WORKOUT_ID });
  });

  it("rejects malformed workout identifiers", () => {
    expect(() => parseGetWorkoutInput({ id: "" })).toThrow();
    expect(() => parseGetWorkoutInput({ id: "../../etc/passwd" })).toThrow();
    expect(() => parseGetWorkoutInput({ id: 42 })).toThrow();
    expect(() => parseGetWorkoutInput(null)).toThrow();
  });

  it("treats a missing start payload as empty", () => {
    expect(parseStartWorkoutInput(undefined)).toEqual({});
    expect(parseStartWorkoutInput({})).toEqual({});
  });

  it("rejects body part lists that are not string arrays", () => {
    expect(() => parseStartWorkoutInput({ bodyPartWorkedOut: "chest" })).toThrow();
    expect(() => parseStartWorkoutInput({ bodyPartWorkedOut: [1, 2] })).toThrow();
    expect(parseStartWorkoutInput({ bodyPartWorkedOut: ["chest"] })).toEqual({
      bodyPartWorkedOut: ["chest"],
    });
  });

  it("requires a whole positive revision for workout edits", () => {
    expect(() =>
      parseUpdateWorkoutInput({ id: WORKOUT_ID, updates: {} }),
    ).toThrow();
    expect(() =>
      parseUpdateWorkoutInput({ id: WORKOUT_ID, revision: 0, updates: {} }),
    ).toThrow();
    expect(() =>
      parseUpdateWorkoutInput({ id: WORKOUT_ID, revision: 1.5, updates: {} }),
    ).toThrow();
    expect(parseUpdateWorkoutInput({ id: WORKOUT_ID, revision: 3, updates: {} })).toEqual({
      id: WORKOUT_ID,
      revision: 3,
      updates: {},
    });
  });

  it("strips unknown workout update keys", () => {
    const parsed = parseUpdateWorkoutInput({
      id: WORKOUT_ID,
      revision: 2,
      updates: { notes: "solid", userId: "someone-else", revision: 99 },
    });
    expect(parsed.updates).toEqual({ notes: "solid" });
  });

  it("rejects malformed workout updates", () => {
    expect(() =>
      parseUpdateWorkoutInput({ id: WORKOUT_ID, revision: 1, updates: { duration: -1 } }),
    ).toThrow();
    expect(() =>
      parseUpdateWorkoutInput({ id: WORKOUT_ID, revision: 1, updates: { date: "not-a-date" } }),
    ).toThrow();
    expect(() =>
      parseUpdateWorkoutInput({ id: WORKOUT_ID, revision: 1, updates: { isActive: "yes" } }),
    ).toThrow();
    expect(() =>
      parseUpdateWorkoutInput({
        id: WORKOUT_ID,
        revision: 1,
        updates: { exercises: [{ id: WORKOUT_ID, name: "Bench", sets: [{ id: "s1", weight: Number.NaN, reps: 5 }] }] },
      }),
    ).toThrow();
  });

  it("accepts valid exercise payloads", () => {
    const parsed = parseUpdateWorkoutInput({
      id: WORKOUT_ID,
      revision: 4,
      updates: {
        duration: 120,
        isActive: false,
        exercises: [
          {
            id: "ex-1",
            name: "Bench Press",
            category: "chest",
            sets: [{ id: "set-1", weight: 135, reps: 8 }],
          },
        ],
      },
    });
    expect(parsed.updates.exercises).toEqual([
      {
        id: "ex-1",
        name: "Bench Press",
        category: "chest",
        sets: [{ id: "set-1", weight: 135, reps: 8 }],
      },
    ]);
  });
});

describe("profile input parsing", () => {
  it("trims the display name and keeps supported fields", () => {
    const parsed = parseUpsertProfileInput({
      updates: { name: "  Sam  ", weightUnit: "kgs", fitnessLevel: "advanced" },
    });
    expect(parsed).toEqual({
      updates: { name: "Sam", weightUnit: "kgs", fitnessLevel: "advanced" },
    });
  });

  it("rejects invalid profile values", () => {
    expect(() => parseUpsertProfileInput({ updates: { name: "   " } })).toThrow();
    expect(() => parseUpsertProfileInput({ updates: { weightUnit: "stones" } })).toThrow();
    expect(() => parseUpsertProfileInput({ updates: { fitnessLevel: "elite" } })).toThrow();
    expect(() => parseUpsertProfileInput({ updates: { notificationsEnabled: 1 } })).toThrow();
    expect(() => parseUpsertProfileInput({ updates: { profilePicture: "javascript:alert(1)" } })).toThrow();
  });

  it("allows provider avatar URLs", () => {
    const parsed = parseUpsertProfileInput({
      updates: { profilePicture: "https://lh3.googleusercontent.com/a/abc123" },
    });
    expect(parsed.updates.profilePicture).toBe("https://lh3.googleusercontent.com/a/abc123");
  });
});

describe("weight input parsing", () => {
  it("accepts a valid weight entry", () => {
    const parsed = parseLogWeightInput({
      date: "2026-09-16T09:00:00.000Z",
      weight: 181.4,
      note: "morning",
      photoUrl: `/api/images/${USER_ID}/photo.png`,
    });
    expect(parsed.weight).toBe(181.4);
    expect(parsed.photoUrl).toBe(`/api/images/${USER_ID}/photo.png`);
  });

  it("rejects non-finite weights and bad dates", () => {
    expect(() => parseLogWeightInput({ date: "2026-09-16", weight: Number.POSITIVE_INFINITY })).toThrow();
    expect(() => parseLogWeightInput({ date: "someday", weight: 180 })).toThrow();
  });

  it("rejects weight photos that are not uploaded images", () => {
    expect(() =>
      parseLogWeightInput({ date: "2026-09-16", weight: 180, photoUrl: "https://example.com/a.png" }),
    ).toThrow();
    expect(() =>
      parseLogWeightInput({ date: "2026-09-16", weight: 180, photoUrl: "/api/images/other/a.png" }),
    ).not.toThrow();
  });

  it("bounds the weight list limit", () => {
    expect(parseGetWeightsInput({})).toEqual({});
    expect(parseGetWeightsInput({ limit: 25 })).toEqual({ limit: 25 });
    expect(() => parseGetWeightsInput({ limit: 0 })).toThrow();
    expect(() => parseGetWeightsInput({ limit: 10_000 })).toThrow();
  });

  it("requires an identifier for weight edits and deletes", () => {
    expect(() => parseUpdateWeightInput({ id: "bad id" })).toThrow();
    expect(() => parseDeleteWeightInput({})).toThrow();
    expect(parseDeleteWeightInput({ id: WORKOUT_ID })).toEqual({ id: WORKOUT_ID });
  });

  it("clears notes with an empty value and trims content", () => {
    expect(parseUpdateWeightInput({ id: WORKOUT_ID, note: "" }).note).toBeNull();
    expect(parseUpdateWeightInput({ id: WORKOUT_ID, note: "   " }).note).toBeNull();
    expect(parseUpdateWeightInput({ id: WORKOUT_ID, note: "  evening " }).note).toBe("evening");
    expect("note" in parseUpdateWeightInput({ id: WORKOUT_ID, weight: 180 })).toBe(false);

    const logged = parseLogWeightInput({ date: "2026-09-16", weight: 180, note: "   " });
    expect("note" in logged).toBe(false);

    const clearedWorkout = parseUpdateWorkoutInput({
      id: WORKOUT_ID,
      revision: 1,
      updates: { notes: "" },
    });
    expect(clearedWorkout.updates.notes).toBeNull();

    const notedWorkout = parseUpdateWorkoutInput({
      id: WORKOUT_ID,
      revision: 1,
      updates: { notes: "  felt strong  " },
    });
    expect(notedWorkout.updates.notes).toBe("felt strong");
  });

  it("validates weight goals", () => {
    expect(() =>
      parseSetWeightGoalInput({
        targetWeight: 175,
        weeklyGoal: -1,
        startDate: "2026-09-16",
        startWeight: 185,
      }),
    ).not.toThrow();
    expect(() =>
      parseSetWeightGoalInput({
        targetWeight: 175,
        weeklyGoal: -500,
        startDate: "2026-09-16",
        startWeight: 185,
      }),
    ).toThrow();
  });
});

describe("image url rules", () => {
  it("extracts owned image keys", () => {
    expect(imageKeyFromUrl(`/api/images/${USER_ID}/photo.jpg`)).toBe(`${USER_ID}/photo.jpg`);
    expect(imageKeyFromUrl("/api/images/not-a-key.png")).toBeNull();
    expect(imageKeyFromUrl("https://example.com/photo.jpg")).toBeNull();
  });

  it("checks ownership by user prefix", () => {
    expect(isOwnedImageUrl(`/api/images/${USER_ID}/photo.webp`, USER_ID)).toBe(true);
    expect(isOwnedImageUrl(`/api/images/${USER_ID}/photo.svg`, USER_ID)).toBe(false);
    expect(isOwnedImageUrl("/api/images/other-user/photo.png", USER_ID)).toBe(false);
  });

  it("only accepts https provider images", () => {
    expect(isExternalImageUrl("https://lh3.googleusercontent.com/a/abc")).toBe(true);
    expect(isExternalImageUrl("http://lh3.googleusercontent.com/a/abc")).toBe(false);
    expect(isExternalImageUrl("data:image/png;base64,AAAA")).toBe(false);
  });
});
