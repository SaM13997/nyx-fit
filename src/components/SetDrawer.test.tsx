import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SetDrawer } from "./SetDrawer";
import type { Workout, WorkoutSet, WeightUnit } from "@/lib/types";

type UpdateHandler = (
  exerciseId: string,
  sets: WorkoutSet[],
) => Promise<boolean>;

const makeWorkout = (
  revision: number,
  weight: number,
  reps: number,
): Workout => ({
  id: "workout-1",
  date: "2026-09-16T10:00:00.000Z",
  duration: 60,
  isActive: true,
  revision,
  exercises: [
    {
      id: "exercise-1",
      name: "Bench Press",
      sets: [{ id: "set-1", weight, reps }],
    },
  ],
});

function renderDrawer(
  workout: Workout,
  onUpdate: UpdateHandler,
  unit: WeightUnit = "lbs",
) {
  return render(
    <SetDrawer
      isOpen
      onClose={() => {}}
      exerciseId="exercise-1"
      unit={unit}
      workout={workout}
      onUpdate={onUpdate}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("set drawer editing", () => {
  it("commits a multi-digit weight once on blur instead of saving each keystroke", async () => {
    const onUpdate = vi.fn<UpdateHandler>().mockResolvedValue(true);
    renderDrawer(makeWorkout(1, 100, 5), onUpdate);

    const input = screen.getByDisplayValue("100") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.change(input, { target: { value: "13" } });
    fireEvent.change(input, { target: { value: "135" } });

    expect(onUpdate).not.toHaveBeenCalled();
    expect(input.value).toBe("135");

    fireEvent.blur(input);

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onUpdate).toHaveBeenCalledWith("exercise-1", [
      { id: "set-1", weight: 135, reps: 5 },
    ]);
  });

  it("keeps the typed value and retries the draft after a failed save", async () => {
    const onUpdate = vi
      .fn<UpdateHandler>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    renderDrawer(makeWorkout(1, 100, 5), onUpdate);

    const input = screen.getByDisplayValue("100") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "135" } });
    fireEvent.blur(input);

    await screen.findByText("Couldn't save that change.");
    expect(input.value).toBe("135");

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(2));
    expect(onUpdate).toHaveBeenLastCalledWith("exercise-1", [
      { id: "set-1", weight: 135, reps: 5 },
    ]);
    await waitFor(() =>
      expect(screen.queryByText("Couldn't save that change.")).toBeNull(),
    );
  });

  it("ignores duplicate commits while a save is pending", async () => {
    let resolveUpdate: (saved: boolean) => void = () => {};
    const onUpdate = vi.fn<UpdateHandler>(
      () =>
        new Promise<boolean>((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    renderDrawer(makeWorkout(1, 100, 5), onUpdate);

    const input = screen.getByDisplayValue("100") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "135" } });
    fireEvent.blur(input);
    fireEvent.blur(input);
    fireEvent.blur(input);

    expect(onUpdate).toHaveBeenCalledTimes(1);

    resolveUpdate(true);
    await waitFor(() => expect(input.value).toBe("135"));
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it("shows the refreshed remote sets when the authoritative revision changes", async () => {
    const onUpdate = vi.fn<UpdateHandler>().mockResolvedValue(true);
    const { rerender } = renderDrawer(makeWorkout(1, 100, 5), onUpdate);

    const input = screen.getByDisplayValue("100") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "135" } });
    expect(input.value).toBe("135");

    rerender(
      <SetDrawer
        isOpen
        onClose={() => {}}
        exerciseId="exercise-1"
        unit="lbs"
        workout={makeWorkout(2, 200, 5)}
        onUpdate={onUpdate}
      />,
    );

    await waitFor(() => expect(screen.getByDisplayValue("200")).toBeTruthy());
    expect(screen.getByText(/This workout changed elsewhere/)).toBeTruthy();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe("quick-adjust steppers", () => {
  it("nudges reps and weight a step at a time without opening the field", async () => {
    const onUpdate = vi.fn<UpdateHandler>().mockResolvedValue(true);
    renderDrawer(makeWorkout(1, 100, 5), onUpdate);

    fireEvent.click(screen.getByRole("button", { name: "Increase reps" }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenLastCalledWith("exercise-1", [
        { id: "set-1", weight: 100, reps: 6 },
      ]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Decrease weight" }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenLastCalledWith("exercise-1", [
        { id: "set-1", weight: 95, reps: 6 },
      ]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Increase weight" }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenLastCalledWith("exercise-1", [
        { id: "set-1", weight: 100, reps: 6 },
      ]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Decrease reps" }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenLastCalledWith("exercise-1", [
        { id: "set-1", weight: 100, reps: 5 },
      ]),
    );

    expect(onUpdate).toHaveBeenCalledTimes(4);
  });

  it("steps the weight by the display unit", async () => {
    const onUpdate = vi.fn<UpdateHandler>().mockResolvedValue(true);
    renderDrawer(makeWorkout(1, 100, 5), onUpdate, "kgs");

    fireEvent.click(screen.getByRole("button", { name: "Increase weight" }));

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith("exercise-1", [
        { id: "set-1", weight: 102.5, reps: 5 },
      ]),
    );
  });

  it("disables the steppers that cannot move any further", async () => {
    const onUpdate = vi.fn<UpdateHandler>().mockResolvedValue(true);
    renderDrawer(makeWorkout(1, 0, 1), onUpdate);

    const decreaseWeight = screen.getByRole<HTMLButtonElement>("button", {
      name: "Decrease weight",
    });
    const decreaseReps = screen.getByRole<HTMLButtonElement>("button", {
      name: "Decrease reps",
    });

    expect(decreaseWeight.disabled).toBe(true);
    expect(decreaseReps.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Increase reps" }));

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith("exercise-1", [
        { id: "set-1", weight: 0, reps: 2 },
      ]),
    );
  });

  it("disables the increment steppers at the ceiling", () => {
    const onUpdate = vi.fn<UpdateHandler>().mockResolvedValue(true);
    renderDrawer(makeWorkout(1, 100000, 10000), onUpdate);

    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Increase weight" })
        .disabled,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Increase reps" })
        .disabled,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Decrease reps" })
        .disabled,
    ).toBe(false);
  });
});
