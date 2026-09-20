import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddExerciseDrawer } from "./AddExerciseDrawer";

type AddSetHandler = (
  exerciseName: string,
  category: string,
  weight: number,
  reps: number,
) => Promise<boolean>;

const onAddSet = vi.fn<AddSetHandler>();

function renderDrawer() {
  return render(
    <AddExerciseDrawer
      isOpen
      onClose={() => {}}
      onAddSet={onAddSet}
      unit="lbs"
      exercises={[]}
    />,
  );
}

afterEach(() => {
  cleanup();
  onAddSet.mockReset();
});

describe("custom exercise entry", () => {
  it("logs a set for a custom typed exercise with the inferred category", async () => {
    onAddSet.mockResolvedValue(true);
    renderDrawer();

    fireEvent.click(
      screen.getByRole("button", { name: "Type a custom exercise" }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Custom exercise name" }),
      { target: { value: "Chest Supported Row" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Select Chest Supported Row" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Log Set" }));

    await waitFor(() =>
      expect(onAddSet).toHaveBeenCalledWith(
        "Chest Supported Row",
        "chest",
        45,
        8,
      ),
    );
  });

  it("applies the manual category override to a custom exercise", async () => {
    onAddSet.mockResolvedValue(true);
    renderDrawer();

    fireEvent.click(
      screen.getByRole("button", { name: "Type a custom exercise" }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Custom exercise name" }),
      { target: { value: "Belt Squat" } },
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "legs" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Select Belt Squat" }));
    fireEvent.click(screen.getByRole("button", { name: "Log Set" }));

    await waitFor(() =>
      expect(onAddSet).toHaveBeenCalledWith("Belt Squat", "legs", 45, 8),
    );
  });

  it("keeps a manual category override while the name keeps changing", async () => {
    onAddSet.mockResolvedValue(true);
    renderDrawer();

    fireEvent.click(
      screen.getByRole("button", { name: "Type a custom exercise" }),
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Custom exercise name" }),
      { target: { value: "Belt Squat" } },
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "chest" },
    });
    fireEvent.change(
      screen.getByRole("textbox", { name: "Custom exercise name" }),
      { target: { value: "Belt Squat Press" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Select Belt Squat Press" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Log Set" }));

    await waitFor(() =>
      expect(onAddSet).toHaveBeenCalledWith(
        "Belt Squat Press",
        "chest",
        45,
        8,
      ),
    );
  });

  it("disables selecting until a custom name is entered", () => {
    renderDrawer();

    fireEvent.click(
      screen.getByRole("button", { name: "Type a custom exercise" }),
    );
    const selectButton = screen.getByRole("button", {
      name: "Select an exercise",
    }) as HTMLButtonElement;
    expect(selectButton.disabled).toBe(true);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Custom exercise name" }),
      { target: { value: "   " } },
    );
    expect(selectButton.disabled).toBe(true);
  });
});
