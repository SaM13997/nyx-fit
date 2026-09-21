import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WeightEntry } from "@/lib/types";
import { WeightChart } from "./WeightChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
}));

const DAY = 86_400_000;

const entry = (id: string, daysAgo: number, weight = 180): WeightEntry => ({
  id,
  date: new Date(Date.now() - daysAgo * DAY).toISOString(),
  weight,
});

afterEach(() => {
  cleanup();
});

describe("WeightChart ranges", () => {
  it("renders the quarter button and marks month as the default range", () => {
    render(<WeightChart weights={[entry("a", 3)]} unit="lbs" />);

    expect(screen.getByRole("button", { name: "Q" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "M" }) as HTMLButtonElement)
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      (screen.getByRole("button", { name: "Q" }) as HTMLButtonElement)
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("switches to the quarter range when Q is pressed", () => {
    render(<WeightChart weights={[entry("a", 3)]} unit="lbs" />);

    fireEvent.click(screen.getByRole("button", { name: "Q" }));

    expect(
      (screen.getByRole("button", { name: "Q" }) as HTMLButtonElement)
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      (screen.getByRole("button", { name: "M" }) as HTMLButtonElement)
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("shows the empty-range state instead of falling back to all history", () => {
    render(<WeightChart weights={[entry("old", 200)]} unit="lbs" />);

    expect(screen.getByText("No weigh-ins in this range")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Y" }));

    expect(screen.queryByText("No weigh-ins in this range")).toBeNull();
  });

  it("keeps the no-data state when there is no history at all", () => {
    render(<WeightChart weights={[]} unit="lbs" />);

    expect(screen.getByText("No data to chart")).toBeTruthy();
  });
});
