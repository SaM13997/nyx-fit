import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Workout } from "@/lib/types";
import { Route } from "./workout.$id";

const mocks = vi.hoisted(() => ({
  workout: null as Workout | null,
  refetch: vi.fn(),
  updateWorkout: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/lib/api/hooks", () => ({
  useWorkout: () => ({
    workout: mocks.workout,
    isLoading: false,
    isError: false,
    refetch: mocks.refetch,
  }),
  useCurrentProfile: () => ({ profile: { weightUnit: "lbs" } }),
  useUpdateWorkout: () => ({
    updateWorkout: mocks.updateWorkout,
    isPending: false,
  }),
}));

vi.mock("@/lib/toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
    success: vi.fn(),
    error: mocks.showError,
  }),
}));

vi.mock("@/lib/AppearanceContext", () => ({
  useAppearance: () => ({ restTimerDuration: 60 }),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...original,
    createFileRoute: () => (options: unknown) => ({
      options,
      useParams: () => ({ id: "workout-1" }),
    }),
    Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  };
});

// Node >= 22 registers an experimental global `localStorage` getter that
// resolves to undefined when --localstorage-file is not provided. Because
// that key already exists on the worker global, vitest's jsdom environment
// skips installing jsdom's own storage, so bare `localStorage` reads in the
// route and RestTimer crash. Stub it so tests behave like the browser.
vi.stubGlobal("localStorage", {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
});

const makeWorkout = (revision: number, isActive: boolean): Workout => ({
  id: "workout-1",
  date: "2026-09-16T10:00:00.000Z",
  duration: 60,
  startTime: "2026-09-16T10:00:00.000Z",
  isActive,
  revision,
  exercises: [],
  bodyPartWorkedOut: ["chest"],
});

function renderWorkoutRoute() {
  const Component = Route.options.component;
  if (typeof Component !== "function") {
    throw new Error("Workout route component is unavailable");
  }
  return render(<Component />);
}

beforeEach(() => {
  mocks.workout = makeWorkout(1, true);
  mocks.refetch.mockReset();
  mocks.updateWorkout.mockReset();
  mocks.showError.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("workout route saves", () => {
  it("does not replay a stale revision after a CAS conflict", async () => {
    mocks.updateWorkout
      .mockResolvedValueOnce({ ok: false, reason: "conflict" })
      .mockResolvedValueOnce({ ok: true, workout: makeWorkout(2, false) });
    mocks.refetch.mockResolvedValue({ data: makeWorkout(2, true) });

    renderWorkoutRoute();

    fireEvent.click(screen.getByRole("button", { name: "End workout" }));
    fireEvent.click(screen.getByRole("button", { name: "End Workout" }));

    await waitFor(() => expect(mocks.updateWorkout).toHaveBeenCalledTimes(1));
    expect(mocks.updateWorkout).toHaveBeenNthCalledWith(1, {
      id: "workout-1",
      revision: 1,
      updates: expect.objectContaining({ isActive: false }),
    });

    await waitFor(() => expect(mocks.showError).toHaveBeenCalledTimes(1));
    expect(screen.getByText("End Workout?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "End Workout" }));

    await waitFor(() => expect(mocks.updateWorkout).toHaveBeenCalledTimes(2));
    expect(mocks.updateWorkout).toHaveBeenNthCalledWith(2, {
      id: "workout-1",
      revision: 2,
      updates: expect.objectContaining({ isActive: false }),
    });
  });

  it("submits a single save while a write is in flight", async () => {
    let resolveUpdate: (value: unknown) => void = () => {};
    mocks.updateWorkout.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    renderWorkoutRoute();

    fireEvent.click(screen.getByRole("button", { name: "End workout" }));
    const confirm = screen.getByRole("button", { name: "End Workout" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(mocks.updateWorkout).toHaveBeenCalledTimes(1);
    expect((confirm as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      resolveUpdate({ ok: true, workout: makeWorkout(2, false) });
    });

    await waitFor(() => expect(screen.queryByText("End Workout?")).toBeNull());
  });

  it("keeps the end workout dialog open when the save fails", async () => {
    mocks.updateWorkout.mockResolvedValue({ ok: false, reason: "conflict" });
    mocks.refetch.mockResolvedValue({ data: makeWorkout(2, true) });

    renderWorkoutRoute();

    fireEvent.click(screen.getByRole("button", { name: "End workout" }));
    fireEvent.click(screen.getByRole("button", { name: "End Workout" }));

    await waitFor(() => expect(mocks.showError).toHaveBeenCalledTimes(1));
    expect(screen.getByText("End Workout?")).toBeTruthy();
  });

  it("merges a custom exercise into an existing card when the name matches", async () => {
    mocks.workout = {
      ...makeWorkout(1, true),
      exercises: [
        {
          id: "exercise-1",
          name: "Squat",
          sets: [{ id: "set-1", weight: 100, reps: 5 }],
        },
      ],
    };
    mocks.updateWorkout.mockResolvedValue({ ok: true, workout: makeWorkout(2, true) });
    renderWorkoutRoute();

    fireEvent.click(screen.getByRole("button", { name: "Add Exercise" }));
    fireEvent.click(screen.getByRole("button", { name: "Type a custom exercise" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "Custom exercise name" }),
      { target: { value: "Squat" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Select Squat" }));
    fireEvent.click(screen.getByRole("button", { name: "Log Set" }));

    await waitFor(() => expect(mocks.updateWorkout).toHaveBeenCalledTimes(1));
    expect(mocks.updateWorkout).toHaveBeenCalledWith({
      id: "workout-1",
      revision: 1,
      updates: expect.objectContaining({
        exercises: [
          expect.objectContaining({
            name: "Squat",
            sets: [
              { id: "set-1", weight: 100, reps: 5 },
              expect.objectContaining({ weight: 45, reps: 8 }),
            ],
          }),
        ],
      }),
    });
  });
});
