# Port Nyx Fitness Feature Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port three missing features from the sibling nyx-fitness SPA into nyx-fit — the notification management suite, custom free-text exercises, and the offline app shell — plus one minor item (app version display), as nine independently shippable TDD tasks.

**Architecture:** All notification permission/display logic is centralized in one new deep module (`src/lib/notifications.ts`) with two consumers (Settings page, onboarding ready screen) and one service-worker handler added to the post-build SW generator. Custom exercises are a pure client-side UI extension of `AddExerciseDrawer` (the D1 schema and parsers already accept arbitrary names). The offline shell is a runtime network-first cache scoped to the exact root URL, generated in `scripts/generate-sw.mjs`'s shared config module, with the root auth loader made failure-tolerant so the cached shell hydrates offline.

**Tech Stack:** React 19 + TypeScript strict, TanStack Start (SSR on Cloudflare Workers via `@cloudflare/vite-plugin`), TanStack server functions + D1/Kysely store, better-auth session, Tailwind v4 + framer-motion + radix Switch, workbox-build 7.4.0 (SW generated post-build by `scripts/generate-sw.mjs`), vitest two-project setup (ui/jsdom + server/node), Bun for all commands.

**Spec:** `docs/superpowers/specs/2026-03-17-nyx-fit-roadmap-design.md` (Lane 1 "settings as control hub", Lane 2 "core logging speed", Lane 6 "PWA/service-worker quality"). This plan is the spec of record for the ported gaps; behavior evidence is the reference implementation in the sibling repo `nyx-fitness` (React Router 7 + Dexie): `app/lib/notifications.ts`, `app/routes/settings.tsx`, `app/components/onboarding.tsx`, `public/sw-notifications.js`, `public/sw.js`, `app/components/add-exercise-drawer.tsx`, `app/components/exercise-item.tsx`. Port the behavior, not the code style — nyx-fit's conventions and architecture win wherever they differ.

## Source evidence (nyx-fitness behavior to replicate)

1. **Notification suite** — permission helpers with an iOS-Safari-outside-PWA fallback (`requestNotificationPermission` catches the browser rejecting the promise and falls back to reading `Notification.permission`); a Settings toggle whose description explains unsupported/denied/granted states and live-tracks permission changes via `visibilitychange`/`focus` listeners; persisted `notificationsEnabled` preference; "Send Test Notification" action; onboarding "Reminders" toggle on the final step that requests permission before persisting and shows an inline error otherwise; a `notificationclick` SW handler that closes the notification, focuses an existing window, optionally navigates it via `data.url`, or opens one window only when none exists.
2. **Custom exercises** — free-text exercise name (nyx-fitness also has free-text categories rendered as hashtags; see Deviations), preset quick-pick retained, per-exercise cards show set count and total volume (weight x reps).
3. **Offline shell** — cached `/` served when a navigation fails offline (`navigateFallback`-style behavior).

## Deviations from the source app (deliberate, stated)

- **No DB migration.** The mission hypothesized custom exercises might need a schema change. They do not: `workouts.exercises` is a JSON text blob (migration `0002_app.sql:24`), the row decoder already accepts any string `name` plus an optional string `category` (`src/lib/api/store.server.ts:122-136`, "parse, don't validate"), and the input parser already accepts arbitrary names up to 120 chars and optional categories up to 60 chars (`src/lib/api/parsers.ts:209-224`). Custom exercises are client-side only.
- **Free-text categories are NOT ported.** nyx-fit already has a fixed 8-category enum with keyword inference plus a manual override select (`src/lib/exerciseCategories.ts`, `AddExerciseDrawer.tsx:186-208`). Adding free-text categories would bypass the enum, weaken the category chip (`ExerciseItem` renders it via `formatExerciseCategory`), and duplicate what the override select already delivers. Keep the 8-category enum; the nyx-fitness hashtag display maps to nyx-fit's existing category chip.
- **No workbox `navigateFallback`.** nyx-fit is SSR: `dist/client` contains no `index.html`, so `navigateFallback` (which requires a precached fallback URL) is unusable, and serving the cached `/` HTML at other paths would hydrate mismatched route HTML (React hydration failure at e.g. `/stats`). Instead: a runtime NetworkFirst cache for the exact origin-root URL only (Task 8), so a cached document is only ever served where its route matches. Cross-route offline navigations keep failing (browser offline error), as today — the OfflineBanner already explains this.
- **Volume display is unit-aware.** nyx-fitness hardcodes "lbs total"; nyx-fit stores weights in lbs but converts for display, so the card converts the volume to the user's unit.
- **The profile-form checkbox is wired to real permission.** nyx-fit already persists `notificationsEnabled` from a naive checkbox in `src/routes/settings_.profile.tsx:409-424` (no OS permission request — a fake toggle). Task 4 routes that checkbox through the shared permission helpers so the preference can never be "on" without granted permission.
- **RestTimer keeps its opportunistic permission request** (source parity), but display is centralized in `showSystemNotification` (Task 3), which also removes today's unhandled rejection when a rest-timer notification fires without granted permission (`RestTimer.tsx:47-54` has no permission check and no catch).
- **Desktop `new Notification(...)` fallback gets no click-to-focus handler** (nyx-fitness sets `notification.onclick` there). Focus/navigate behavior is centralized in the SW `notificationclick` handler (Task 6), which covers the PWA and mobile paths where notifications actually matter; the desktop constructor fallback is a last resort and stays minimal.

## Explicit deferrals (stated, not silently dropped)

- **Export/Import data:** deferred. nyx-fitness only stubs both behind "coming soon" alerts; porting a stub is pure YAGNI. Revisit when a real export format exists.
- **3-month weight-chart range:** deferred. `src/components/weights/WeightChart.tsx:23-29` uses recharts `ResponsiveContainer`, which jsdom cannot measure (no ResizeObserver); there is no honest test seam without building DOM-measurement stubs that test nothing meaningful. Chart polish belongs to roadmap Lane 3 ("Progress pages polish and pagination"), which owns this surface. A future task there adds `"quarter"` to `TimeRange`/`RANGE_CONFIG` with proper chart-level verification.

## Task dependency map (tracer bullets, ordered by value)

Tasks are vertical slices; each ends green (`bun run typecheck` + tests) and is independently shippable.

| # | Task | Value lane | Blocked by |
|---|------|-----------|------------|
| 1 | Custom exercise name entry in AddExerciseDrawer | Core logging | None |
| 2 | Total volume on per-exercise cards | Core logging | None |
| 3 | Shared notification helpers + RestTimer refactor | Notification suite (foundation) | None |
| 4 | Settings notifications toggle + test action | Notification suite | Task 3 |
| 5 | Onboarding Reminders opt-in | Notification suite | Task 3 |
| 6 | `notificationclick` handler in the service worker | Notification suite | None |
| 7 | Offline-resilient root auth loader | Offline shell | None |
| 8 | Offline app shell for the root URL | Offline shell | Task 6 |
| 9 | App version in Settings About | Minor | None |

## Global Constraints

