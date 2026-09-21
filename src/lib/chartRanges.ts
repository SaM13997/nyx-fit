import type { WeightEntry } from "@/lib/types";

export type ChartRange = "week" | "month" | "quarter" | "year";

export const RANGE_CONFIG: Record<ChartRange, { label: string; days: number }> = {
  week: { label: "W", days: 7 },
  month: { label: "M", days: 30 },
  quarter: { label: "Q", days: 90 },
  year: { label: "Y", days: 365 },
};

export const CHART_RANGES: readonly ChartRange[] = [
  "week",
  "month",
  "quarter",
  "year",
];

export const DAY_MS = 86_400_000;

export function filterWeightsForRange(
  weights: WeightEntry[],
  range: ChartRange,
  now: number,
): WeightEntry[] {
  const rangeStart = now - RANGE_CONFIG[range].days * DAY_MS;
  return weights.filter((entry) => {
    const entryTime = new Date(entry.date).getTime();
    return entryTime >= rangeStart && entryTime <= now;
  });
}

export function sortByDateAsc(weights: WeightEntry[]): WeightEntry[] {
  return [...weights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export function integerTicks(min: number, max: number): number[] {
  const lo = Math.floor(min);
  const hi = Math.ceil(max);
  if (hi <= lo) return [lo];
  const span = hi - lo;
  const step = Math.max(1, Math.ceil(span / 4));
  const ticks: number[] = [];
  for (let tick = lo; tick <= hi; tick += step) {
    ticks.push(tick);
  }
  const last = ticks[ticks.length - 1];
  if (last !== undefined && last !== hi) {
    ticks.push(hi);
  }
  return ticks;
}
