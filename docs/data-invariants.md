# Data invariants and known gaps

Read this before changing workouts, stats, auth origins or the build. Each item is a rule future changes must keep, or a gap that is still open.

## Stats rollups (`src/db/migrations/0003_stats.sql`, `src/lib/api/rollups.server.ts`)

- `workouts.exercises` (JSON) is the source of truth. `workoutExercises`, `exerciseRecords` and `weeklyStats` are derived and must stay in sync with it.
- Rollups change only when a workout becomes completed, or when a completed workout is edited or reopened, in one `db.batch` guarded on the workout's revision (`updateWorkoutForUser` in `store.server.ts`). Set edits on an active workout write the `workouts` row and nothing else. Keep it that way.
- **No delete-workout path exists yet.** Any future delete must remove the workout's contribution through the same path (old contribution out, rollups adjusted, lifetime max recomputed if the workout held it). The `workoutExercises` foreign-key cascade alone leaves `exerciseRecords` and `weeklyStats` wrong.
- Changing how stats are computed (exercise identity, week boundaries, volume formula): bump `CURRENT_STATS_VERSION` so every user's rollups rebuild in bounded pages on their next home or stats read.
- Weeks are Monday to Sunday in the profile's IANA `timeZone` (`src/lib/weeks.ts`). `workouts.date` is a UTC instant.
- Exercise identity is `trim().toLowerCase()` of the name.
- Keep the stats check green: `bun src/lib/api/store.sqlite.check.mts` (incremental rollups must equal a full rebuild).

## Reads and caching (`src/lib/api/hooks.ts`)

- Never add unbounded reads of a user's history. Home uses `getHomeSnapshot` (bounded window), stats uses `getStatsOverview` (rollups), the list is keyset-paginated.
- No polling. Invalidate the snapshot, stats and list only when a workout completes, a completed workout changes, the weekly goal, level or time zone changes, or weights change (snapshot only).
- Home snapshot streaks look back 52 weeks; the full history is in `getStatsOverview`.

## Server functions and auth

- A server function must never `throw new Response(...)`: TanStack Start returns a thrown Response to the caller as a successful result. Throw an `Error`.
- Writes and sign-in are allowed only from `BETTER_AUTH_URL` plus `TRUSTED_ORIGINS` (`src/lib/api/origins.ts`). Set `TRUSTED_ORIGINS` for localhost only in `.dev.vars`, never in production.
- better-auth `cookieCache` is on (5 minutes): a session revoked on another device keeps working here for up to 5 minutes.

## Hydration and view transitions

- Keep `<Scripts />` a direct child of `<body>` in `src/routes/__root.tsx`. The server also emits the client-entry script there; React 19 tolerates it only at body level, and anywhere else it is a hydration mismatch that re-renders the whole app on every load.
- Never render browser-only UI during hydration (`typeof document`/`window` checks in render, portals, localStorage reads). Render it after a mount effect, as `ToastProvider` does.
- `installViewTransitionGuard` (`src/lib/view-transitions.ts`, called in `src/router.tsx`) marks aborted route view transitions as handled, because TanStack Router leaves their `ready`/`finished` promises unhandled. Remove it only once TanStack handles them.

## Open cleanup

- `RecentWorkoutsList` is unused (only referenced in commented-out code in `src/routes/index.tsx`).
- The localStorage key `nyx-attendance-success-threshold` is stale (the weekly goal now lives on the profile).
- `useExerciseHistory` / `getExerciseHistory` are wired but no screen uses them yet.
- `scripts/` was restored from before commit e18b36e except `sync-ios-assets.mjs` (Capacitor). `bun run build` runs `scripts/generate-sw.mjs` after `vite build` to write `dist/client/sw.js`.
- Capacitor and iOS wrapper files were removed; native packaging is undecided.