- All commands run with Bun: `bun run typecheck`, `bun run test`, `bun run build` (`vite build && bun scripts/generate-sw.mjs`, `package.json:7`).
- Versions: `wrangler` 4.132.0 (pinned), `better-auth` 1.3.27 (pinned), `kysely` 0.28.8, `vite` ^7.1.7, `react` ^19.2.0, `vitest` ^3.0.5, `workbox-build` 7.4.0 (already resolvable; do NOT add it to package.json without user approval — it is currently a transitive dependency used by the build script).
- No new dependencies, no new lint config. The only quality gates are `bun run typecheck` and `bun run test`.
- Parse, don't validate: hand-written type guards for external/untrusted input; no bare casts. (One exception appears in Task 7's test: `Parameters<typeof loader>[0]` is an exact-type cast, not a blind cast.)
- TypeScript strict: no `any` in new code, named exports only, `type` aliases over `interface`, string-literal unions over enums, exhaustive switches with `satisfies never`. Do not reformat untouched code (several existing files use `any` in old props, e.g. `SettingsItem`'s `icon`; leave those).
- SSR awareness: guard every `window`/`Notification`/`navigator.serviceWorker` access with `typeof` checks; nothing may touch them at module top level or during server render.
- API mutations require a better-auth session (server functions go through `withUserMutationContext`). `useUpsertCurrentProfile` takes no arguments and its mutation takes `{ updates }` — persist `notificationsEnabled` through it.
- Dark-first design, WCAG AA contrast, >= 44px touch targets, reduced motion respected. Reuse existing Tailwind recipes from the file being edited.
- `src/routeTree.gen.ts` is auto-generated — never hand-edit it.
- Match each file's existing indentation (two spaces in the files touched here); never commit generated `dist/` or `dev-dist/` artifacts.
- Tests live only at the pre-agreed seams: ui/jsdom project for components and routes (`src/**/*.test.{ts,tsx}`, excluding `src/lib`), server/node project for `src/lib/**` (including the SW generator config). `bun run test <path>` runs one file.

## Review Focus

Five input classes / failure modes no task's happy path exercises. Each is pinned to an owning task's test.

1. **Notification permission denied on iOS Safari outside an installed PWA** — the browser rejects `Notification.requestPermission()` instead of resolving; expected: the helper falls back to reading the stored permission and the UI explains the denied state without persisting an opt-in. Pinned by Task 3, test "falls back to reading the stored permission when the request rejects..."; Task 4, test "explains denied permission and does not persist the preference"; Task 5, test "shows an error and skips persistence when permission is denied".
2. **Custom exercise name collides with a preset name** — expected: it is the same exercise; the workout route groups sets under one card by name (existing `handleAddSet` behavior at `src/routes/workout.$id.tsx:130-148`). Pinned by Task 1, route-level test "merges a custom exercise into an existing card when the name matches".
3. **Offline cold start/reload while the SSR shell needs an auth session** — expected: the root auth loader resolves to a signed-out context instead of throwing, so the cached `/` shell hydrates; auth state converges client-side once a connection returns. Pinned by Task 7, test "resolves to a signed-out context when auth cannot be reached offline"; the URL scoping (root only) is pinned by Task 8, test "matches only the bare origin root URL".
4. **Very long exercise names** — expected: the client input caps at 120 chars and the server parser rejects anything longer (existing guard at `src/lib/api/parsers.ts:220`). Pinned by Task 1, parser test "rejects exercise names longer than 120 characters".
5. **Duplicate rapid toggles** — double-tap on the notifications toggle or the reminders toggle while a permission request/persist is in flight must not double-request or double-persist. Pinned by Task 4, test "ignores a second toggle while a permission request is pending"; Task 5, test "ignores a second toggle while a request is pending".

---

### Task 1: Custom exercise name entry in AddExerciseDrawer

**Files:**
- Modify: `src/components/AddExerciseDrawer.tsx` (state block ~lines 55-61, picker view ~lines 164-216, `resetState` ~lines 86-93)
- Test: `src/components/AddExerciseDrawer.test.tsx` (create)
- Test: `src/routes/-workout.$id.test.tsx` (append one route-level test)
- Test: `src/lib/api/parsers.test.ts` (append one server-contract pin)

**Interfaces:**
- Consumes: existing `AddExerciseDrawer` props — unchanged, especially `onAddSet(exerciseName: string, category: ExerciseCategory, weight: number, reps: number): Promise<boolean>`; existing `inferExerciseCategory(name: string): ExerciseCategory`, `EXERCISE_CATEGORIES`, `formatExerciseCategory` from `@/lib/exerciseCategories`.
- Produces: the drawer now accepts arbitrary exercise names. The public signature does NOT change — the route's `handleAddSet` already stores any name (dedupe by name), so no caller changes. Later tasks rely on nothing from this task.

- [ ] **Step 1: Write the failing test**

Create `src/components/AddExerciseDrawer.test.tsx`:

```tsx
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
```

Notes: 45 is the default weight (`weightOptions[8]` with the lbs step of 5) and 8 the default reps, passed through `convertWeightToLbs(parseFloat("45"), "lbs")` and `parseInt("8")` — independent literals, not recomputed logic. "Chest Supported Row" infers `chest` because `CATEGORY_KEYWORDS.chest` is checked before `back` (whose `row` keyword would otherwise win) — that ordering is observable product behavior worth pinning.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/components/AddExerciseDrawer.test.tsx`
Expected: FAIL — `TestingLibraryElementError: Found multiple elements` is NOT expected; the failure is `Unable to find an accessible element with the role "button" and name "Type a custom exercise"` (the drawer has no custom-name path today).

- [ ] **Step 3: Implement the custom-name mode**

In `src/components/AddExerciseDrawer.tsx`:

1. Extend the state block:

```tsx
const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
const [pickerExercise, setPickerExercise] = useState(COMMON_EXERCISES[0]);
const [category, setCategory] = useState<ExerciseCategory>(inferExerciseCategory(COMMON_EXERCISES[0]));
const [customName, setCustomName] = useState("");
const [isCustomMode, setIsCustomMode] = useState(false);
```

2. Add the candidate next to `currentExerciseSetCount`:

```tsx
const candidateExercise = isCustomMode ? customName.trim() : pickerExercise;
```

3. In the picker view (`!selectedExercise` branch), replace the wheel block and the primary button so the text field swaps in for the wheel:

```tsx
{isCustomMode ? (
  <input
    type="text"
    value={customName}
    maxLength={120}
    placeholder="e.g. Chest Supported Row"
    aria-label="Custom exercise name"
    onChange={(e) => {
      setCustomName(e.target.value);
      setCategory(inferExerciseCategory(e.target.value));
    }}
    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-4 text-lg text-white outline-none transition focus:border-purple-400"
  />
) : (
  <div className="relative h-48 w-full overflow-hidden">
    <WheelPicker
      options={COMMON_EXERCISES.map((ex) => ({
        value: ex,
        label: ex,
      }))}
      value={pickerExercise}
      onValueChange={(val) => {
        setPickerExercise(val);
        setCategory(inferExerciseCategory(val));
      }}
    />
    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-zinc-900 via-transparent to-zinc-900" />
  </div>
)}

<button
  type="button"
  onClick={() => {
    if (isCustomMode) {
      setCategory(inferExerciseCategory(pickerExercise));
    } else {
      setCategory(inferExerciseCategory(""));
    }
    setCustomName("");
    setIsCustomMode((open) => !open);
  }}
  className="min-h-11 text-sm font-semibold text-purple-300 transition-colors hover:text-purple-200"
>
  {isCustomMode ? "Pick from the list instead" : "Type a custom exercise"}
</button>
```

4. Replace the primary button:

```tsx
<motion.button
  onClick={() => {
    const name = isCustomMode ? customName.trim() : pickerExercise;
    if (!name) return;
    setSelectedExercise(name);
  }}
  disabled={!candidateExercise}
  className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-4 font-bold text-lg transition-colors shadow-lg shadow-purple-900/20 disabled:opacity-50"
>
  {candidateExercise ? `Select ${candidateExercise}` : "Select an exercise"}
</motion.button>
```

5. Extend `resetState` (keeps the exit animation reset complete):

```tsx
const resetState = () => {
  setSelectedExercise(null);
  setPickerExercise(COMMON_EXERCISES[0]);
  setCategory(inferExerciseCategory(COMMON_EXERCISES[0]));
  setCustomName("");
  setIsCustomMode(false);
  setWeight(weightOptions[8].toString());
  setReps("8");
  setCommitFailed(false);
};
```

The `maxLength={120}` mirrors the server parser cap (`readString(value.name, "Exercise name", 120)` in `src/lib/api/parsers.ts:220`), so the drawer can never produce a payload the server rejects for length.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/components/AddExerciseDrawer.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Pin the server contract and the route-level merge behavior**

Append to `src/lib/api/parsers.test.ts` (inside a new `describe("exercise name limits", ...)` or the existing workout-parsing describe):

```ts
it("rejects exercise names longer than 120 characters", () => {
  const longName = "x".repeat(121);
  expect(() =>
    parseUpdateWorkoutInput({
      id: WORKOUT_ID,
      revision: 1,
      updates: { exercises: [{ id: "ex-1", name: longName, sets: [] }] },
    }),
  ).toThrow();
  expect(() =>
    parseUpdateWorkoutInput({
      id: WORKOUT_ID,
      revision: 1,
      updates: { exercises: [{ id: "ex-1", name: "x".repeat(120), sets: [] }] },
    }),
  ).not.toThrow();
});
```

This pin guards existing server behavior (expected to pass immediately — it is the contract the new UI relies on, and it fails loudly if anyone tightens the parser to preset names only).

Append to `src/routes/-workout.$id.test.tsx` inside `describe("workout route saves", ...)`:

```ts
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
```

Expected behavior pinned: a custom name identical to a preset name is the same exercise — one card, sets merged (existing dedupe in `handleAddSet`), never a duplicate card.

- [ ] **Step 6: Run the affected tests and the full gates**

Run: `bun run test src/lib/api/parsers.test.ts src/routes/-workout.$id.test.tsx && bun run typecheck && bun run test`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/AddExerciseDrawer.tsx src/components/AddExerciseDrawer.test.tsx src/routes/-workout.$id.test.tsx src/lib/api/parsers.test.ts
git commit -m "feat: allow custom free-text exercises in the add-exercise drawer"
```

Implementation note for Step 4: `@ncdai/react-wheel-picker` is scroll-snap based and is expected to mount in jsdom (its engine needs no layout measurement). If it does throw in jsdom, mock ONLY the wrapper at the seam in `src/components/AddExerciseDrawer.test.tsx` with the stated reason (third-party layout engine needs real layout), never mock the drawer itself:

```tsx
vi.mock("./wheel-picker", () => ({
  WheelPicker: ({
    options,
    value,
  }: {
    options: { value: string; label: string }[];
    value: string;
  }) => (
    <div data-testid="wheel-picker">
      {options.find((option) => option.value === value)?.label ?? value}
    </div>
  ),
}));
```

---

### Task 2: Total volume on per-exercise cards

**Files:**
- Modify: `src/components/ExerciseItem.tsx` (meta row, lines 23-32)
- Test: `src/components/ExerciseItem.test.tsx` (create)

**Interfaces:**
- Consumes: existing `ExerciseItem` props (`exercise: Exercise`, `unit: WeightUnit`, `onClick`); `formatWeight(weight: number, unit: WeightUnit, decimals?: number): string`, `convertWeightFromLbs(weight: number, unit: WeightUnit): number`, `formatWeightUnit(unit: WeightUnit): string` from `@/lib/units`; `formatCountLabel(count: number, singular: string): string` from `@/lib/utils`.
- Produces: the card meta line reads e.g. "1 Set • 800 lbs total". Purely presentational; no interface change. Stored weights are lbs (the drawer converts on save), so displayed volume is converted with `convertWeightFromLbs`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ExerciseItem.test.tsx`:

```tsx
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
```

(227: 500 stored lbs x 0.45359237 = 226.796... -> `toFixed(0)` = "227"; 800 lbs -> 362.87 -> "363" in the kgs-of-800 case. The expected values are worked examples, independent of the implementation.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/components/ExerciseItem.test.tsx`
Expected: FAIL — first test cannot find "2 Sets • 800 lbs total" (the component renders only "2 Sets").

- [ ] **Step 3: Implement**

In `src/components/ExerciseItem.tsx` add to the imports from `@/lib/units`:

```tsx
import { convertWeightFromLbs, formatWeight, formatWeightUnit } from "@/lib/units";
```

(replacing the existing `formatWeight, formatWeightUnit` import line at line 5)

Compute and render:

```tsx
const totalVolume = exercise.sets.reduce(
  (sum, set) => sum + set.weight * set.reps,
  0
);
```

and inside the meta row `<p>` (line 29-31) append the volume:

```tsx
<p className="text-gray-400 text-sm">
  {formatCountLabel(exercise.sets.length, "Set")}
  {totalVolume > 0
    ? ` • ${formatWeight(convertWeightFromLbs(totalVolume, unit), unit, 0)} ${formatWeightUnit(unit)} total`
    : null}
</p>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/components/ExerciseItem.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the gates and commit**

Run: `bun run typecheck && bun run test`
Expected: all PASS.

```bash
git add src/components/ExerciseItem.tsx src/components/ExerciseItem.test.tsx
git commit -m "feat: show total volume on per-exercise cards"
```

---

### Task 3: Shared notification helpers + RestTimer refactor

**Files:**
- Create: `src/lib/notifications.ts`
- Test: `src/lib/notifications.test.ts` (create; server/node project per `vitest.config.ts`)
- Modify: `src/components/RestTimer.tsx` (lines 1-57 imports and `handleTimerComplete`; line 140-141 opportunistic permission request)

**Interfaces:**
- Consumes: browser platform APIs only (`Notification`, `navigator.serviceWorker`) — stubbed at the system boundary in tests, never mocked module-internals.
- Produces (all later notification tasks consume exactly these):

```ts
export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export function isNotificationSupported(): boolean;
export function getNotificationPermission(): NotificationPermissionState;
export function requestNotificationPermission(): Promise<NotificationPermissionState>;
export type SystemNotificationOptions = {
  body?: string;
  tag?: string;
  data?: Record<string, unknown>;
};
export function showSystemNotification(
  title: string,
  options?: SystemNotificationOptions,
): Promise<boolean>;
```

Behavior contract: everything is SSR-safe (returns `unsupported`/`false` without throwing when `window`/`Notification` are missing); `showSystemNotification` returns `false` when permission is not `granted` (never constructs and never calls the SW); display prefers the active service-worker registration (required on mobile/PWA, works from the background) and falls back to `new Notification(...)` on desktop; icon/badge default to `/favicon.ico` (the RestTimer precedent, line 42-43); default vibrate pattern `[500, 200, 500]` (RestTimer precedent, line 44). Click-to-focus is intentionally NOT set on the constructor fallback — focus/navigate is the SW `notificationclick` handler's job (Task 6).

- [ ] **Step 1: Write the failing test**

Create `src/lib/notifications.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  showSystemNotification,
} from "./notifications";

