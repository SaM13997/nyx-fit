# Progress Pages Polish Implementation Plan (Roadmap Lane 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. There are NO commit steps — the orchestrator commits after each task goes green.

**Goal:** Polish the progress surfaces — the weights chart range selector (including the 3-month range explicitly deferred from `2026-09-20-port-nyx-fitness-gaps.md`), stats page alignment with the workouts/weights design language, and record surfacing (personal records, body-part training frequency) using existing endpoints only.

**Architecture:** All chart range/bucketing math is extracted into one pure module (`src/lib/chartRanges.ts` — placed in `src/lib/` during implementation so its tests run in the server/node vitest project, like `units.ts`) consumed by `WeightChart`; chart *rendering* is never the test seam (recharts `ResponsiveContainer` cannot be measured in jsdom — no ResizeObserver — so tests mock the recharts render layer at that stated seam and assert only the component's own UI and state). Stats record/frequency derivation is one pure module (`src/lib/stats.ts`) over data the existing `useExerciseStats` / `useWorkouts` endpoints already return; zero server changes and zero schema changes.

**Tech Stack:** React 19 + TypeScript strict, TanStack Start/Router, recharts 3.8.0 (already in `package.json:61` — no new dependencies), date-fns 4.x, Tailwind v4, TanStack Query hooks, vitest two-project setup (ui/jsdom for `src/**` except `src/lib`; server/node for `src/lib/**`), Bun for all commands.

**Spec:** `docs/plans/roadmap.md` Lane 3: "Weights chart polish: uniform x-padding, W/M/Y range buttons (week view was broken in the old app; re-verify here), integer y-axis labels, 3-month range"; "Stats page alignment with the workouts/weights design language; record surfacing (PRs), volume trends, body-part training frequency"; "[verify] Exercise-specific progression charts and body-weight correlation."

## Source evidence (current-code verification, 2026-09-21)

1. **The W/M/Y selector already exists** in this implementation — `WeightChart.tsx:23-29` defines `TimeRange = "week" | "month" | "year"` with `RANGE_CONFIG` and renders the pill buttons (`WeightChart.tsx:108-121`). The old nyx-fitness "week view broken" bug does not map to this code. The real defect found instead: `WeightChart.tsx:76` silently falls back to the *entire* history when the selected range has no entries (`const source = filtered.length > 0 ? filtered : weights`), so picking "W" on sparse data renders a full-year line under a "week" label — the same user-visible symptom ("range selector seems broken"), different cause.
2. **Year range includes future-dated entries** — `WeightChart.tsx:73` skips the `entryTime <= now` upper bound when `range === "year"`, so clock-skewed/future-dated entries appear in "year" but vanish when switching to "month". All ranges should share one filter.
3. **Integer y-axis labels are only half-done** — `tickFormatter` rounds (`WeightChart.tsx:149`), but the domain endpoints (`Math.floor/ceil(min/max ± 5)`, lines 96-99) do not guarantee recharts computes integer ticks in between, so rounding can produce duplicate adjacent labels (e.g. two "150"s). Fix: compute integer ticks purely and pass them via the `ticks` prop.
4. **Horizontal padding is not uniform** — `margin={{ top: 8, right: 12, bottom: 8, left: 12 }}` plus `YAxis width={38}` plus the first-x-tick `+8` nudge in `XAxisTick` (`WeightChart.tsx:43`) stack inconsistently; the first tick is also force-aligned "start" while others are "middle".
5. **Stats page shell drifts from weights** — `stats.tsx:39` uses `h-[30vh]` and `text-5xl` where `weights.tsx:136,154` uses `h-[35vh]` and `text-6xl`; `stats.tsx` lacks `overflow-x-clip` and the `px-1` subtitle placement pattern (`weights.tsx:164-168`).
6. **Stats cards hardcode units** — `ExerciseStatCard` renders `Max lbs` (`stats.tsx:309`) and raw stored-lbs volume (`stats.tsx:312`) with no `convertWeightFromLbs`, unlike every weights surface. `ExerciseStat` already carries everything a PR list needs: `maxWeight`, `maxWeightReps`, `lastPerformedAt` (`src/lib/types.ts:70-80`), and `weeklyHistory` already powers a volume trend (`stats.tsx:320-374`).
7. **Body-part frequency data exists client-side** — `Workout.bodyPartWorkedOut?: string[]` (`src/lib/types.ts:9`) on completed workouts, already returned by `useWorkouts` (`hooks.ts:139-157` → `listWorkouts`). No new server query is needed for any Lane 3 record item.

## Deviations from the roadmap's assumptions (deliberate, stated)

- **"W/M/Y range buttons" are not built from scratch — they exist.** This lane adds the missing `"quarter"` (3-month) entry and fixes the range *filtering* semantics; the roadmap's "re-verify here" is disposed as finding 1 above.
- **The silent fallback-to-all-history is removed, not preserved.** An empty range now shows an explicit "No weigh-ins in this range" state. Showing a full-year line under a "week" label is a correctness bug, not graceful degradation.
- **Range filtering gains a shared upper bound (`<= now`) for all ranges** including "year", disposing the future-entry inconsistency (finding 2). Entries the user back-dates into the future stop leaking into charts.
- **Chart rendering is NOT a test seam.** Per the port plan's deferred-item constraint: `ResponsiveContainer` needs ResizeObserver, which jsdom lacks. The seams are (a) the pure module `chartRanges.ts` (filtering, sorting, tick math — directly unit-tested) and (b) `WeightChart`'s own header/buttons/empty-states, tested with the recharts render layer mocked at the module boundary (stated reason: third-party layout engine needs real DOM measurement). Chart geometry (actual pixel padding, tick collisions) is verified manually in `bun run dev` and listed as such.
- **Records are derived client-side, no new server function.** `useExerciseStats` already aggregates per-exercise max weight/reps; `useWorkouts` already returns `bodyPartWorkedOut` per completed workout. A server-side query would duplicate this for zero benefit.

## Explicit deferrals (stated, not silently dropped)

- **Exercise-specific progression charts (`[verify]`): deferred.** Verified feasible — `ExerciseStat.weeklyHistory` (12 weeks per exercise, `store.server.ts:779-781`) already carries the data — but the aggregate "Weekly Volume Trend" chart already surfaces the trend, and a per-exercise chart picker re-incurs the jsdom chart-seam cost for marginal value. Revisit if users ask for per-lift detail; the data endpoint requires no change.
- **Body-weight vs strength correlation (`[verify]`): deferred.** Both datasets (`useWeights`, exercise volume) are client-available so nothing blocks it, but it needs an agreed methodology (which volume — sets×reps×weight? which window? correlation vs overlay?) and is an insight feature, not polish. Scope it as its own item rather than designing it ad hoc here.
- **Volume trend chart redesign:** the existing `WeeklyVolumeChart` stays; this lane only adds an accessible name to its bars (Task 3) and does not re-design it. A hover-only tooltip with no keyboard/AT equivalent is noted as a P2 in Review Focus.

## Task dependency map (tracer bullets, ordered by value)

Tasks are vertical slices; each ends green (`bun run typecheck` + tests) and is independently shippable.

| # | Task | Value lane | Blocked by |
|---|------|-----------|------------|
| 1 | Pure chart-range module (`chartRanges.ts`) incl. `"quarter"` | Weights chart (foundation) | None |
| 2 | WeightChart wiring: Q range, honest empty state, uniform padding, integer ticks | Weights chart | Task 1 |
| 3 | Stats page shell alignment + a11y pass | Stats alignment | None |
| 4 | Personal records + body-part frequency + unit-aware stats cards | Record surfacing | Task 3 |

## Global Constraints

- All commands run with Bun: `bun run typecheck`, `bun run test`, `bun run test <path>` for one file.
- No new dependencies (`recharts` 3.8.0 and `date-fns` are already installed). No new lint config; the gates are typecheck + tests.
- TypeScript strict: no `any` in new code, named exports only, `type` aliases over `interface`, string-literal unions over enums, exhaustive switches with `satisfies never`. Do not reformat untouched code (e.g. `stats.tsx`'s existing `as any` style prop and `icon: React.ReactNode` prop stay as-is except where a task edits that exact block).
- Parse, don't validate: no bare casts on external data. (The test files use exact-type module mocks per the established `settings.test.tsx` / `-workout.$id.test.tsx` pattern — those are test harnesses, not production casts.)
- SSR awareness: chart date math runs in `useMemo`/render only with values derived from props and `Date.now()` — no new `window`/`localStorage` access is introduced anywhere in this plan.
- Dark-first design, WCAG AA contrast, >= 44px touch targets (range buttons use the existing `Button` `size="sm"` inside a larger pill — preserve the current pill's hit area; if it measures under 44px tall, add `min-h-11` to the buttons), reduced motion respected (no new motion is introduced; existing `animate-pulse` skeletons are fine). No comments and no emojis in code.
- `src/routeTree.gen.ts` is auto-generated — never hand-edit it; no new routes are added by this plan.
- Tests live at the two project seams: ui/jsdom for `src/components/**` and `src/routes/**` tests; server/node for `src/lib/**` tests. Never assert on recharts-rendered SVG.

## Review Focus

Five input classes / failure modes no task's happy path exercises. Each is pinned to an owning task's test.

1. **Sparse data in short ranges** — a user with one weigh-in 6 months ago picks "W". Expected: explicit "No weigh-ins in this range" state, never a silently expanded line. Pinned by Task 1, test "returns an empty list when no entries fall inside the range", and Task 2, test "shows the empty-range state instead of falling back to all history".
2. **Future-dated entries (clock skew / back-dated logs)** — expected: excluded from every range including "year". Pinned by Task 1, test "excludes entries dated after the reference time for every range".
3. **kgs users reading chart axes and records** — stored values are always lbs; expected: domain/tick math runs on converted values and record/frequency copy converts with `convertWeightFromLbs` + `formatWeight`. Pinned by Task 1, test "produces increasing integer ticks covering the padded domain", and Task 4, route test "lists personal records converted to the display unit".
4. **Zero-weight exercises in the PR list** — bodyweight sets (Plank, `weight: 0`) must not render as "0 lbs" records. Expected: filtered out. Pinned by Task 4, lib test "skips exercises whose heaviest set carried no weight".
5. **Workouts without `bodyPartWorkedOut`** — the field is optional and older/quick workouts may lack it. Expected: derivation tolerates `undefined` and counts nothing for them without crashing. Pinned by Task 4, lib test "ignores workouts without body-part tags".

---

### Task 1: Pure chart-range module (`chartRanges.ts`)

**Files:**
- Create: `src/lib/chartRanges.ts`
- Test: `src/lib/chartRanges.test.ts` (create; server/node project — pure functions, no DOM needed)

**Interfaces:**
- Consumes: `WeightEntry` from `@/lib/types`.
- Produces (Task 2 consumes exactly these):

```ts
export type ChartRange = "week" | "month" | "quarter" | "year";

export const RANGE_CONFIG: Record<ChartRange, { label: string; days: number }>;

export const CHART_RANGES: readonly ChartRange[];

export function filterWeightsForRange(
  weights: WeightEntry[],
  range: ChartRange,
  now: number,
): WeightEntry[];

export function sortByDateAsc(
  weights: WeightEntry[],
): WeightEntry[];

export function integerTicks(
  min: number,
  max: number,
): number[];
```

Behavior contract: `filterWeightsForRange` keeps entries with `rangeStart <= entryTime <= now` for **every** range (no future leak, no all-history fallback); `integerTicks` returns strictly increasing integers covering `[floor(min), ceil(max)]` with a minimum step of 1 and a step sized for roughly four intervals.

- [ ] **Step 1: Write the failing test**

Create `src/lib/chartRanges.test.ts`:

```ts
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
```

Worked examples (independent of the implementation): `integerTicks(148.2, 166.7)` — lo = 148, hi = 167, span 19, step = `ceil(19 / 4)` = 5 → 148, 153, 158, 163, then 168 > 167 stops, so hi is appended: `[148, 153, 158, 163, 167]`. `integerTicks(180, 181.4)` — lo = 180, hi = `ceil(181.4)` = 182, span 2, step = `max(1, ceil(2 / 4))` = 1 → `[180, 181, 182]`. `integerTicks(175, 175)` — `hi <= lo` → `[175]`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/lib/chartRanges.test.ts`
Expected: FAIL — `Failed to resolve import "./chartRanges"` (module does not exist).

- [ ] **Step 3: Write the module**

Create `src/lib/chartRanges.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/lib/chartRanges.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Run the gates**

Run: `bun run typecheck && bun run test`
Expected: all PASS (nothing consumes the module yet; the existing suite must stay green).

---

### Task 2: WeightChart wiring — quarter range, honest empty state, uniform padding, integer ticks

**Files:**
- Modify: `src/components/weights/WeightChart.tsx` (local `TimeRange`/`RANGE_CONFIG` at lines 23-29, data `useMemo` at lines 67-85, empty state at lines 87-93, chart margin/axes at lines 124-152, range buttons at lines 108-121)
- Test: `src/components/weights/WeightChart.test.tsx` (create)

**Interfaces:**
- Consumes: `ChartRange`, `RANGE_CONFIG`, `CHART_RANGES`, `filterWeightsForRange`, `sortByDateAsc`, `integerTicks` from `./chartRanges` (Task 1); existing props `weights: WeightEntry[]`, `goal?: WeightGoal | null`, `unit: WeightUnit` — unchanged, so `weights.tsx` needs no edit.
- Produces: no exports. The range pill now shows W / M / Q / Y; each button carries `aria-pressed`; an empty selected range renders an explicit message instead of fallback data.
- Range semantics: `quarter` is a fixed trailing 90-day window labeled "Q", not three calendar months.

- [ ] **Step 1: Write the failing test**

Create `src/components/weights/WeightChart.test.tsx`:

```tsx
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
```

The recharts mock is at the stated seam (third-party chart engine needs real DOM measurement — jsdom has no ResizeObserver); everything asserted is this component's own UI.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/components/weights/WeightChart.test.tsx`
Expected: FAIL — first test cannot find `role "button"` with name `"Q"` (no quarter range today), and no `aria-pressed` attribute exists.

- [ ] **Step 3: Implement**

In `src/components/weights/WeightChart.tsx`:

1. Replace the local `TimeRange`/`RANGE_CONFIG` block (lines 23-29) with the module import:

```tsx
import {
  CHART_RANGES,
  RANGE_CONFIG,
  filterWeightsForRange,
  integerTicks,
  sortByDateAsc,
  type ChartRange,
} from "./chartRanges";
```

2. Replace the data `useMemo` (lines 67-85) — no more fallback, no more year-only upper bound:

```tsx
const [range, setRange] = useState<ChartRange>("month");

const data = useMemo(() => {
  const inRange = filterWeightsForRange(weights, range, Date.now());
  return sortByDateAsc(inRange).map((entry) => ({
    ...entry,
    weightConverted: convertWeightFromLbs(entry.weight, unit),
    dateFormatted: format(new Date(entry.date), range === "year" ? "MMM" : "MMM d"),
  }));
}, [range, unit, weights]);
```

3. Split the empty states — keep the existing no-history branch, add the empty-range branch:

```tsx
if (weights.length === 0) {
  return (
    <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
      <p className="text-zinc-500 text-sm">No data to chart</p>
    </div>
  );
}

if (data.length === 0) {
  return (
    <div className="space-y-4">
      <RangeHeader range={range} onRangeChange={setRange} unit={unit} />
      <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">No weigh-ins in this range</p>
      </div>
    </div>
  );
}
```

Extract the existing header + pill (lines 103-122) into a local `RangeHeader({ range, onRangeChange, unit })` component in the same file so both branches share it. In the pill, map `CHART_RANGES` instead of `Object.keys(RANGE_CONFIG)` and add `aria-pressed`:

```tsx
{CHART_RANGES.map((key) => (
  <Button
    key={key}
    type="button"
    variant="ghost"
    size="sm"
    aria-pressed={range === key}
    onClick={() => onRangeChange(key)}
    className={range === key ? "bg-orange-500 text-black hover:bg-orange-400 hover:text-black" : "text-zinc-400 hover:text-white"}
  >
    {RANGE_CONFIG[key].label}
  </Button>
))}
```

Verified: `Button` (`src/components/ui/button.tsx:43-62`) spreads `...props` (typed `React.ComponentProps<"button">`) onto the underlying `<button>`, so `aria-pressed` reaches the DOM; the button component needs no change.

4. Uniform horizontal padding: replace the chart `margin` (line 126) with a file-level constant, drop the first-tick nudge in `XAxisTick` (remove the `index` prop usage so every tick anchors "middle"), and give the x-axis symmetric data padding:

```tsx
const CHART_MARGIN = { top: 8, right: 16, bottom: 8, left: 0 };
```

```tsx
<XAxis
  dataKey="dateFormatted"
  stroke="#71717a"
  fontSize={12}
  tickLine={false}
  axisLine={false}
  minTickGap={30}
  tick={<XAxisTick />}
  interval="preserveStartEnd"
  padding={{ left: 12, right: 12 }}
/>
```

with `XAxisTick` reduced to:

```tsx
function XAxisTick(props: ChartTickProps): ReactElement {
  const { x, y, payload } = props;

  return (
    <text
      x={x ?? 0}
      y={(y ?? 0) + 14}
      fill="#71717a"
      fontSize={12}
      textAnchor="middle"
    >
      {payload?.value}
    </text>
  );
}
```

5. Integer y-axis ticks: compute from the converted domain and pass via `ticks` (keep the existing ±5 domain padding and the rounding `tickFormatter`):

```tsx
const minWeight = Math.min(...data.map((d) => d.weightConverted));
const maxWeight = Math.max(...data.map((d) => d.weightConverted));
const domainMin = Math.floor(minWeight - 5);
const domainMax = Math.ceil(maxWeight + 5);
const ticks = integerTicks(domainMin, domainMax);
```

```tsx
<YAxis
  domain={[domainMin, domainMax]}
  ticks={ticks}
  stroke="#71717a"
  fontSize={12}
  tickLine={false}
  axisLine={false}
  width={44}
  tickFormatter={(value) => Math.round(value).toString()}
  tick={<YAxisTick />}
  tickMargin={10}
/>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/components/weights/WeightChart.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the gates and manually verify geometry**

Run: `bun run typecheck && bun run test`
Expected: all PASS.

Manual (stated limitation, not test-covered): run `bun run dev`, open `/weights`, and confirm with several entries across months that (a) W/M/Q/Y pills render with Q between M and Y, (b) x-axis starts and ends with visually even padding, (c) y-axis labels are distinct integers with no clipped left edge, (d) the goal line still renders.

---

### Task 3: Stats page shell alignment + a11y pass

**Files:**
- Modify: `src/routes/stats.tsx` (page shell lines 38-58, section intro line 101-104, `WeeklyVolumeChart` bars lines 350-372)
- Test: `src/routes/stats.test.tsx` (create)

**Interfaces:**
- Consumes: existing `useWorkoutSummary`, `useExerciseStats` from `@/lib/api/hooks` — unchanged.
- Produces: no exports. The stats shell matches `weights.tsx` (`h-[35vh]` hero, `text-6xl` title, `overflow-x-clip`, `pb-24`, subtitle in the `px-1` slot); volume bars get accessible names. Task 4 edits later sections of this file and extends this test file.

- [ ] **Step 1: Write the failing test**

Create `src/routes/stats.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

    expect(screen.getByRole("heading", { level: 1, name: "Stats" })).toBeTruthy();
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
```

Note: `makeSummary` values are independent literals, not recomputed logic. Characterization pins: the first three tests assert behavior this task does not change and pass on today's code; the shell-geometry and volume-bar accessible-name tests are the red tests that drive the task.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/routes/stats.test.tsx`
Expected: FAIL — the shell-geometry test finds none of `.overflow-x-clip`, `.h-[35vh]`, or `text-6xl` on today's shell (`pb-20`, `h-[30vh]`, `text-5xl`), and the volume-bar test finds no `role="img"` bar because today's bars carry no accessible name. The first three tests are characterization pins: they pass pre-change (the retry banner already renders inside the `summary ?` branch and its handler already calls `refetchSummary`).

- [ ] **Step 3: Implement**

In `src/routes/stats.tsx`:

1. Page shell (lines 38-55): change `min-h-screen pb-20` to `min-h-screen pb-24 overflow-x-clip`, `h-[30vh]` to `h-[35vh]`, and `text-5xl` to `text-6xl` — exactly matching `weights.tsx:134-158`.
2. Move the intro line out of the data branch: render it directly under the shell, before the `{isError && ...}` conditional, using the weights pattern:

```tsx
<div className="relative px-4">
  <div className="mx-auto max-w-md space-y-6">
    <div className="px-1">
      <p className="text-sm text-zinc-400 font-medium">
        Your fitness journey at a glance
      </p>
    </div>

    {isError && !summary && exerciseStats.length === 0 ? (
```

and delete the old intro `<p>` inside the `summary ?` branch (lines 101-104).

3. `WeeklyVolumeChart` bars: add an accessible name to each bar (the tooltip is hover-only, so the value must be reachable without a pointer):

```tsx
<div
  key={i}
  className="flex-1 flex flex-col items-center gap-1"
  role="img"
  aria-label={`Week of ${formatWeek(week.weekStart)}: ${(week.totalVolume / 1000).toFixed(1)}K volume`}
>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/routes/stats.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the gates**

Run: `bun run typecheck && bun run test`
Expected: all PASS.

---

### Task 4: Personal records, body-part frequency, unit-aware stats cards

**Files:**
- Create: `src/lib/stats.ts`
- Test: `src/lib/stats.test.ts` (create; server/node project per `vitest.config.ts`)
- Modify: `src/routes/stats.tsx` (`ExerciseStatCard` lines 264-318 unit handling; new sections after "Exercise Records", lines 166-196; imports; `StatsPage` hook block lines 21-32)
- Test: `src/routes/stats.test.tsx` (append)

**Interfaces:**
- Consumes: `ExerciseStat`, `Workout` from `@/lib/types`; `useWorkouts`, `useCurrentProfile` from `@/lib/api/hooks`; `convertWeightFromLbs`, `formatWeight`, `formatWeightUnit` from `@/lib/units`.
- Produces:

```ts
export type PersonalRecord = {
  exerciseName: string;
  maxWeight: number;
  maxWeightReps: number;
  lastPerformedAt: string;
};

export function topPersonalRecords(
  stats: ExerciseStat[],
  limit?: number,
): PersonalRecord[];

export type BodyPartFrequency = {
  bodyPart: string;
  sessions: number;
};

export function bodyPartFrequency(
  workouts: Workout[],
  now: Date,
  weeks?: number,
): BodyPartFrequency[];
```

Behavior contract: `topPersonalRecords` orders by `maxWeight` desc (name asc as tiebreak), excludes exercises whose heaviest set carried no weight, returns at most `limit` (default 5); weights stay in stored lbs — the UI converts. `bodyPartFrequency` counts completed workouts only (`isActive !== true`) inside the trailing `weeks` window (default 8), tolerates `bodyPartWorkedOut === undefined`, and orders by count desc.

- [ ] **Step 1: Write the failing lib test**

Create `src/lib/stats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ExerciseStat, Workout } from "@/lib/types";
import { bodyPartFrequency, topPersonalRecords } from "./stats";

const NOW = new Date("2026-09-21T12:00:00.000Z");
const DAY = 86_400_000;

const stat = (overrides: Partial<ExerciseStat>): ExerciseStat => ({
  id: "Bench Press",
  exerciseName: "Bench Press",
  totalSets: 10,
  totalReps: 50,
  totalVolume: 5000,
  maxWeight: 225,
  maxWeightReps: 5,
  lastPerformedAt: "2026-09-20T10:00:00.000Z",
  weeklyHistory: [],
  ...overrides,
});

const workout = (overrides: Partial<Workout>): Workout => ({
  id: "workout-1",
  date: new Date(NOW.getTime() - 3 * DAY).toISOString(),
  duration: 3600,
  isActive: false,
  revision: 1,
  exercises: [],
  ...overrides,
});

describe("topPersonalRecords", () => {
  it("orders records by heaviest weight and caps the list", () => {
    const records = topPersonalRecords(
      [
        stat({ exerciseName: "Squat", id: "Squat", maxWeight: 315, maxWeightReps: 3 }),
        stat({ exerciseName: "Bench Press", maxWeight: 225, maxWeightReps: 5 }),
        stat({ exerciseName: "Row", id: "Row", maxWeight: 185, maxWeightReps: 8 }),
        stat({ exerciseName: "Curl", id: "Curl", maxWeight: 95, maxWeightReps: 10 }),
        stat({ exerciseName: "Press", id: "Press", maxWeight: 135, maxWeightReps: 6 }),
        stat({ exerciseName: "Lat Raise", id: "Lat Raise", maxWeight: 40, maxWeightReps: 12 }),
      ],
      5,
    );

    expect(records.map((r) => r.exerciseName)).toEqual([
      "Squat",
      "Bench Press",
      "Row",
      "Press",
      "Curl",
    ]);
  });

  it("skips exercises whose heaviest set carried no weight", () => {
    const records = topPersonalRecords([
      stat({ exerciseName: "Plank", id: "Plank", maxWeight: 0, maxWeightReps: 0 }),
      stat({ exerciseName: "Bench Press", maxWeight: 225, maxWeightReps: 5 }),
    ]);

    expect(records.map((r) => r.exerciseName)).toEqual(["Bench Press"]);
  });

  it("breaks weight ties by name", () => {
    const records = topPersonalRecords([
      stat({ exerciseName: "Incline Press", id: "Incline Press", maxWeight: 225, maxWeightReps: 5 }),
      stat({ exerciseName: "Bench Press", maxWeight: 225, maxWeightReps: 5 }),
    ]);

    expect(records.map((r) => r.exerciseName)).toEqual(["Bench Press", "Incline Press"]);
  });
});

describe("bodyPartFrequency", () => {
  it("counts completed workouts per body part inside the window", () => {
    const frequency = bodyPartFrequency(
      [
        workout({ bodyPartWorkedOut: ["chest", "triceps"] }),
        workout({ date: new Date(NOW.getTime() - 10 * DAY).toISOString(), bodyPartWorkedOut: ["chest"] }),
        workout({ date: new Date(NOW.getTime() - 70 * DAY).toISOString(), bodyPartWorkedOut: ["chest"] }),
      ],
      NOW,
    );

    expect(frequency).toEqual([
      { bodyPart: "chest", sessions: 2 },
      { bodyPart: "triceps", sessions: 1 },
    ]);
  });

  it("ignores workouts without body-part tags and active workouts", () => {
    const frequency = bodyPartFrequency(
      [
        workout({ bodyPartWorkedOut: undefined }),
        workout({ isActive: true, bodyPartWorkedOut: ["chest"] }),
        workout({ bodyPartWorkedOut: ["legs"] }),
      ],
      NOW,
    );

    expect(frequency).toEqual([{ bodyPart: "legs", sessions: 1 }]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/lib/stats.test.ts`
Expected: FAIL — `Failed to resolve import "./stats"` (module does not exist).

- [ ] **Step 3: Write the module**

Create `src/lib/stats.ts`:

```ts
import type { ExerciseStat, Workout } from "@/lib/types";

export type PersonalRecord = {
  exerciseName: string;
  maxWeight: number;
  maxWeightReps: number;
  lastPerformedAt: string;
};

export function topPersonalRecords(
  stats: ExerciseStat[],
  limit = 5,
): PersonalRecord[] {
  return [...stats]
    .filter((stat) => stat.maxWeight > 0)
    .sort(
      (a, b) =>
        b.maxWeight - a.maxWeight ||
        a.exerciseName.localeCompare(b.exerciseName),
    )
    .slice(0, limit)
    .map((stat) => ({
      exerciseName: stat.exerciseName,
      maxWeight: stat.maxWeight,
      maxWeightReps: stat.maxWeightReps,
      lastPerformedAt: stat.lastPerformedAt,
    }));
}

export type BodyPartFrequency = {
  bodyPart: string;
  sessions: number;
};

export function bodyPartFrequency(
  workouts: Workout[],
  now: Date,
  weeks = 8,
): BodyPartFrequency[] {
  const windowStart = now.getTime() - weeks * 7 * 86_400_000;
  const counts = new Map<string, number>();

  for (const workout of workouts) {
    if (workout.isActive === true) continue;
    const time = new Date(workout.date).getTime();
    if (time < windowStart || time > now.getTime()) continue;
    for (const bodyPart of workout.bodyPartWorkedOut ?? []) {
      counts.set(bodyPart, (counts.get(bodyPart) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([bodyPart, sessions]) => ({ bodyPart, sessions }))
    .sort(
      (a, b) =>
        b.sessions - a.sessions || a.bodyPart.localeCompare(b.bodyPart),
    );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/lib/stats.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the failing route tests**

Append to `src/routes/stats.test.tsx` — extend the hoisted mocks with `workouts`, `unit`, `refetchWorkouts`, add `useWorkouts` and `useCurrentProfile` to the `@/lib/api/hooks` mock, and add:

```ts
import type { Workout } from "@/lib/types";
```

to the imports (merging with the existing type import).

```tsx
const makeWorkout = (overrides: Partial<Workout>): Workout => ({
  id: "workout-1",
  date: new Date(Date.now() - 3 * 86_400_000).toISOString(),
  duration: 3600,
  isActive: false,
  revision: 1,
  exercises: [],
  ...overrides,
});

describe("records and frequency", () => {
  it("lists personal records converted to the display unit", () => {
    mocks.stats = [
      {
        id: "Bench Press",
        exerciseName: "Bench Press",
        totalSets: 10,
        totalReps: 50,
        totalVolume: 5000,
        maxWeight: 500,
        maxWeightReps: 5,
        lastPerformedAt: "2026-09-20T10:00:00.000Z",
        weeklyHistory: [],
      },
    ];
    mocks.unit = "kgs";
    renderStats();

    expect(screen.getByText("Personal Records")).toBeTruthy();
    expect(screen.getAllByText("Bench Press")).toHaveLength(2);
    expect(screen.getByText("226.8 kgs × 5")).toBeTruthy();
  });

  it("shows training frequency counts for the trailing window", () => {
    mocks.workouts = [
      makeWorkout({ bodyPartWorkedOut: ["chest"] }),
      makeWorkout({ id: "workout-2", bodyPartWorkedOut: ["chest"] }),
      makeWorkout({ id: "workout-3", bodyPartWorkedOut: ["legs"] }),
    ];
    renderStats();

    expect(screen.getByText("Training Frequency")).toBeTruthy();
    expect(screen.getByText(/Chest/)).toBeTruthy();
    expect(screen.getByText("2 sessions")).toBeTruthy();
    expect(screen.getByText("1 session")).toBeTruthy();
  });

  it("hides both sections when there is nothing to show", () => {
    mocks.stats = [];
    mocks.workouts = [];
    renderStats();

    expect(screen.queryByText("Personal Records")).toBeNull();
    expect(screen.queryByText("Training Frequency")).toBeNull();
  });
});
```

Worked example for the kgs conversion — exactly one conversion per value, because `formatWeight` converts from stored lbs internally (`src/lib/units.ts:25-28`), so callers must not pre-convert: `formatWeight(500, "kgs")` → 500 × 0.45359237 = 226.796185 → `toFixed(1)` = `"226.8"`; copy format is `{weight} {unit} × {reps}`. The same rule applies in `ExerciseStatCard` (`formatWeight(maxWeight, unit, 0)`, where 500 lbs → 226.796185 → `"227"`) and to `totalVolume` (`formatVolume(convertWeightFromLbs(totalVolume, unit))` — `formatVolume` itself never converts). An extra outer `convertWeightFromLbs` would double-convert: 226.796185 × 0.45359237 = 102.87… → `"102.9"` instead of `"226.8"`.

The record-name assertion uses `getAllByText` because "Bench Press" legitimately appears twice once the PR row is added (Exercise Records card and PR row); the unique `"226.8 kgs × 5"` string proves the PR row's converted copy.

Body-part copy: reuse `formatExerciseCategory` from `@/lib/exerciseCategories` — it already renders every stored tag (the `BODY_PARTS` ids in `src/lib/constants.ts:1-18` are `chest`, `back`, `legs`, `shoulders`, `arms`, `cardio`, `abs`, `full_body`) as display copy by replacing underscores with spaces and uppercasing word starts (`full_body` → `Full Body`). No local map is added; the earlier draft's `core`/`glutes`/`full body` keys were not stored ids.

- [ ] **Step 6: Run the test to verify it fails**

Run: `bun run test src/routes/stats.test.tsx`
Expected: FAIL — `Unable to find` "Personal Records" (the sections do not exist yet).

- [ ] **Step 7: Implement the route changes**

In `src/routes/stats.tsx`:

1. Imports: add `useWorkouts, useCurrentProfile` to the `@/lib/api/hooks` import; add `Trophy` is already imported (line 11); add:

```tsx
import { formatExerciseCategory } from "@/lib/exerciseCategories";
import { bodyPartFrequency, topPersonalRecords } from "@/lib/stats";
import { convertWeightFromLbs, formatWeight, formatWeightUnit } from "@/lib/units";
```

2. In `StatsPage`, add the hooks and derivations:

```tsx
const { workouts } = useWorkouts();
const { profile } = useCurrentProfile();
const unit = profile?.weightUnit ?? "lbs";

const records = topPersonalRecords(exerciseStats);
const frequency = bodyPartFrequency(workouts, new Date());
```

3. Fix `ExerciseStatCard` unit handling: pass `unit` as a prop from the map call (line 177-186), and inside the card convert once for display — replace `Max lbs` with `Max {formatWeightUnit(unit)}` and `maxWeight` with `{formatWeight(maxWeight, unit, 0)}` (stored lbs in, display unit out — no outer `convertWeightFromLbs`), and render `totalVolume` as `{formatVolume(convertWeightFromLbs(totalVolume, unit))}`. Keep the existing `formatVolume` helper unchanged; it never converts, it only abbreviates.
4. After the "Exercise Records" section (line 196), add the two new sections, each rendered only when non-empty:

```tsx
{records.length > 0 ? (
  <div className="pt-4">
    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
      <Trophy className="w-5 h-5 text-orange-500" />
      Personal Records
    </h2>
    <div className="space-y-3">
      {records.map((record) => (
        <div
          key={record.exerciseName}
          className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-between gap-3"
        >
          <span className="font-bold text-white truncate">{record.exerciseName}</span>
          <span className="text-sm font-semibold text-orange-400 whitespace-nowrap">
            {formatWeight(record.maxWeight, unit)} {formatWeightUnit(unit)} × {record.maxWeightReps}
          </span>
        </div>
      ))}
    </div>
  </div>
) : null}

{frequency.length > 0 ? (
  <div className="pt-4">
    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
      <Calendar className="w-5 h-5 text-orange-500" />
      Training Frequency
    </h2>
    <div className="space-y-3">
      {frequency.map((entry) => (
        <div
          key={entry.bodyPart}
          className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-between gap-3"
        >
          <span className="font-bold text-white">{formatExerciseCategory(entry.bodyPart)}</span>
          <span className="text-sm text-zinc-400 whitespace-nowrap">
            {formatCountLabel(entry.sessions, "session")}
          </span>
        </div>
      ))}
    </div>
  </div>
) : null}
```

`formatCountLabel` comes from `@/lib/utils` (already used elsewhere; produces "2 sessions" / "1 session"). `formatExerciseCategory` from `@/lib/exerciseCategories` renders the stored body-part tag as copy (`full_body` → `Full Body`); no local helper is added.

- [ ] **Step 8: Run the tests and the gates**

Run: `bun run test src/lib/stats.test.ts src/routes/stats.test.tsx && bun run typecheck && bun run test`
Expected: all PASS.

---

## Post-completion checklist for the orchestrator

- All four tasks green: `bun run typecheck && bun run test`.
- Manual chart-geometry verification from Task 2 Step 5 performed and noted.
- Roadmap update (separate commit, orchestrator's call): Lane 3 items move to `[done]`; the two `[verify]` items move to Explicit deferrals with the reasons stated above.
