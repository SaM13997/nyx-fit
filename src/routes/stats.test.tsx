import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExerciseStat, WorkoutSummary } from "@/lib/types";
import { Route } from "./stats";

const mocks = vi.hoisted(() => ({
  summary: null as WorkoutSummary | null,
  stats: [] as ExerciseStat[],
  summaryLoading: false,
  statsLoading: false,
  summaryError: false,
  statsError: false,
  refetchSummary: vi.fn(),
  refetchStats: vi.fn(),
}));

vi.mock("@/lib/api/hooks", () => ({
  useWorkoutSummary: () => ({
    summary: mocks.summary,
    isLoading: mocks.summaryLoading,
    isError: mocks.summaryError,
    refetch: mocks.refetchSummary,
  }),
  useExerciseStats: () => ({
    stats: mocks.stats,
    isLoading: mocks.statsLoading,
    isError: mocks.statsError,
    refetch: mocks.refetchStats,
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

const makeSummary = (): WorkoutSummary => ({
  totalWorkouts: 12,
  averageDuration: 45,
  totalExercises: 30,
  totalSets: 210,
  currentStreak: 3,
  longestStreak: 9,
  workoutsThisWeek: 2,
  workoutsThisMonth: 7,
});

beforeEach(() => {
  mocks.summary = makeSummary();
  mocks.stats = [];
  mocks.summaryLoading = false;
  mocks.statsLoading = false;
  mocks.summaryError = false;
  mocks.statsError = false;
  mocks.refetchSummary.mockReset();
  mocks.refetchStats.mockReset();
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
    mocks.summary = null;
    renderStats();

    expect(screen.getByText("No workout data yet")).toBeTruthy();
  });

  it("offers retry when either request fails", async () => {
    mocks.summaryError = true;
    renderStats();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(mocks.refetchSummary).toHaveBeenCalledTimes(1));
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
    mocks.stats = [
      {
        id: "Bench Press",
        exerciseName: "Bench Press",
        totalSets: 10,
        totalReps: 50,
        totalVolume: 12000,
        maxWeight: 225,
        maxWeightReps: 5,
        lastPerformedAt: "2026-09-20T10:00:00.000Z",
        weeklyHistory: [
          {
            weekStart: "2026-09-14T00:00:00.000Z",
            sets: 10,
            reps: 50,
            volume: 12000,
            maxWeight: 225,
          },
        ],
      },
    ];
    renderStats();

    expect(screen.getByRole("img", { name: /12\.0K volume/ })).toBeTruthy();
  });
});