type PermissionResult = "granted" | "denied" | "default";

type FakeRegistration = {
  active: unknown;
  showNotification: (title: string, options?: unknown) => Promise<void>;
};

const state = {
  permission: "default" as PermissionResult,
  requestResult: "granted" as PermissionResult,
  requestError: false,
  registration: null as FakeRegistration | null,
  constructed: [] as { title: string; options: unknown }[],
};

function installNotificationApi(): void {
  const FakeNotification = Object.assign(
    function (this: unknown, title: string, options?: unknown) {
      state.constructed.push({ title, options });
    },
    {
      requestPermission: async (): Promise<PermissionResult> => {
        if (state.requestError) {
          throw new Error("NotAllowedError");
        }
        return state.requestResult;
      },
    },
  );
  Object.defineProperty(FakeNotification, "permission", {
    get: () => state.permission,
  });
  vi.stubGlobal("Notification", FakeNotification);
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    serviceWorker: {
      getRegistration: async () => state.registration,
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  state.permission = "default";
  state.requestResult = "granted";
  state.requestError = false;
  state.registration = null;
  state.constructed = [];
});

describe("notification permission helpers", () => {
  it("reports unsupported when the Notification API is missing", () => {
    expect(isNotificationSupported()).toBe(false);
    expect(getNotificationPermission()).toBe("unsupported");
  });

  it("requests permission and maps the resolved browser value", async () => {
    installNotificationApi();
    state.requestResult = "granted";
    await expect(requestNotificationPermission()).resolves.toBe("granted");

    state.requestResult = "denied";
    await expect(requestNotificationPermission()).resolves.toBe("denied");
  });

  it("falls back to the stored permission when the request rejects, as iOS Safari does outside an installed PWA", async () => {
    installNotificationApi();
    state.requestError = true;
    state.permission = "denied";
    await expect(requestNotificationPermission()).resolves.toBe("denied");
  });
});

