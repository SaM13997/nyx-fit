import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExerciseRecord, StatsOverview, WeightUnit } from "@/lib/types";
import { Route } from "./stats";

const mocks = vi.hoisted(() => ({
  overview: null as StatsOverview | null,
  unit: "lbs" as WeightUnit,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

vi.mock("@/lib/api/hooks", () => ({
  useStatsOverview: () => ({
    overview: mocks.overview,
    isLoading: mocks.isLoading,
    isError: mocks.isError,
    refetch: mocks.refetch,
  }),
  useCurrentProfile: () => ({
    profile: { weightUnit: mocks.unit },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...original,
    createFileRoute: () => (options: unknown) => ({ options }),
  };
});

function renderStats() {
  const Component = Route.options.component;
  if (typeof Component !== "function") {
    throw new Error("Stats route component is unavailable");
  }
  return render(<Component />);
}

const makeOverview = (overrides: Partial<StatsOverview> = {}): StatsOverview => ({
  status: "ready",
  totalWorkouts: 12,
  averageDuration: 45,
  totalExercises: 30,
  totalSets: 210,
  workoutsThisWeek: 2,
  workoutsThisMonth: 7,
  weeklyWorkoutGoal: 3,
  streak: { current: 3, longest: 9 },
  weeklyStats: [],
  exercises: [],
  bodyPartFrequency: [],
  ...overrides,
});

const makeRecord = (overrides: Partial<ExerciseRecord> = {}): ExerciseRecord => ({
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

beforeEach(() => {
  mocks.overview = makeOverview();
  mocks.unit = "lbs";
  mocks.isLoading = false;
  mocks.isError = false;
  mocks.refetch.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("stats page shell", () => {
  it("renders the hero title and subtitle", () => {
    renderStats();

    expect(
      screen.getByRole("heading", { level: 1, name: "Stats" }),
    ).toBeTruthy();
    expect(screen.getByText("Your fitness journey at a glance")).toBeTruthy();
    expect(screen.getByText("Total Workouts")).toBeTruthy();
  });

  it("shows the empty state when there is no data yet", () => {
    mocks.overview = null;
    renderStats();

    expect(screen.getByText("No workout data yet")).toBeTruthy();
  });

  it("offers retry when the request fails", async () => {
    mocks.overview = null;
    mocks.isError = true;
    renderStats();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(mocks.refetch).toHaveBeenCalledTimes(1));
  });

  it("shows streaks in weeks", () => {
    renderStats();

    expect(screen.getByLabelText("3 wks")).toBeTruthy();
    expect(screen.getByLabelText("9 wks")).toBeTruthy();
  });

  it("matches the weights page shell geometry", () => {
    const { container } = renderStats();

    expect(container.querySelector(".overflow-x-clip")).not.toBeNull();
    expect(container.querySelector(".h-\\[35vh\\]")).not.toBeNull();
    expect(
      screen.getByRole("heading", { level: 1, name: "Stats" }).className,
    ).toContain("text-6xl");
  });

  it("gives each volume bar an accessible name", () => {
    mocks.overview = makeOverview({
      weeklyStats: [
        {
          weekStart: "2026-09-14",
          workouts: 3,
          exercises: 9,
          sets: 30,
          volume: 12000,
          durationSeconds: 9000,
        },
      ],
    });
    renderStats();

    expect(screen.getByRole("img", { name: /12\.0K volume/ })).toBeTruthy();
  });
});

describe("records and frequency", () => {
  it("lists personal records converted to the display unit", () => {
    mocks.overview = makeOverview({ exercises: [makeRecord({ maxWeight: 500 })] });
    mocks.unit = "kgs";
    renderStats();

    expect(screen.getByText("Personal Records")).toBeTruthy();
    expect(screen.getAllByText("Bench Press")).toHaveLength(2);
    expect(screen.getByText("226.8 kgs × 5")).toBeTruthy();
  });

  it("shows training frequency counts for the trailing window", () => {
    mocks.overview = makeOverview({
      bodyPartFrequency: [
        { bodyPart: "chest", sessions: 2 },
        { bodyPart: "legs", sessions: 1 },
      ],
    });
    renderStats();

    expect(screen.getByText("Training Frequency")).toBeTruthy();
    expect(screen.getByText(/Chest/)).toBeTruthy();
    expect(screen.getByText("2 sessions")).toBeTruthy();
    expect(screen.getByText("1 session")).toBeTruthy();
  });

  it("hides both sections when there is nothing to show", () => {
    renderStats();

    expect(screen.queryByText("Personal Records")).toBeNull();
    expect(screen.queryByText("Training Frequency")).toBeNull();
  });
});
