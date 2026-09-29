import { describe, expect, it } from "vitest";
import type { ExerciseRecord, Workout } from "@/lib/types";
import { bodyPartFrequency, leastRecentBodyParts, topPersonalRecords } from "./stats";

const NOW = new Date("2026-09-21T12:00:00.000Z");
const DAY = 86_400_000;

const stat = (overrides: Partial<ExerciseRecord>): ExerciseRecord => ({
  exerciseKey: "bench press",
  exerciseName: "Bench Press",
  sessions: 4,
  totalSets: 10,
  totalReps: 50,
  totalVolume: 5000,
  maxWeight: 225,
  maxWeightReps: 5,
  lastPerformedAt: "2026-09-20T10:00:00.000Z",
  ...overrides,
});

const workout = (overrides: Partial<Workout>): Workout => ({
  id: "workout-1",
  date: new Date(NOW.getTime() - 3 * DAY).toISOString(),
  duration: 3600,
  isActive: false,
  revision: 1,
  exercises: [],
  ...overrides,
});

describe("topPersonalRecords", () => {
  it("orders records by heaviest weight and caps the list", () => {
    const records = topPersonalRecords(
      [
        stat({ exerciseName: "Squat", exerciseKey: "squat", maxWeight: 315, maxWeightReps: 3 }),
        stat({ exerciseName: "Bench Press", maxWeight: 225, maxWeightReps: 5 }),
        stat({ exerciseName: "Row", exerciseKey: "row", maxWeight: 185, maxWeightReps: 8 }),
        stat({ exerciseName: "Curl", exerciseKey: "curl", maxWeight: 95, maxWeightReps: 10 }),
        stat({ exerciseName: "Press", exerciseKey: "press", maxWeight: 135, maxWeightReps: 6 }),
        stat({ exerciseName: "Lat Raise", exerciseKey: "lat raise", maxWeight: 40, maxWeightReps: 12 }),
      ],
      5,
    );

    expect(records.map((r) => r.exerciseName)).toEqual([
      "Squat",
      "Bench Press",
      "Row",
      "Press",
      "Curl",
    ]);
  });

  it("skips exercises whose heaviest set carried no weight", () => {
    const records = topPersonalRecords([
      stat({ exerciseName: "Plank", exerciseKey: "plank", maxWeight: 0, maxWeightReps: 0 }),
      stat({ exerciseName: "Bench Press", maxWeight: 225, maxWeightReps: 5 }),
    ]);

    expect(records.map((r) => r.exerciseName)).toEqual(["Bench Press"]);
  });

  it("breaks weight ties by name", () => {
    const records = topPersonalRecords([
      stat({ exerciseName: "Incline Press", exerciseKey: "incline press", maxWeight: 225, maxWeightReps: 5 }),
      stat({ exerciseName: "Bench Press", maxWeight: 225, maxWeightReps: 5 }),
    ]);

    expect(records.map((r) => r.exerciseName)).toEqual(["Bench Press", "Incline Press"]);
  });
});

describe("bodyPartFrequency", () => {
  it("counts completed workouts per body part inside the window", () => {
    const frequency = bodyPartFrequency(
      [
        workout({ bodyPartWorkedOut: ["chest", "triceps"] }),
        workout({ date: new Date(NOW.getTime() - 10 * DAY).toISOString(), bodyPartWorkedOut: ["chest"] }),
        workout({ date: new Date(NOW.getTime() - 70 * DAY).toISOString(), bodyPartWorkedOut: ["chest"] }),
      ],
      NOW,
    );

    expect(frequency).toEqual([
      { bodyPart: "chest", sessions: 2 },
      { bodyPart: "triceps", sessions: 1 },
    ]);
  });

  it("ignores workouts without body-part tags and active workouts", () => {
    const frequency = bodyPartFrequency(
      [
        workout({ bodyPartWorkedOut: undefined }),
        workout({ isActive: true, bodyPartWorkedOut: ["chest"] }),
        workout({ bodyPartWorkedOut: ["legs"] }),
      ],
      NOW,
    );

    expect(frequency).toEqual([{ bodyPart: "legs", sessions: 1 }]);
  });
});

describe("leastRecentBodyParts", () => {
  it("lists unseen parts first, then the stalest seen parts", () => {
    const result = leastRecentBodyParts([
      workout({ date: "2026-09-01T10:00:00.000Z", bodyPartWorkedOut: ["chest"] }),
      workout({ date: "2026-09-15T10:00:00.000Z", bodyPartWorkedOut: ["back", "legs:Quads"] }),
      workout({ date: "2026-09-10T10:00:00.000Z", bodyPartWorkedOut: ["legs:Glutes"] }),
    ]);

    expect(result.slice(0, 6).map((entry) => entry.bodyPart)).toEqual([
      "arms",
      "shoulders",
      "cardio",
      "abs",
      "full_body",
      "chest",
    ]);
    expect(result[0].lastWorkedAt).toBeNull();
    const legs = result.find((entry) => entry.bodyPart === "legs");
    expect(legs?.lastWorkedAt).toBe("2026-09-15T10:00:00.000Z");
  });
});