describe("showSystemNotification", () => {
  it("shows through the service worker when one is active", async () => {
    installNotificationApi();
    state.permission = "granted";
    const showNotification = vi.fn<(title: string, options?: unknown) => Promise<void>>(async () => {});
    state.registration = { active: {}, showNotification };

    const shown = await showSystemNotification("Rest over!", {
      body: "Time for your next set!",
    });

    expect(shown).toBe(true);
    expect(showNotification).toHaveBeenCalledWith(
      "Rest over!",
      expect.objectContaining({
        body: "Time for your next set!",
        icon: "/favicon.ico",
      }),
    );
    expect(state.constructed).toEqual([]);
  });

  it("returns false without constructing anything when permission is not granted", async () => {
    installNotificationApi();
    state.permission = "default";

    const shown = await showSystemNotification("Rest over!");

    expect(shown).toBe(false);
    expect(state.constructed).toEqual([]);
  });

  it("falls back to the Notification constructor when no service worker is active", async () => {
    installNotificationApi();
    state.permission = "granted";
    state.registration = null;

    const shown = await showSystemNotification("Rest over!", {
      body: "Time for your next set!",
    });

    expect(shown).toBe(true);
    expect(state.constructed[0]?.title).toBe("Rest over!");
    expect(state.constructed[0]?.options).toEqual(
      expect.objectContaining({
        body: "Time for your next set!",
        badge: "/favicon.ico",
      }),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/lib/notifications.test.ts`
Expected: FAIL — `Failed to resolve import "./notifications"` (module does not exist).

- [ ] **Step 3: Write the module**

Create `src/lib/notifications.ts`:

```ts
export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return "unsupported";
  try {
    const result = await Notification.requestPermission();
    return result === "granted" || result === "denied" || result === "default"
      ? result
      : getNotificationPermission();
  } catch {
    return getNotificationPermission();
  }
}

export type SystemNotificationOptions = {
  body?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

const DEFAULT_NOTIFICATION_ICON = "/favicon.ico";

export async function showSystemNotification(
  title: string,
  options: SystemNotificationOptions = {},
): Promise<boolean> {
  if (getNotificationPermission() !== "granted") return false;

  const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
    icon: DEFAULT_NOTIFICATION_ICON,
    badge: DEFAULT_NOTIFICATION_ICON,
    vibrate: [500, 200, 500],
    ...options,
  };

  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.active) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    } catch (error) {
      console.warn("[notifications] service worker notification failed", error);
    }
  }

  try {
    new Notification(title, notificationOptions);
    return true;
  } catch (error) {
    console.warn("[notifications] failed to show notification", error);
    return false;
  }
}
```

Note: `NotificationOptions & { vibrate?: number[] }` because lib.dom's `NotificationOptions` does not reliably include `vibrate`; the intersection is assignable to both `registration.showNotification` and the `Notification` constructor. `vibrate` is not part of the public `SystemNotificationOptions` — callers cannot override the pattern (RestTimer also vibrates via `navigator.vibrate`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/lib/notifications.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Refactor RestTimer onto the module (behavior-preserving, plus the permission guard fix)**

In `src/components/RestTimer.tsx`:

1. Add the import:

```tsx
import {
  getNotificationPermission,
  requestNotificationPermission,
  showSystemNotification,
} from "@/lib/notifications";
```

2. Replace the notification block in `handleTimerComplete` (lines 39-54) — everything from `const title = "Rest over!";` through the `else if (Notification.permission === "granted") { ... }` branch — with:

```tsx
void showSystemNotification("Rest over!", {
  body: "Time for your next set!",
});
```

3. Replace the opportunistic request in `toggleTimer` (lines 140-142):

```tsx
if (!isActive && getNotificationPermission() === "default") {
  void requestNotificationPermission();
}
```

This fixes two latent defects: notifications were shown without checking permission (unhandled `NotAllowedError` rejection via `navigator.serviceWorker.ready.then(...)` with no catch), and the raw `Notification.permission` access would throw during any SSR path. Behavior is otherwise identical (same title/body/icon/vibrate).

- [ ] **Step 6: Run the gates and commit**

Run: `bun run typecheck && bun run test`
Expected: all PASS (RestTimer has no tests; its refactor is verified by the module tests plus the Task 4/5 UI tests that exercise the same helpers, and by manual verification of a rest timer in `bun run dev`).

```bash
git add src/lib/notifications.ts src/lib/notifications.test.ts src/components/RestTimer.tsx
git commit -m "feat: centralize system notification helpers and guard rest-timer notifications"
```

---

### Task 4: Settings notifications toggle and test action

**Files:**
- Modify: `src/routes/settings.tsx` (dead row at line 208; `SettingsItem` at lines 109-152; imports; `SettingsPage` state block)
- Modify: `src/routes/settings_.profile.tsx` (checkbox at lines 409-424)
- Test: `src/routes/settings.test.tsx` (create)

**Interfaces:**
- Consumes: `isNotificationSupported`, `getNotificationPermission`, `requestNotificationPermission`, `showSystemNotification`, `type NotificationPermissionState` from `@/lib/notifications` (Task 3); `useUpsertCurrentProfile()` (no arguments, returns `{ upsertCurrentProfile }`; the mutation takes `{ updates }`) from `@/lib/api/hooks`; `useToast()` from `@/lib/toast` (provides `error`); `Switch` from `@/components/ui/switch` (radix: `checked`, `onCheckedChange`, `disabled`); `Profile.notificationsEnabled` (already in schema, parsers, and store).
- Produces: no exports. The Settings row shows live permission state and persists the preference; the profile-form checkbox behaves identically. Blocking consumer: none (Task 5 implements the same contract in onboarding independently).

- [ ] **Step 1: Write the failing test**

Create `src/routes/settings.test.tsx`:

```tsx
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationPermissionState } from "@/lib/notifications";
import { Route } from "./settings";

const mocks = vi.hoisted(() => ({
  session: { session: { id: "session-1" } } as
    | { session: { id: string } }
    | null,
  profile: null as { notificationsEnabled: boolean } | null,
  upsert: vi.fn(),
  showError: vi.fn(),
  requestPermission: vi.fn<() => Promise<NotificationPermissionState>>(),
  permission: "default" as NotificationPermissionState,
  constructed: [] as { title: string; options: unknown }[],
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ data: mocks.session, isPending: false }),
  },
}));

