import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExerciseItem } from "./ExerciseItem";

afterEach(() => {
  cleanup();
});

describe("exercise item volume", () => {
  it("shows set count and total volume in the display unit", () => {
    render(
      <ExerciseItem
        exercise={{
          id: "ex-1",
          name: "Bench Press",
          category: "chest",
          sets: [
            { id: "set-1", weight: 100, reps: 5 },
            { id: "set-2", weight: 100, reps: 3 },
          ],
        }}
        unit="lbs"
        onClick={() => {}}
      />,
    );

    expect(screen.getByText("2 Sets • 800 lbs total")).toBeTruthy();
  });

  it("converts stored lbs volume to kilograms for display", () => {
    render(
      <ExerciseItem
        exercise={{
          id: "ex-1",
          name: "Bench Press",
          sets: [{ id: "set-1", weight: 100, reps: 5 }],
        }}
        unit="kgs"
        onClick={() => {}}
      />,
    );

    expect(screen.getByText("1 Set • 227 kgs total")).toBeTruthy();
  });

  it("omits the volume for weightless sets", () => {
    render(
      <ExerciseItem
        exercise={{
          id: "ex-1",
          name: "Plank",
          sets: [{ id: "set-1", weight: 0, reps: 1 }],
        }}
        unit="lbs"
        onClick={() => {}}
      />,
    );

    expect(screen.getByText("1 Set")).toBeTruthy();
    expect(screen.queryByText(/total/)).toBeNull();
  });
});
