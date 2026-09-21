import { describe, expect, it } from "vitest";
import type { WeightEntry } from "@/lib/types";
import {
  CHART_RANGES,
  RANGE_CONFIG,
  filterWeightsForRange,
  integerTicks,
  sortByDateAsc,
} from "./chartRanges";

const NOW = Date.UTC(2026, 8, 21, 12, 0, 0);
const DAY = 86_400_000;

const entry = (id: string, daysAgo: number, weight = 180): WeightEntry => ({
  id,
  date: new Date(NOW - daysAgo * DAY).toISOString(),
  weight,
});

describe("chart range config", () => {
  it("offers week, month, quarter and year with stable labels", () => {
    expect(CHART_RANGES).toEqual(["week", "month", "quarter", "year"]);
    expect(RANGE_CONFIG.quarter).toEqual({ label: "Q", days: 90 });
    expect(RANGE_CONFIG.week.days).toBe(7);
    expect(RANGE_CONFIG.month.days).toBe(30);
    expect(RANGE_CONFIG.year.days).toBe(365);
  });
});

describe("filterWeightsForRange", () => {
  it("keeps entries inside the range and drops older ones", () => {
    const weights = [entry("a", 1), entry("b", 5), entry("c", 40)];
    const filtered = filterWeightsForRange(weights, "month", NOW);
    expect(filtered.map((w) => w.id)).toEqual(["a", "b"]);
  });

  it("excludes entries dated after the reference time for every range", () => {
    const future: WeightEntry = {
      id: "future",
      date: new Date(NOW + 2 * DAY).toISOString(),
      weight: 180,
    };
    for (const range of CHART_RANGES) {
      expect(filterWeightsForRange([future, entry("a", 1)], range, NOW).map((w) => w.id)).toEqual(["a"]);
    }
  });

  it("returns an empty list when no entries fall inside the range", () => {
    const weights = [entry("old", 200), entry("older", 400)];
    expect(filterWeightsForRange(weights, "week", NOW)).toEqual([]);
  });
});

describe("sortByDateAsc", () => {
  it("orders newest-last regardless of input order", () => {
    const sorted = sortByDateAsc([entry("new", 1), entry("old", 30), entry("mid", 10)]);
    expect(sorted.map((w) => w.id)).toEqual(["old", "mid", "new"]);
  });
});

describe("integerTicks", () => {
  it("produces increasing integer ticks covering the padded domain", () => {
    expect(integerTicks(148.2, 166.7)).toEqual([148, 153, 158, 163, 167]);
  });

  it("keeps a minimum step of 1 for tight domains", () => {
    expect(integerTicks(180, 181.4)).toEqual([180, 181, 182]);
  });

  it("returns a single tick for a flat domain", () => {
    expect(integerTicks(175, 175)).toEqual([175]);
  });
});