vi.mock("@/lib/api/hooks", () => ({
  useCurrentProfile: () => ({
    profile: mocks.profile,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpsertCurrentProfile: () => ({
    upsertCurrentProfile: mocks.upsert,
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

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...original,
    createFileRoute: () => (options: unknown) => ({ options }),
    useNavigate: () => vi.fn(),
  };
});

function stubNotificationApi(): void {
  const FakeNotification = Object.assign(
    function (this: unknown, title: string, options?: unknown) {
      mocks.constructed.push({ title, options });
    },
    {
      requestPermission: mocks.requestPermission,
    },
  );
  Object.defineProperty(FakeNotification, "permission", {
    get: () => mocks.permission,
  });
  vi.stubGlobal("Notification", FakeNotification);
  vi.stubGlobal("navigator", {
    ...window.navigator,
    serviceWorker: { getRegistration: async () => null },
  });
}

function renderSettings() {
  const Component = Route.options.component;
  if (typeof Component !== "function") {
    throw new Error("Settings route component is unavailable");
  }
  return render(<Component />);
}

beforeEach(() => {
  mocks.session = { session: { id: "session-1" } };
  mocks.profile = { notificationsEnabled: false };
  mocks.permission = "default";
  mocks.constructed = [];
  mocks.upsert.mockReset();
  mocks.showError.mockReset();
  mocks.requestPermission.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("notifications settings", () => {
  it("requests permission and saves the preference when enabling notifications", async () => {
    stubNotificationApi();
    mocks.requestPermission.mockResolvedValue("granted");
    renderSettings();

    expect(
      screen.getByText("Off — tap to allow system notifications"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith({
        updates: { notificationsEnabled: true },
      }),
    );
    expect(mocks.requestPermission).toHaveBeenCalledTimes(1);
  });

  it("explains denied permission and does not persist the preference", async () => {
    stubNotificationApi();
    mocks.requestPermission.mockResolvedValue("denied");
    renderSettings();

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Blocked — allow notifications in your device settings",
        ),
      ).toBeTruthy(),
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.showError).toHaveBeenCalledWith(
      "Notifications are blocked. Allow them in your device settings, then try again.",
    );
  });

  it("turns notifications off without touching permission", async () => {
    stubNotificationApi();
    mocks.profile = { notificationsEnabled: true };
    mocks.permission = "granted";
    mocks.upsert.mockResolvedValue({
      id: "profile-1",
      name: "User",
      email: "user@example.com",
      notificationsEnabled: false,
      weightUnit: "lbs",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    renderSettings();

    expect(
      screen.getByText("On — rest timer alerts appear on your device"),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith({
        updates: { notificationsEnabled: false },
      }),
    );
    expect(mocks.requestPermission).not.toHaveBeenCalled();
  });

  it("shows the unsupported description when the Notification API is missing", () => {
    renderSettings();

    expect(
      screen.getByText("Not supported on this browser"),
    ).toBeTruthy();
  });

  it("ignores a second toggle while a permission request is pending", async () => {
    stubNotificationApi();
    let resolveRequest: (value: NotificationPermissionState) => void = () => {};
    mocks.requestPermission.mockImplementation(
      () =>
        new Promise<NotificationPermissionState>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    renderSettings();

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(mocks.requestPermission).toHaveBeenCalledTimes(1);

    resolveRequest("granted");
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith({
        updates: { notificationsEnabled: true },
      }),
    );
  });

  it("disables the toggle when no profile is loaded", () => {
    stubNotificationApi();
    mocks.profile = null;
    renderSettings();

    expect(
      (screen.getByRole("switch") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("shows a sample notification from the test action when enabled", async () => {
    stubNotificationApi();
    mocks.profile = { notificationsEnabled: true };
    mocks.permission = "granted";
    renderSettings();

    const testRow = screen.getByRole("button", {
      name: /Send test notification/,
    }) as HTMLButtonElement;
    expect(testRow.disabled).toBe(false);

    fireEvent.click(testRow);

    await waitFor(() => expect(mocks.constructed).toHaveLength(1));
    expect(mocks.constructed[0]?.title).toBe("Nyx Fit");
  });

  it("keeps the test action disabled while notifications are off", () => {
    stubNotificationApi();
    renderSettings();

    const testRow = screen.getByRole("button", {
      name: /Send test notification/,
    }) as HTMLButtonElement;
    expect(testRow.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/routes/settings.test.tsx`
Expected: FAIL — today's "Notifications" row is a dead `SettingsItem` button (settings.tsx:208), so the first test cannot find `role "switch"`.

- [ ] **Step 3: Implement the Settings page changes**

In `src/routes/settings.tsx`:

1. Extend imports: add `BellRing` to the lucide-react import list (line 3-26), add `useRef` to the react import (line 27), and add:

```tsx
import { Switch } from "@/components/ui/switch";
import { useUpsertCurrentProfile } from "@/lib/api/hooks";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showSystemNotification,
  type NotificationPermissionState,
} from "@/lib/notifications";
import { useToast } from "@/lib/toast";
```

2. Extend `SettingsItem` with a `disabled` prop (keep the existing `icon: any` prop type untouched — do not reformat old code):

```tsx
const SettingsItem = ({
  icon: Icon,
  label,
  onClick,
  value,
  isDestructive = false,
  disabled = false,
}: {
  icon: any;
  label: string;
  onClick?: () => void;
  value?: string;
  isDestructive?: boolean;
  disabled?: boolean;
}) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full flex items-center justify-between p-4 min-h-[3.25rem] bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors",
      disabled && "opacity-50"
    )}
  >
```

3. Inside `SettingsPage`, after the `useAppearance()` destructure, add the permission state and handlers:

```tsx
const { upsertCurrentProfile } = useUpsertCurrentProfile();
const { error: showError } = useToast();
const [notificationPermission, setNotificationPermission] =
  useState<NotificationPermissionState>("unsupported");
const [isRequestingPermission, setIsRequestingPermission] = useState(false);
const requestingRef = useRef(false);

useEffect(() => {
  const refreshPermission = () =>
    setNotificationPermission(getNotificationPermission());
  refreshPermission();
  document.addEventListener("visibilitychange", refreshPermission);
  window.addEventListener("focus", refreshPermission);
  return () => {
    document.removeEventListener("visibilitychange", refreshPermission);
    window.removeEventListener("focus", refreshPermission);
  };
}, []);

const notificationEnabled =
  (profile?.notificationsEnabled ?? false) &&
  notificationPermission === "granted";

const notificationsDescription = (() => {
  if (notificationPermission === "unsupported")
    return "Not supported on this browser";
  if (notificationPermission === "denied")
    return "Blocked — allow notifications in your device settings";
  if (notificationEnabled)
    return "On — rest timer alerts appear on your device";
  if (notificationPermission === "granted")
    return "Off — tap to turn system notifications back on";
  return "Off — tap to allow system notifications";
})();

const handleToggleNotifications = async () => {
  if (!profile || requestingRef.current) return;

  if (notificationEnabled) {
    requestingRef.current = true;
    try {
      await upsertCurrentProfile({ updates: { notificationsEnabled: false } });
    } finally {
      requestingRef.current = false;
    }
    return;
  }

  if (notificationPermission === "unsupported") {
    showError("Notifications are not supported on this browser.");
    return;
  }

  if (notificationPermission === "denied") {
    showError(
      "Notifications are blocked. Allow them in your device settings, then try again."
    );
    return;
  }

  requestingRef.current = true;
  setIsRequestingPermission(true);
  try {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      await upsertCurrentProfile({ updates: { notificationsEnabled: true } });
    }
  } finally {
    requestingRef.current = false;
    setIsRequestingPermission(false);
  }
};

const handleTestNotification = async () => {
  const shown = await showSystemNotification("Nyx Fit", {
    body: "System notifications are working. Rest timer alerts will appear like this.",
    tag: "nyx-test",
  });
  if (!shown) {
    showError(
      "Could not show a notification. Check your notification permission."
    );
  }
};
```

The `requestingRef` guards the rapid-double-tap input class (Review Focus item 5); `isRequestingPermission` state drives the Switch's `disabled` rendering.

4. Replace the dead row `<SettingsItem icon={Bell} label="Notifications" />` (line 208) with the toggle label and the test action:

```tsx
<label className="w-full flex items-center justify-between gap-3 p-4 min-h-[3.25rem] bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
  <span className="flex items-center gap-3 text-left">
    <span className="h-10 w-10 rounded-full flex items-center justify-center bg-white/10 text-zinc-400">
      <Bell size={20} />
    </span>
    <span className="flex flex-col">
      <span className="font-medium text-zinc-200">Notifications</span>
      <span className="text-xs text-zinc-500">
        {notificationsDescription}
      </span>
    </span>
  </span>
  <Switch
    checked={notificationEnabled}
    disabled={!profile || isRequestingPermission}
    onCheckedChange={() => void handleToggleNotifications()}
  />
</label>
<SettingsItem
  icon={BellRing}
  label="Send test notification"
  onClick={() => void handleTestNotification()}
  disabled={!notificationEnabled}
/>
```

- [ ] **Step 4: Align the profile-form checkbox**

In `src/routes/settings_.profile.tsx`, route the existing checkbox (lines 409-424) through the shared helpers so checking it requests permission and an ungranted result never persists. Add the import:

```tsx
import { isNotificationSupported, requestNotificationPermission } from "@/lib/notifications";
```

Add the handler next to the other local handlers (reuse the file's existing `toastError` helper):

```tsx
const handleNotificationToggle = async (checked: boolean) => {
  if (!checked) {
    setField("notificationsEnabled", false);
    return;
  }
  if (!isNotificationSupported()) {
    toastError("Notifications are not supported on this browser.");
    return;
  }
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    toastError(
      "Notifications are blocked. Allow them in your browser settings, then try again."
    );
    return;
  }
  setField("notificationsEnabled", true);
};
```

and change the checkbox `onChange` (line 414-416) to:

```tsx
onChange={(e) => void handleNotificationToggle(e.target.checked)}
```

The existing save flow keeps persisting `notificationsEnabled` with the rest of the profile (line 155) — unchanged.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `bun run test src/routes/settings.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 6: Run the gates and commit**

Run: `bun run typecheck && bun run test`
Expected: all PASS.

```bash
git add src/routes/settings.tsx src/routes/settings_.profile.tsx src/routes/settings.test.tsx
git commit -m "feat: permission-aware notifications toggle and test action in settings"
```

---

### Task 5: Onboarding Reminders opt-in

**Files:**
- Modify: `src/components/onboarding/lumen/config.ts` (extend `lumenCopy.ready`, around line 88)
- Modify: `src/components/onboarding/lumen/screens/LumenReadyScreen.tsx` (add the reminders card)
- Modify: `src/components/onboarding/OnboardingFlow.tsx` (add reminders state + handler, pass props at the `done` step, lines 300-314)
- Test: `src/components/onboarding/OnboardingFlow.test.tsx` (append a describe block)

**Interfaces:**
- Consumes: `isNotificationSupported`, `requestNotificationPermission` from `@/lib/notifications` (Task 3); `useUpsertCurrentProfile` (already mocked in this test file, line 71-73); `Switch` from `@/components/ui/switch`.
- Produces: `LumenReadyScreen` gains required props `remindersEnabled: boolean`, `remindersPending: boolean`, `reminderError: string | null`, `onToggleReminders: () => void`; `lumenCopy.ready` gains the copy keys shown below. The `done` step is only reachable after the profile save succeeded (session exists, `OnboardingFlow.tsx:136-137`), so the opt-in mutation always has a session.

- [ ] **Step 1: Write the failing test**

Append to `src/components/onboarding/OnboardingFlow.test.tsx` (reuse the file's existing helpers: `seedDraft`, `signIn`, `findHeading`; add one local helper):

```ts
function installFakeNotification(
  permission: "granted" | "denied" | "default",
) {
  const requestPermission = vi.fn(async () => permission);
  const FakeNotification = Object.assign(function (this: unknown) {}, {
    permission,
    requestPermission,
  });
  vi.stubGlobal("Notification", FakeNotification);
  return requestPermission;
}
```

```ts
describe("onboarding reminders", () => {
  it("requests permission and saves the reminders opt-in on the ready screen", async () => {
    const requestPermission = installFakeNotification("granted");
    seedDraft("auth", "advanced");
    signIn();
    render(<OnboardingFlow />);
    await findHeading("You’re ready to begin.");
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith({
      updates: { fitnessLevel: "advanced" },
    });

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenLastCalledWith({
        updates: { notificationsEnabled: true },
      }),
    );
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it("shows an error and skips persistence when permission is denied", async () => {
    installFakeNotification("denied");
    seedDraft("auth", "advanced");
    signIn();
    render(<OnboardingFlow />);
    await findHeading("You’re ready to begin.");

    fireEvent.click(screen.getByRole("switch"));

    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toMatch(/blocked/);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });

  it("persists the opt-out without requesting permission when reminders are already on", async () => {
    installFakeNotification("granted");
    seedDraft("auth", "advanced");
    signIn();
    render(<OnboardingFlow />);
    await findHeading("You’re ready to begin.");

    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenLastCalledWith({
        updates: { notificationsEnabled: true },
      }),
    );

    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenLastCalledWith({
        updates: { notificationsEnabled: false },
      }),
    );
  });
});
```

Also extend the file's `afterEach` (top-level, line 86-89 region) with `vi.unstubAllGlobals();` so the Notification stub never leaks between tests.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/components/onboarding/OnboardingFlow.test.tsx`
Expected: FAIL — the new describe cannot find `role "switch"` on the ready screen (no reminders toggle exists yet).

- [ ] **Step 3: Implement**

1. In `src/components/onboarding/lumen/config.ts`, extend the `ready` block of `lumenCopy` (keep the existing `heading`/`action` values, add):

```ts
ready: {
  heading: "You’re ready to begin.",
  action: "Get fit",
  remindersTitle: "Reminders",
  remindersDescription: "Rest timer alerts while you’re away from the app.",
  remindersErrorUnsupported: "Notifications are not supported on this device.",
  remindersErrorDenied:
    "Notifications are blocked. Allow them in your browser settings and try again.",
  remindersErrorDismissed:
    "Permission was dismissed. Tap again to allow notifications.",
  remindersErrorSave: "Couldn’t save that. Try again.",
},
```

2. In `src/components/onboarding/lumen/screens/LumenReadyScreen.tsx` — add `Bell` to the lucide import, add `import { Switch } from "@/components/ui/switch";`, extend the props:

```tsx
export function LumenReadyScreen({
  level,
  action = lumenCopy.ready.action,
  disabled = false,
  remindersEnabled,
  remindersPending,
  reminderError,
  onToggleReminders,
  onOpenDashboard,
}: {
  level: ExperienceLevel | null;
  action?: string;
  disabled?: boolean;
  remindersEnabled: boolean;
  remindersPending: boolean;
  reminderError: string | null;
  onToggleReminders: () => void;
  onOpenDashboard: () => void;
}) {
```

and insert the reminders card between the level card and the bottom button block:

```tsx
<div className="lm-shadow-card mt-3 flex w-full items-center gap-3.5 rounded-[20px] border border-lm-line bg-white p-4 text-left">
  <span aria-hidden="true" className="shrink-0 text-lm-forest">
    <Bell className="size-7" strokeWidth={1.5} />
  </span>
  <span className="min-w-0 flex-1">
    <span className="block text-[15px] leading-5 font-bold text-lm-ink">
      {lumenCopy.ready.remindersTitle}
    </span>
    <span className="block text-[12px] leading-4 text-lm-ink-faint">
      {lumenCopy.ready.remindersDescription}
    </span>
    {reminderError !== null ? (
      <span
        role="alert"
        className="mt-1 block text-[12px] leading-4 text-red-600"
      >
        {reminderError}
      </span>
    ) : null}
  </span>
  <Switch
    checked={remindersEnabled}
    disabled={remindersPending}
    onCheckedChange={onToggleReminders}
  />
</div>
```

3. In `src/components/onboarding/OnboardingFlow.tsx` — add the import (lumenCopy comes from `./lumen/config`; the notification helpers from `@/lib/notifications`), the state, the handler, and the props pass-through:

```tsx
import { lumenCopy } from "./lumen/config";
import {
  isNotificationSupported,
  requestNotificationPermission,
} from "@/lib/notifications";
```

```tsx
const [remindersEnabled, setRemindersEnabled] = useState(false);
const [remindersPending, setRemindersPending] = useState(false);
const [reminderError, setReminderError] = useState<string | null>(null);

const toggleReminders = useCallback(async () => {
  if (remindersPending) return;

  if (remindersEnabled) {
    setReminderError(null);
    setRemindersPending(true);
    try {
      await upsertCurrentProfile({ updates: { notificationsEnabled: false } });
      setRemindersEnabled(false);
    } catch {
      setReminderError(lumenCopy.ready.remindersErrorSave);
    } finally {
      setRemindersPending(false);
    }
    return;
  }

  if (!isNotificationSupported()) {
    setReminderError(lumenCopy.ready.remindersErrorUnsupported);
    return;
  }

  setRemindersPending(true);
  const permission = await requestNotificationPermission();
  setRemindersPending(false);

  if (permission === "granted") {
    setReminderError(null);
    setRemindersEnabled(true);
    try {
      await upsertCurrentProfile({ updates: { notificationsEnabled: true } });
    } catch {
      setReminderError(lumenCopy.ready.remindersErrorSave);
    }
    return;
  }

  if (permission === "denied") {
    setReminderError(lumenCopy.ready.remindersErrorDenied);
    return;
  }

  setReminderError(lumenCopy.ready.remindersErrorDismissed);
}, [remindersPending, remindersEnabled, upsertCurrentProfile]);
```

and pass to the `done` step's `LumenReadyScreen` (case `"done"`, lines 301-314):

```tsx
<LumenReadyScreen
  level={fitnessLevel}
  action={doneAction}
  disabled={leaving}
  remindersEnabled={remindersEnabled}
  remindersPending={remindersPending}
  reminderError={reminderError}
  onToggleReminders={() => void toggleReminders()}
  onOpenDashboard={() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    clearOnboardingDraft();
    router.history.replace(destination);
  }}
/>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/components/onboarding/OnboardingFlow.test.tsx`
Expected: PASS (existing tests plus the three new ones).

- [ ] **Step 5: Run the gates and commit**

Run: `bun run typecheck && bun run test`
Expected: all PASS.

```bash
git add src/components/onboarding/OnboardingFlow.tsx src/components/onboarding/OnboardingFlow.test.tsx src/components/onboarding/lumen/config.ts src/components/onboarding/lumen/screens/LumenReadyScreen.tsx
git commit -m "feat: reminders opt-in on the onboarding ready screen"
```

---

### Task 6: notificationclick handler in the service worker

**Files:**
- Create: `src/lib/sw/generateSwConfig.ts`
- Modify: `scripts/generate-sw.mjs` (header comment lines 1-8; config block lines 18-56; cleanup-source block lines 58-61; file writes at line 67; generation call lines 69-73)
- Test: `src/lib/sw/generateSwConfig.test.ts` (create; server/node project)

**Interfaces:**
- Consumes: `workbox-build` `generateSW` (already used by the script; version 7.4.0).
- Produces (consumed by `scripts/generate-sw.mjs` in this task and by Task 8):

```ts
export const SW_CLEANUP_SOURCE: string;          // legacy "nyx-pages" cache purge listener
export const SW_NOTIFICATIONS_SOURCE: string;    // notificationclick focus/open-window listener
export function buildWorkboxConfig(): {
  globPatterns: string[];
  globIgnores: string[];
  cleanupOutdatedCaches: boolean;
  skipWaiting: boolean;
  clientsClaim: boolean;
  sourcemap: boolean;
  importScripts: string[];
  runtimeCaching: unknown[];
};
```

At build time the script writes `dist/client/sw-notifications.js` (and the existing `sw-cleanup.js`) and `generateSW` emits `dist/client/sw.js` with `importScripts("/sw-cleanup.js","/sw-notifications.js")`. The `notificationclick` handler closes the notification, focuses the first existing window client (`includeUncontrolled: true`), navigates it to `data.url` when present (falling back to plain focus if `navigate` is unsupported), and only calls `openWindow(targetUrl || "/")` when no window client exists — no duplicate windows (nyx-fitness `public/sw-notifications.js` behavior, adapted to the repo's two-space style).

Note on the import: `scripts/generate-sw.mjs` runs under Bun, which executes TypeScript natively, so the `.mjs` script imports the `.ts` config module directly with an explicit extension.

- [ ] **Step 1: Write the failing test**

Create `src/lib/sw/generateSwConfig.test.ts`:

```ts
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateSW } from "workbox-build";
import {
  buildWorkboxConfig,
  SW_NOTIFICATIONS_SOURCE,
} from "./generateSwConfig";

describe("service worker generation config", () => {
  it("wires the notification click handler alongside the cleanup script", () => {
    const config = buildWorkboxConfig();
    expect(config.importScripts).toEqual([
      "/sw-cleanup.js",
      "/sw-notifications.js",
    ]);
  });

  it("focuses an existing window and only opens one when no window client exists", () => {
    expect(SW_NOTIFICATIONS_SOURCE).toContain(
      'self.addEventListener("notificationclick"',
    );
    expect(SW_NOTIFICATIONS_SOURCE).toContain("event.notification.close()");
    expect(SW_NOTIFICATIONS_SOURCE).toContain(
      'matchAll({ type: "window", includeUncontrolled: true })',
    );
    expect(SW_NOTIFICATIONS_SOURCE).toContain('openWindow(targetUrl || "/")');
    expect(SW_NOTIFICATIONS_SOURCE).toContain("client.focus()");
  });

  it("generates a service worker that imports the handler", async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), "nyx-sw-"));
    await writeFile(path.join(workDir, "favicon-96x96.png"), "png");
    const { warnings } = await generateSW({
      ...buildWorkboxConfig(),
      globDirectory: workDir,
      swDest: path.join(workDir, "sw.js"),
    });

    expect(warnings).toEqual([]);
    const generated = await readFile(path.join(workDir, "sw.js"), "utf8");
    expect(generated).toContain('"/sw-notifications.js"');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/lib/sw/generateSwConfig.test.ts`
Expected: FAIL — `Failed to resolve import "./generateSwConfig"` (module does not exist).

- [ ] **Step 3: Create the config module**

Create `src/lib/sw/generateSwConfig.ts` (this is the single source of truth for the SW config; the script and the test both consume it):

```ts
export const SW_CLEANUP_SOURCE = `self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("nyx-pages"));
});
`;

export const SW_NOTIFICATIONS_SOURCE = `self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = typeof data.url === "string" ? data.url : null;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const client = clientList[0];

        if (!client) {
          if (self.clients.openWindow) {
            return self.clients.openWindow(targetUrl || "/");
          }
          return undefined;
        }

        const focus = client.focus();
        if (targetUrl && "navigate" in client) {
          return client.navigate(targetUrl).catch(() => focus);
        }
        return focus;
      })
  );
});
`;

export function buildWorkboxConfig() {
  return {
    globPatterns: ["**/*.{ico,png,svg,webp,woff2,json}"],
    globIgnores: ["favicon/splash/**", "onboarding/**"],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
    sourcemap: false,
    importScripts: ["/sw-cleanup.js", "/sw-notifications.js"],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-stylesheets",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/lib/sw/generateSwConfig.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Rewire the script onto the config module**

Rewrite `scripts/generate-sw.mjs` to import the shared config and write the notification handler file. Full new content:

```js
/**
 * Single service-worker generator for the Cloudflare Workers build.
 * vite-plugin-pwa skips SW generation for SSR builds (TanStack Start), so this
 * post-build step owns dist/client/sw.js.
 *
 * Scope: static assets, fonts, and the notificationclick handler (shared
 * source in src/lib/sw/generateSwConfig.ts). Authenticated HTML, API routes
 * and server functions stay network-only.
 */
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSW } from "workbox-build";
import {
  buildWorkboxConfig,
  SW_CLEANUP_SOURCE,
  SW_NOTIFICATIONS_SOURCE,
} from "../src/lib/sw/generateSwConfig.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const globDirectory = path.join(root, "dist/client");

if (!existsSync(globDirectory)) {
  throw new Error(`Missing build output directory: ${globDirectory}`);
}

await writeFile(path.join(globDirectory, "sw-cleanup.js"), SW_CLEANUP_SOURCE);
await writeFile(
  path.join(globDirectory, "sw-notifications.js"),
  SW_NOTIFICATIONS_SOURCE,
);

const { count, size, warnings } = await generateSW({
  ...buildWorkboxConfig(),
  globDirectory,
  swDest: path.join(globDirectory, "sw.js"),
});

console.log(
  `Generated dist/client/sw.js — ${count} files, ${size} bytes precached`
);
for (const warning of warnings) {
  console.warn(warning);
}
```

Notes: the `importScripts` entry moves into `buildWorkboxConfig()` (workbox emits `importScripts("/sw-cleanup.js","/sw-notifications.js")` at the top of the generated worker, exactly like the existing single-entry behavior in `dist/client/sw.js`); `sw-notifications.js` is not precached (the glob patterns include no `js`), matching `sw-cleanup.js`.

- [ ] **Step 6: Run the gates and commit**

Run: `bun run typecheck && bun run test`
Expected: all PASS.

```bash
git add src/lib/sw/generateSwConfig.ts src/lib/sw/generateSwConfig.test.ts scripts/generate-sw.mjs
git commit -m "feat: notificationclick handler in the generated service worker"
```

Verification (build artifact): run `bun run build`; expected console line `Generated dist/client/sw.js — ...` and `dist/client/sw-notifications.js` present. Manual verification (device or `bun run preview` with DevTools offline simulation, per the AGENTS.md browser-tooling restriction): tap a test notification with the app in the background — the existing window comes to the foreground; no second window opens.

---

### Task 7: Offline-resilient root auth loader

**Files:**
- Modify: `src/routes/__root.tsx` (`beforeLoad`, lines 133-137)
- Test: `src/routes/-root.test.tsx` (create)

**Interfaces:**
- Consumes: `fetchAuth` from `@/lib/api/auth.functions` (mocked at the module boundary in the test — it is a server function that cannot run in tests).
- Produces: the root `beforeLoad` resolves to `{ userId: string | null }` and never rejects. Task 8's cached-shell hydration depends on this: when an offline cold start replays the loader client-side, a thrown network error would otherwise kill the whole tree; instead the app hydrates signed-out and converges once connectivity returns.

- [ ] **Step 1: Write the failing test**

Create `src/routes/-root.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "./__root";

const mocks = vi.hoisted(() => ({ fetchAuth: vi.fn() }));

vi.mock("@/lib/api/auth.functions", () => ({
  fetchAuth: mocks.fetchAuth,
}));

function runBeforeLoad(): Promise<{ userId: string | null }> {
  const loader = Route.options.beforeLoad;
  if (!loader) {
    throw new Error("Root beforeLoad is unavailable");
  }
  return loader(
    {} as Parameters<typeof loader>[0],
  ) as Promise<{ userId: string | null }>;
}

afterEach(() => {
  mocks.fetchAuth.mockReset();
});

describe("root auth loader", () => {
  it("resolves to a signed-out context when auth cannot be reached offline", async () => {
    mocks.fetchAuth.mockRejectedValue(new Error("Network unreachable"));

    await expect(runBeforeLoad()).resolves.toEqual({ userId: null });
  });

  it("passes through the signed-in user when auth resolves", async () => {
    mocks.fetchAuth.mockResolvedValue({ userId: "user-1" });

    await expect(runBeforeLoad()).resolves.toEqual({ userId: "user-1" });
  });
});
```

Note on the two casts in `runBeforeLoad`: `Parameters<typeof loader>[0]` is the exact declared parameter type (not a blind cast), and the return cast matches the loader's actual runtime shape `{ userId }`; both keep strict TS happy while calling the route option directly, which is the established route-seam pattern in this repo (`src/routes/-workout.$id.test.tsx` calls `Route.options.component` the same way).

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/routes/-root.test.tsx`
Expected: FAIL — first test: the loader rejects (unhandled rejection surfaces as a rejected promise) instead of resolving `{ userId: null }`.

- [ ] **Step 3: Implement**

In `src/routes/__root.tsx`, replace the `beforeLoad` (lines 133-137):

```tsx
beforeLoad: async () => {
  try {
    const { userId } = await fetchAuth();
    return { userId };
  } catch {
    return { userId: null };
  }
},
```

Online behavior is unchanged (the try body is the old code). Offline, the loader degrades to signed-out instead of rejecting — the same degradation the OfflineBanner copy already promises ("sign in and sync need a connection").

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/routes/-root.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the gates and commit**

Run: `bun run typecheck && bun run test`
Expected: all PASS.

```bash
git add src/routes/__root.tsx src/routes/-root.test.tsx
git commit -m "feat: degrade root auth load to signed-out when offline"
```

---

### Task 8: Offline app shell for the root URL

**Files:**
- Modify: `src/lib/sw/generateSwConfig.ts` (add shell cache constants + runtime-caching entry)
- Modify: `scripts/generate-sw.mjs` (scope comment only)
- Test: `src/lib/sw/generateSwConfig.test.ts` (append a describe block)

**Interfaces:**
- Consumes: `buildWorkboxConfig()` from Task 6.
- Produces:

```ts
export const SHELL_CACHE_NAME: string;   // "nyx-shell"
export const SHELL_URL_PATTERN: RegExp;  // /^https?:\/\/[^/]+\/?$/
```

At build time the generated `sw.js` gains one runtime route: a `NetworkFirst` handler (3s network timeout, 1 entry, 7-day expiry, `cacheableResponse [200]`) on the exact origin-root URL, in cache `nyx-shell`. Effect: the last successful visit to `/` is cached; an offline cold start at `/` (the manifest `start_url`) serves that cached document; every other path, and every `/api/**` or server-function URL, stays network-only exactly as today.

Why not workbox `navigateFallback`: the SSR build has no precachable HTML document in `dist/client` (no `index.html`), so `navigateFallback` is unusable, and serving the cached `/` document at other paths (e.g. `/stats`) would hydrate HTML rendered for a different route. Restricting the cache-and-fallback to the exact root URL keeps hydration consistent (HTML route == location route) and leaves deep links to fail with the browser's offline error, which the OfflineBanner already explains. Dev has no service worker at all (`src/lib/pwa.ts:36` skips registration in DEV), so this is production/preview-only; the stale `dev-dist/` artifacts are legacy from the pre-Cloudflare vite-plugin-pwa dev setup and are not touched.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/sw/generateSwConfig.test.ts` (add `SHELL_URL_PATTERN` to the existing import from `./generateSwConfig`):

```ts
describe("offline shell route", () => {
  it("matches only the bare origin root URL", () => {
    expect(SHELL_URL_PATTERN.test("https://nyx-fit.example.com/")).toBe(true);
    expect(SHELL_URL_PATTERN.test("https://nyx-fit.example.com")).toBe(true);
    expect(SHELL_URL_PATTERN.test("http://localhost:3000/")).toBe(true);
    expect(SHELL_URL_PATTERN.test("https://nyx-fit.example.com/workouts")).toBe(
      false,
    );
    expect(
      SHELL_URL_PATTERN.test("https://nyx-fit.example.com/api/auth/session"),
    ).toBe(false);
    expect(
      SHELL_URL_PATTERN.test("https://nyx-fit.example.com/?redirect=%2Fstats"),
    ).toBe(false);
  });

  it("caches the root document network-first so an offline cold start can serve the last shell", async () => {
    const workDir = await mkdtemp(path.join(tmpdir(), "nyx-sw-"));
    await writeFile(path.join(workDir, "favicon-96x96.png"), "png");
    await generateSW({
      ...buildWorkboxConfig(),
      globDirectory: workDir,
      swDest: path.join(workDir, "sw.js"),
    });

    const generated = await readFile(path.join(workDir, "sw.js"), "utf8");
    expect(generated).toContain("nyx-shell");
    expect(generated).toContain("NetworkFirst");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/lib/sw/generateSwConfig.test.ts`
Expected: FAIL — `SHELL_URL_PATTERN` is not exported by "./generateSwConfig" (no shell route exists).

- [ ] **Step 3: Implement**

In `src/lib/sw/generateSwConfig.ts`, add above `buildWorkboxConfig`:

```ts
export const SHELL_CACHE_NAME = "nyx-shell";
export const SHELL_URL_PATTERN = /^https?:\/\/[^/]+\/?$/;
```

and insert this as the FIRST entry of `runtimeCaching` (explicit ordering; the font patterns cannot overlap it, but the order is part of the produced contract):

```ts
{
  urlPattern: SHELL_URL_PATTERN,
  handler: "NetworkFirst",
  options: {
    cacheName: SHELL_CACHE_NAME,
    networkTimeoutSeconds: 3,
    expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 7 },
    cacheableResponse: { statuses: [200] },
  },
},
```

In `scripts/generate-sw.mjs`, update the scope comment only (no logic changes):

```js
 * Scope: static assets, fonts, the notificationclick handler, and an offline
 * shell for the exact root URL (runtime network-first cache "nyx-shell").
 * Authenticated HTML, API routes and server functions stay network-only.
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/lib/sw/generateSwConfig.test.ts`
Expected: PASS (existing tests plus the two new ones).

- [ ] **Step 5: Run the gates and commit**

Run: `bun run typecheck && bun run test`
Expected: all PASS.

```bash
git add src/lib/sw/generateSwConfig.ts src/lib/sw/generateSwConfig.test.ts scripts/generate-sw.mjs
git commit -m "feat: offline app shell for the root URL in the service worker"
```

Verification (build artifact): run `bun run build`, then `grep -c "nyx-shell" dist/client/sw.js` (expected: at least 1) and confirm `dist/client/sw-notifications.js` still exists. Manual verification (device or preview with DevTools offline simulation): load `/`, go offline, reload — the cached shell renders with the offline banner; auth/data surfaces show their existing offline states rather than a blank page.

---

### Task 9: App version in Settings About

**Files:**
- Modify: `package.json` (add a `version` field — outside `src/` and `docs/`, so this edit is part of what the plan review approves)
- Create: `src/lib/version.ts`
- Test: `src/lib/version.test.ts` (create; server/node project)
- Modify: `src/routes/settings.tsx` ("About application" row, line 231)

**Interfaces:**
- Consumes: `package.json` `version` field (read directly by the drift-pinning test).
- Produces: `export const APP_VERSION: string;` from `@/lib/version` — displayed in the Settings "About application" row via its existing `value` prop (settings.tsx:113-121 already renders `value`).

Chosen approach: a one-line constant module plus a test that pins it to `package.json`. Importing `package.json` directly would inline the full dependency manifest into the client bundle and require a new `resolveJsonModule` tsconfig flag; the constant keeps the bundle clean and the test turns version drift into a loud failure instead of a silent mismatch. (Alternative considered and rejected on bundle-cleanliness grounds.)

- [ ] **Step 1: Write the failing test**

Create `src/lib/version.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "./version";

describe("app version", () => {
  it("matches the package.json version", () => {
    const raw = readFileSync(
      new URL("../../package.json", import.meta.url),
      "utf8",
    );
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("package.json is not an object.");
    }
    const version = (parsed as Record<string, unknown>).version;
    expect(version).toBe(APP_VERSION);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run test src/lib/version.test.ts`
Expected: FAIL — `Failed to resolve import "./version"` (module does not exist).

- [ ] **Step 3: Implement**

1. In `package.json`, add after the `"private": true,` line (line 2):

```json
"version": "0.1.0",
```

2. Create `src/lib/version.ts`:

```ts
export const APP_VERSION = "0.1.0";
```

3. In `src/routes/settings.tsx` — add the import and give the About row its value:

```tsx
import { APP_VERSION } from "@/lib/version";
```

```tsx
<SettingsItem icon={Info} label="About application" value={APP_VERSION} />
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run test src/lib/version.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the gates and commit**

Run: `bun run typecheck && bun run test`
Expected: all PASS.

```bash
git add package.json src/lib/version.ts src/lib/version.test.ts src/routes/settings.tsx
git commit -m "feat: show the app version in settings about"
```

Manual verification: Settings > "About application" shows `0.1.0`. When releasing, bump `package.json` and `APP_VERSION` together — the drift test enforces it.

---

## Self-Review

**1. Spec coverage** — every mission requirement maps to a task:

| Mission requirement | Task |
|---|---|
| Settings toggle: request permission on enable, explain denied/unsupported, live-track via visibilitychange/focus, persist notificationsEnabled | Task 4 (Step 3) |
| Send Test Notification settings action | Task 4 (test "shows a sample notification...", Step 3 handler) |
| Onboarding Reminders opt-in on the final step, requests permission, persists choice | Task 5 |
| notificationclick SW handler focusing existing window / navigating / opening one | Task 6 |
| Custom exercises: type any name, preset wheel kept as quick-pick, category override retained | Task 1 |
| Per-exercise cards show set count and total volume | Task 2 |
| Offline navigation fallback without breaking SSR | Tasks 7 + 8 |
| App version display | Task 9 |
| 3M chart range | Deferred (reason in Deviations) |
| Export/Import | Deferred (YAGNI, stated in Deviations) |

**2. Placeholder scan** — checked: no "TBD"/"TODO"/"implement later"/"similar to Task N"; every code step is complete copy-pasteable code; the two items that are not tasks (deferrals) are scope decisions with reasons, not placeholders. The single contingency (WheelPicker jsdom mock in Task 1) ships full code with its trigger condition stated.

**3. Type consistency** — checked: `NotificationPermissionState`, `isNotificationSupported`, `getNotificationPermission`, `requestNotificationPermission`, `showSystemNotification`, `SystemNotificationOptions` are defined once (Task 3) and consumed with identical names in Tasks 4 and 5; `buildWorkboxConfig`, `SW_CLEANUP_SOURCE`, `SW_NOTIFICATIONS_SOURCE` are defined in Task 6 and consumed identically by the script and Task 8; `SHELL_CACHE_NAME`/`SHELL_URL_PATTERN` defined and consumed within Task 8's module and tests; `APP_VERSION` defined in Task 9 and consumed in the same task; drawer/onAddSet signatures unchanged across Tasks 1 and 2 (`ExerciseItem` and `AddExerciseDrawer` produce no new exports).

**4. Review Focus pins** — all five pinned: iOS-Safari permission rejection (Task 3 + Tasks 4/5 denied tests), preset-name collision (Task 1 route test), offline SSR-session reload (Task 7 beforeLoad test + Task 8 URL-scoping test), very long names (Task 1 parser pin), duplicate rapid toggles (Task 4 pending test + Task 5 pending guard in `toggleReminders`).

**5. Known verification limits** — stated per task: SW runtime behavior (notification click focus, offline shell serving, hydration of the cached shell) is verified by artifact-content tests plus manual device/preview steps; vitest cannot execute a service worker. Reviewers should treat those manual steps as part of the task's definition of done.
