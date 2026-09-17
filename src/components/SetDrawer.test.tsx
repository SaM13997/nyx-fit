import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SetDrawer } from "./SetDrawer";
import type { Workout, WorkoutSet } from "@/lib/types";

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

function renderDrawer(workout: Workout, onUpdate: UpdateHandler) {
  return render(
    <SetDrawer
      isOpen
      onClose={() => {}}
      exerciseId="exercise-1"
      unit="lbs"
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
