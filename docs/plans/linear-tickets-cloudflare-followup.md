# Cloudflare follow-up tickets (Linear-ready, push on MCP connect)

Source: review of uncommitted Convex→Cloudflare work on `dev-pwa` (67 files changed).
Verification at review time: `tsc --noEmit` clean, `vitest run` 78/78 pass.
Push with Linear MCP: one issue per section below. Suggested project: Nyx Fit, labels: `cloudflare`, `follow-up`.

---

## 1. Fix duplicate D1/R2 bindings in wrangler.jsonc [P1]

`wrangler.jsonc:12-36` declares two `d1_databases` (same name/id: `DB` + dead `nyx_fit remote:true`) and two `r2_buckets` (`IMAGES` + dead `nyx_fit_images`). Code only reads `DB`/`IMAGES` (`src/lib/api/context.server.ts`). `bunx wrangler d1 migrations apply nyx-fit` resolves by `database_name`, now ambiguous.

Acceptance: single D1 entry (with `migrations_dir`) + single R2 entry; `wrangler deploy --dry-run` clean; docs command works.

## 2. Resolve BETTER_AUTH_URL committed-vs-docs contradiction [P1]

`wrangler.jsonc:39` commits a personal `workers.dev` origin as `vars.BETTER_AUTH_URL`; `docs/cloudflare-setup.md:18-21` says it is intentionally absent so local dev fails loudly without `.dev.vars`. Current state silently binds any deploy to the wrong origin.

Acceptance: either remove `vars` entry (prod URL via dashboard secret/var) or rewrite docs paragraph; no account-specific hostname in repo.

## 3. Fix assetlinks path mismatch for TWA verification [P1]

`docs/android-twa.md:11` claims `public/.well-known/assetlinks.json`; actual file is `public/assetlinks.json` (verified: no `.well-known` dir, no handler in `src/`, sync script untouched). DAL requires exact `/.well-known/` path.

Acceptance: move file + update `scripts/sync-assetlinks.mjs`, or fix doc; verify served path.

## 4. Handle concurrent first-profile upsert (500 on double-tap) [P1]

`src/lib/api/store.server.ts:294-336`: read-then-insert with no `ON CONFLICT(userId)` handling. Two concurrent upserts both see `existing === null` → loser gets UNIQUE failure → 500. `setWeightGoalForUser` (`store.server.ts:605`) already shows the `on conflict do update` pattern.

Acceptance: conflict-safe upsert (same pattern as weight goal); concurrent-save test passes.

## 5. Don't bump workout revision on empty updates [P1]

`src/lib/api/store.server.ts:425-463` + `src/lib/api/parsers.ts`: `buildWorkoutUpdate` always starts with `revision + 1`; `{revision, updates:{}}` is accepted as valid. No-op/heartbeat drifts revision and manufactures conflicts.

Acceptance: empty-updates short-circuits returning current row; parser test updated.

## 6. Untrack dev-dist/ stale service worker [P2]

`dev-dist/` is tracked and modified, unignored; `dev-dist/sw.js:80-90` precaches `index.html` + NavigationRoute — the exact behavior the migration removes.

Acceptance: `git rm --cached dev-dist`, add `dev-dist/` to `.gitignore`.

## 7. Fix in-place sort mutating TanStack Query cache [P2]

`src/routes/stats.tsx:175`: `exerciseStats.sort(...)` sorts cached array in place (from `useExerciseStats`, `src/lib/api/hooks.ts:268`). Corrupts cache order for other readers.

Acceptance: `[...exerciseStats].sort(...)` or `.toSorted(...)`.

## 8. Correct error mapping + small correctness batch [P2]

- `src/lib/api/store.server.ts:479-482`: reactivation UNIQUE violation misreported as revision `conflict` — match index name or pre-check active workout.
- `src/lib/api/store.server.ts:412-415`: FK violations swallowed into generic "Unable to start" — narrow catch to UNIQUE on `workouts_one_active_idx`.
- `src/lib/api/store.server.ts:167-171,361`: one corrupt row throws `STORED_DATA_ERROR` for whole list — include row id or skip-and-log.
- `src/lib/auth-server.ts` + `src/lib/api/context.server.ts`: `requireSession` throws plain Error → likely 500 not 401; map to 401 Response like `assertWritableRequest`.
- `src/routes/index.tsx:63-73`: `isStarting` never reset on success (visual-only, overlay Link still works).
- `AGENTS.md:30`: still blesses `convex/` (deleted) — drop from allowed-dirs list.
- Dead `setWeightGoal` trio (`functions.ts:127`, `parsers.ts:423`, `store.server.ts:605`, no hook/UI caller): add `useSetWeightGoal` or delete all three.

Acceptance per bullet; split into separate Linear issues if preferred.

---

## Non-blocking notes (P3, no ticket unless wanted)

- `vite.config.ts:66-71` dead duplicate Workbox block; empty `convex/_generated/` shell on disk; `.gitignore` missing `worker-configuration.d.ts` + stale `.nitro`/`.vinxi`; `docs/ios-capacitor.md:14` says Capacitor 7 vs pinned 8.4.1; `useUpsertCurrentProfile` (`hooks.ts:285-291`) setQueryData + immediate invalidate is redundant; default React Query retries delay offline error banners (`router.tsx:7-15`); pre-existing a11y gaps (unlabeled icon buttons, error banners without `role="alert"`, drawers outside `MotionConfig reducedMotion`); `confirm()` for weight delete; R2 orphan on failed weight save (parity with Convex); smoke script pins internal TanStack path (`docs/reviews/cloudflare-http-smoke.mjs:3`).
- Ownership scoping, single-active-workout index, revision CAS, image ownership double-enforcement, parser discipline all verified correct — including a fixed HEAD bug where `convex/workouts.ts:getWorkout` lacked ownership check.
